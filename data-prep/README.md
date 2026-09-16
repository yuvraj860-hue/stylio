# STYLIO — Data Preparation Scripts

End-to-end pipeline for downloading, indexing, and serving the **STYLIO Fashion Product Images** dataset as a vector store ready for semantic search.

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Download the Kaggle "Fashion Product Images (Small)" dataset
python download_dataset.py

# 3. Build the ChromaDB vector index
python build_index.py --test          # 50-image smoke test (fast)
python build_index.py                 # Full index (all images)
```

---

## Contents

| File | Purpose |
|------|---------|
| `download_dataset.py` | Downloads & extracts the dataset into `data/` |
| `build_index.py` | Embeds images with CLIP and upserts into ChromaDB |
| `sync_to_api` | *(built into `build_index.py`)* — POSTs products to Express backend |
| `requirements.txt` | Python dependencies |

---

## `download_dataset.py`

### Flags

| Flag | Description |
|------|-------------|
| `--sample N` | Keep only the first **N** images in `data/images/` |
| `--force` | Re-download even if the dataset already exists |

### Download Strategy

The script tries three approaches in order:

1. **Kaggle CLI** — fastest if your Kaggle account is already authenticated (`kaggle.json` present).
2. **Direct mirror ZIP** — downloads a pre-packaged ZIP from the [fashion-product-images-dataset GitHub releases](https://github.com/paramaggarwal/fashion-product-images-dataset). No auth required.
3. **Sample fallback** — downloads a handful of sample images so the rest of the pipeline still works even without full dataset access.

The first successful strategy extracts `styles.csv` and all product images to `data/`.

---

## `build_index.py`

### Flags

| Flag | Description |
|------|-------------|
| `--limit N` | Index only the first **N** products |
| `--start N` | Skip the first **N** products in the catalog |
| `--batch-size N` | Number of images per model batch (default: 32) |
| `--test` | Smoke-test mode: processes 50 images, no ChromaDB persist |
| `--cpu` | Force CPU inference even if CUDA is available |
| `--image-url-base URL` | Override base URL for `image_url` metadata field |
| `--sync-api` | POST a product subset to Express after indexing |
| `--sync-limit N` | Max products to sync (default: 100) |

### How It Works

1. Reads `data/styles.csv` (Kaggle metadata).
2. For each product with a local image file, resizes the image to **224×224**, converts to RGB, and encodes it with the **CLIP ViT-B-32** sentence-transformer (`sentence-transformers/clip-ViT-B-32-multilingual-v1`).
3. Upserts each product into ChromaDB collection `stylio_products` with:
   - **id** = Kaggle style id (string)
   - **embedding** = CLIP image embedding (512-d vector)
   - **metadata** = `product_id`, `name`, `category`, `article_type`, `base_colour`, `price` (deterministic hash), `image_url`, `local_image`
4. Prints a summary (collection count, sample records) when complete.

### `--sync-api`

After the index is built, this flag sends a subset of products to the Express backend:

```bash
BACKEND_URL=http://localhost:5000 ADMIN_TOKEN=your-token python build_index.py --sync-api --sync-limit 50
```

| Env Var | Purpose |
|---------|---------|
| `BACKEND_URL` | Base URL of the Express backend (default: `http://localhost:5000`) |
| `ADMIN_TOKEN` | Bearer token sent via `Authorization` header |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STYLIO_CHROMA_DIR` | `../ml-service/data/chroma` | ChromaDB persistence directory |
| `BACKEND_URL` | `http://localhost:5000` | Express backend URL (sync-api only) |
| `ADMIN_TOKEN` | *(none)* | Admin JWT token (sync-api only) |

---

## Output Structure

```
data-prep/
├── data/
│   ├── styles.csv            # Kaggle metadata
│   ├── images/               # Product images (jpg)
│   └── .extracted            # Extraction marker
├── build_index.py
├── download_dataset.py
└── requirements.txt
```

After `build_index.py` runs, a `ml-service/data/chroma/` directory is created with the persisted ChromaDB collections.