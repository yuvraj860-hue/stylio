"""STYLIO product index builder.

Builds a ChromaDB vector index from the Kaggle Fashion Product Images (Small)
dataset using a CLIP sentence-transformer model, then (optionally) syncs a
subset of the products to the Express backend catalog.

Prices are only stored when they are real: pass a JSON product-id -> INR price
map with --price-map. Without it, no price is assigned (price=0) instead of a
fabricated value.

Usage:
    python build_index.py --test
    python build_index.py --limit 1000 --batch-size 64 --start 0 --price-map prices.json
    python build_index.py --sync-api --limit 200 --price-map prices.json
"""

from __future__ import annotations

import argparse
import csv
import getpass
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image
from tqdm import tqdm
import chromadb
import requests
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data-prep" / "data"
STYLES_CSV = DATA_DIR / "styles.csv"
IMAGES_DIR = DATA_DIR / "images"

CHROMA_DIR = Path(os.environ.get("STYLIO_CHROMA_DIR", str(REPO_ROOT / "ml-service" / "data" / "chroma")))
COLLECTION_NAME = "stylio_products"

MODEL_NAME = "sentence-transformers/clip-ViT-B-32-multilingual-v1"
IMAGE_SIZE = 224

# Fields present in styles.csv.
STYLE_FIELDS = [
    "id",
    "gender",
    "masterCategory",
    "subCategory",
    "articleType",
    "baseColour",
    "season",
    "year",
    "usage",
    "productDisplayName",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_price_map(path: Optional[Path]) -> Dict[str, str]:
    """Load an optional JSON mapping of product id -> real retail price (INR)."""
    if path is None or not os.path.exists(path):
        return {}
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return {str(k): str(v) for k, v in data.items() if v is not None}
    except (OSError, ValueError):
        print(f"[warn] Could not read price map: {path}")
        return {}


def read_catalog(price_map: Dict[str, str]) -> List[Dict[str, Any]]:
    """Parse styles.csv into a list of product dicts keyed by string id."""
    if not STYLES_CSV.exists():
        print(f"[error] Missing {STYLES_CSV}. Run download_dataset.py first.")
        sys.exit(1)

    catalog: List[Dict[str, Any]] = []
    with open(STYLES_CSV, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            pid = (row.get("id") or "").strip()
            catalog.append({field: (row.get(field) or "").strip() for field in STYLE_FIELDS})
            # Real price only when the caller supplies one; never fabricated.
            catalog[-1]["price"] = price_map.get(pid, "")
    print(f"[info] Loaded {len(catalog)} product rows from styles.csv")
    return catalog


def image_path_for(product: Dict[str, Any]) -> Optional[Path]:
    """Locate the local image for a product id."""
    pid = str(product["id"])
    for ext in (".jpg", ".jpeg", ".png"):
        candidate = IMAGES_DIR / f"{pid}{ext}"
        if candidate.exists():
            return candidate
    return None


def load_image(path: Path) -> Optional[Any]:
    """Open an image, convert to RGB, resize to 224x224. Returns a PIL Image."""
    try:
        img = Image.open(path).convert("RGB").resize((IMAGE_SIZE, IMAGE_SIZE))
        return img
    except (OSError, ValueError):
        return None


def image_url_for(product: Dict[str, Any], local_base: Optional[str]) -> str:
    """Build the image URL for metadata (requires a real, resolvable base URL)."""
    if local_base:
        return f"{local_base.rstrip('/')}/{product['id']}/1.jpg"
    # No fabricated placeholder URLs — leave empty so consumers fall back to local images.
    return ""


# ---------------------------------------------------------------------------
# Embedding + indexing
# ---------------------------------------------------------------------------

def get_client() -> chromadb.Client:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def build_metadata(product: Dict[str, Any], img_path: Path, local_base: Optional[str]) -> Dict[str, str]:
    """Assemble the ChromaDB metadata dict for a single product."""
    category = f"{product['masterCategory']} / {product['subCategory']}"
    real_price = product.get("price", "")
    return {
        "product_id": str(product["id"]),
        "name": product["productDisplayName"] or f"Fashion item {product['id']}",
        "category": category,
        "article_type": product["articleType"],
        "base_colour": product["baseColour"],
        "price": str(real_price) if real_price else "0",
        "image_url": image_url_for(product, local_base),
        "local_image": str(img_path),
        "price_available": "true" if real_price else "false",
    }


def process_batch(model: SentenceTransformer, paths: List[Path]) -> List[Optional[List[float]]]:
    """Embed a batch of image paths. PIL doesn't accept a list directly, so
    preload the images and encode the loaded batch at once."""
    images = [load_image(p) for p in paths]
    valid_mask = [img is not None for img in images]
    valid_images = [img for img in images if img is not None]

    embeddings: List[Optional[List[float]]] = [None] * len(paths)
    if not valid_images:
        return embeddings

    vectors = model.encode(valid_images, batch_size=len(valid_images), convert_to_numpy=True)
    j = 0
    for i, valid in enumerate(valid_mask):
        if valid:
            embeddings[i] = vectors[j].tolist()
            j += 1
    return embeddings


def build_index(products: List[Dict[str, Any]], args: argparse.Namespace) -> None:
    """Embed products and upsert them into ChromaDB."""
    print(f"[info] Loading model: {MODEL_NAME}")
    device = "cpu"
    if not args.cpu:
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
        except ImportError:
            pass
    model = SentenceTransformer(MODEL_NAME, device=device)

    # Select the slice of products to index.
    end = None if args.limit is None else args.start + args.limit
    slice_ = products[args.start:end]

    # Build the list of (product, image_path) pairs that actually exist on disk.
    pairs: List[tuple] = []
    for product in slice_:
        img_path = image_path_for(product)
        if img_path is not None:
            pairs.append((product, img_path))
    if args.test:
        pairs = pairs[:50]
    print(f"[info] Indexing {len(pairs)} products with local images.")

    client = get_client()
    collection = client.get_or_create_collection(
        COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
    )

    batch_size = args.batch_size
    pbar = tqdm(total=len(pairs), desc="Upserting to ChromaDB", unit="img")
    pbar.set_description("Embedding+upserting")

    for i in range(0, len(pairs), batch_size):
        chunk = pairs[i : i + batch_size]
        products_chunk = [p for p, _ in chunk]
        paths_chunk = [img for _, img in chunk]

        embeddings = process_batch(model, paths_chunk)
        if args.test:
            pbar.update(batch_size)
            continue  # test mode: exercise pipeline, no real upsert

        ids: List[str] = [str(p["id"]) for p in products_chunk]
        metadatas: List[Dict[str, str]] = [build_metadata(p, img, args.image_url_base) for p, img in chunk]

        # Drop products whose embedding failed.
        keep = [k for k, emb in enumerate(embeddings) if emb is not None]
        if not keep:
            continue

        collection.upsert(
            ids=[ids[k] for k in keep],
            embeddings=[embeddings[k] for k in keep],
            metadatas=[metadatas[k] for k in keep],
        )
        pbar.update(len(keep))

    pbar.close()
    print(f"\n[ok] Indexed {len(pairs)} products into collection '{COLLECTION_NAME}'")
    print(f"[ok] ChromaDB persisted at {CHROMA_DIR}")

    print("\n[summary] Collection stats")
    print(f"  collection      : {COLLECTION_NAME}")
    print(f"  documents       : {collection.count()}")
    print(f"  embed model     : {MODEL_NAME}")
    if collection.count():
        sample = collection.get(limit=5)
        for meta in sample.get("metadatas") or []:
            print(f"  sample           : [{meta.get('product_id')}] {meta.get('name')} — {meta.get('category')} — ₹{meta.get('price')}")


def sync_to_api(products: List[Dict[str, Any]], args: argparse.Namespace) -> None:
    """Post a subset of product metadata to the Express backend catalog."""
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:5000").rstrip("/")
    headers = {}
    token = os.environ.get("ADMIN_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    end = None if args.limit is None else args.start + args.limit
    subset = products[args.start:end][: args.sync_limit]

    print(f"\n[info] Syncing {len(subset)} products to {backend_url}/api/products")
    ok_count, fail_count = 0, 0
    for product in tqdm(subset, desc="Sync to backend", unit="prod"):
        pid = str(product["id"])
        category = f"{product['masterCategory']} / {product['subCategory']}"
        body = {
            "name": product["productDisplayName"] or f"Fashion item {pid}",
            "category": category,
            "articleType": product["articleType"],
            "baseColour": product["baseColour"],
            "imageUrl": image_url_for(product, args.image_url_base),
            "externalId": pid,
        }
        real_price = product.get("price", "")
        if real_price:
            body["price"] = real_price
        try:
            resp = requests.post(f"{backend_url}/api/products", json=body, headers=headers, timeout=15)
            if resp.ok:
                ok_count += 1
            else:
                warn_sync(f"{pid}: HTTP {resp.status_code} {resp.text[:120]}")
                fail_count += 1
        except requests.RequestException as exc:
            warn_sync(f"{pid}: {exc}")
            fail_count += 1

    print(f"[ok] Synced {ok_count} products; {fail_count} failures.")


def warn_sync(msg: str) -> None:
    print(f"[warn] {msg}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build the STYLIO ChromaDB product index from the Kaggle fashion dataset."
    )
    parser.add_argument("--limit", type=int, default=None,
                        help="Number of products to index (default: all).")
    parser.add_argument("--start", type=int, default=0,
                        help="Offset into the catalog to start at.")
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Images processed per model call (default: 32).")
    parser.add_argument("--test", action="store_true",
                        help="Run end-to-end on just 50 images without persisting.")
    parser.add_argument("--cpu", action="store_true",
                        help="Force CPU inference (no CUDA).")
    parser.add_argument("--image-url-base", default=None,
                        help="Optional base URL for image_url metadata. If set, uses "
                             "'<base>/<id>/1.jpg'; otherwise image_url is left empty "
                             "so consumers fall back to local images.")
    parser.add_argument("--price-map", default=None,
                        help="Optional JSON file mapping product id -> real retail price (INR). "
                             "Without it, prices are not assigned (no fabricated values).")
    parser.add_argument("--sync-api", action="store_true",
                        help="After building, POST a subset to the Express backend "
                             "(BACKEND_URL + ADMIN_TOKEN env vars).")
    parser.add_argument("--sync-limit", type=int, default=100,
                        help="Max products to sync to the API (default: 100).")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    price_map = load_price_map(Path(args.price_map)) if args.price_map else {}
    products = read_catalog(price_map)

    if not products:
        print("[error] Catalog is empty.")
        return 1

    if args.test and (args.limit or args.sync_api):
        print("[info] --test overrides limit/sync; running 50-image smoke test.")

    try:
        build_index(products, args)
    except ImportError as exc:
        print("\n[error] A dependency is missing.")
        print(f"  {exc}")
        print("  Install with:  pip install -r requirements.txt  (+ torch)")
        return 1

    if args.sync_api and not args.test:
        sync_to_api(products, args)

    print("\n[done] STYLIO index build complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())