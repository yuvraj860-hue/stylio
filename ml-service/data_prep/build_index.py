"""STYLIO — Standalone image-index builder (dependency-light).

Embed any folder of images with CLIP and upsert them into ChromaDB without
requiring pandas or the full Kaggle dataset. Use this inside the ML service
or with any custom image folder.

Usage:
    python build_index.py --images-dir /path/to/images
    python build_index.py --images-dir ./photos --sample 50 --meta-file meta.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image
from tqdm import tqdm
import chromadb
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/clip-ViT-B-32-multilingual-v1"
IMAGE_SIZE = 224
COLLECTION_NAME = "stylio_products"
DEFAULT_CHROMA_DIR = Path(__file__).resolve().parents[1] / "data" / "chroma"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}


def find_images(directory: Path) -> List[Path]:
    """Return a sorted list of image file paths in the given directory."""
    return sorted(
        p for p in directory.iterdir()
        if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
    )


def load_image(path: Path) -> Optional[Image.Image]:
    """Open an image and resize to IMAGE_SIZE × IMAGE_SIZE."""
    try:
        return Image.open(path).convert("RGB").resize((IMAGE_SIZE, IMAGE_SIZE))
    except (OSError, ValueError):
        return None


def load_meta(meta_path: Optional[Path]) -> Dict[str, Any]:
    """Load a JSON metadata mapping. Expects a dict keyed by filename or id."""
    if meta_path is None or not meta_path.exists():
        return {}
    with open(meta_path, encoding="utf-8") as handle:
        return json.load(handle)


def build_index(args: argparse.Namespace) -> int:
    images_dir = Path(args.images_dir)
    if not images_dir.is_dir():
        print(f"[error] {images_dir} is not a directory.")
        return 1

    image_paths = find_images(images_dir)
    if not image_paths:
        print(f"[error] No images found in {images_dir}.")
        return 1

    sample = args.sample if args.sample else len(image_paths)
    image_paths = image_paths[:sample]
    print(f"[info] Found {len(image_paths)} images in {images_dir}")

    # Load model
    print(f"[info] Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME, device="cpu")
    print("[info] Model loaded (cpu)")

    # Load optional metadata mapping
    meta_map = load_meta(Path(args.meta_file)) if args.meta_file else {}

    # Prepare ChromaDB
    chroma_dir = Path(args.chroma_dir)
    chroma_dir.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(chroma_dir))
    collection = client.get_or_create_collection(
        COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # Process in batches
    batch_size = args.batch_size
    pbar = tqdm(total=len(image_paths), desc="Embedding", unit="img")
    upsert_count = 0

    for i in range(0, len(image_paths), batch_size):
        batch_paths = image_paths[i : i + batch_size]

        # Load and filter valid images
        images: List[Image.Image] = []
        valid_ids: List[str] = []
        valid_meta: List[Dict[str, str]] = []

        for path in batch_paths:
            img = load_image(path)
            if img is None:
                continue
            images.append(img)

            # Stable sequential id
            product_id = f"product_{i + len(valid_ids)}"
            valid_ids.append(product_id)

            # Metadata
            file_stem = path.stem
            entry: Dict[str, str] = meta_map.get(file_stem, meta_map.get(file_stem + ".jpg", {}))
            if not isinstance(entry, dict):
                entry = {}

            valid_meta.append({
                "product_id": entry.get("product_id", product_id),
                "name": entry.get("name", file_stem),
                "category": entry.get("category", "unknown"),
                "article_type": entry.get("article_type", "unknown"),
                "base_colour": entry.get("base_colour", "unknown"),
                "price": entry.get("price", "0"),
                "image_url": entry.get("image_url", path.name),
                "local_image": str(path),
            })

        if not images:
            pbar.update(len(batch_paths))
            continue

        # Embed
        embeddings = model.encode(images, batch_size=len(images), convert_to_numpy=True)

        # Upsert
        collection.upsert(
            ids=valid_ids,
            embeddings=[emb.tolist() for emb in embeddings],
            metadatas=valid_meta,
        )
        upsert_count += len(valid_ids)
        pbar.update(len(batch_paths))

    pbar.close()

    # Summary
    total = collection.count()
    print(f"\n[ok] Upserted {upsert_count} products.")
    print(f"[ok] Collection '{COLLECTION_NAME}' contains {total} documents.")
    print(f"[ok] ChromaDB persisted at: {chroma_dir}")

    if total:
        sample_data = collection.get(limit=min(3, total))
        for meta in sample_data.get("metadatas") or []:
            print(f"  sample: [{meta.get('product_id')}] {meta.get('name')} — {meta.get('category')}")

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a ChromaDB image index from any folder of images."
    )
    parser.add_argument("--images-dir", required=True,
                        help="Path to a directory containing images.")
    parser.add_argument("--sample", type=int, default=None,
                        help="Limit to the first N images (default: all).")
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Images per model batch (default: 32).")
    parser.add_argument("--meta-file", default=None,
                        help="Optional JSON file mapping filenames to metadata dicts.")
    parser.add_argument("--chroma-dir", default=str(DEFAULT_CHROMA_DIR),
                        help=f"ChromaDB persistence directory (default: {DEFAULT_CHROMA_DIR})")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    return build_index(args)


if __name__ == "__main__":
    sys.exit(main())