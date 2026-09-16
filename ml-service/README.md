# STYLIO ML Service

CLIP-powered visual search and product recommendation microservice for the
STYLIO fashion e-commerce platform.

- **Embeddings:** `sentence-transformers/clip-ViT-B-32-multilingual-v1` (CLIP,
  512-dim, handles both text and images). Falls back to a `transformers`
  `CLIPModel`/`CLIPProcessor` load of the same model if `sentence-transformers`
  cannot load it.
- **Vector index:** ChromaDB (persistent) at `./data/chroma`, collection
  `stylio_products`, cosine distance (`score = 1 - distance` = cosine similarity).
- **Lazy model loading:** the model is only downloaded/loaded on the first
  embedding call, so `/health` responds without the model installed.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or with Docker:

```bash
docker build -t stylio-ml .
docker run -p 8000:8000 -v "$(pwd)/data:/app/data" stylio-ml
```

## API contract

### `GET /health`

```json
{ "status": "ok", "model_loaded": false, "collection_size": 0 }
```

`model_loaded` is `true` only after the embedding model has been loaded at least
once. The service returns healthy even if the model is not yet loaded.

### `POST /api/ml/visual-search`

Multipart form upload with a `file` field (image). Returns top 5 items by
cosine similarity (configurable via `TOP_K`).

```json
{
  "query_embedding_id": "a1b2c3...",
  "results": [
    { "product_id": "id", "name": "", "price": 0, "image_url": "", "score": 0.93 }
  ]
}
```

With no products indexed this returns `results: []` (not an error).

### `POST /api/ml/recommend`

JSON body — one of:

```json
{ "product_id": "where-are-you-dress", "limit": 6 }
```

or

```json
{ "query": "red summer dress", "limit": 6 }
```

Returns the same shape as visual-search.

### `POST /api/ml/products`

JSON array of products. Each item embeds its `image_url` (fetched remotely) or
`image_path` (local file); if neither is usable the item falls back to a text
embedding built from `name + category + description`.

```json
[
  {
    "product_id": "where-are-you-dress",
    "name": "Pearl Embellished Mini Dress",
    "category": "dresses",
    "price": 128,
    "image_url": "https://cdn.example.com/dress.jpg",
    "description": "Cream mini dress with pearl embellishments"
  }
]
```

### `POST /api/ml/products/{id}`

Add or update a single product (id taken from path).

### `DELETE /api/ml/products/{id}`

Deletes a product from the index.

## Vector index / data prep

The vector index is created and populated by the data preparation pipeline:

```bash
python data_prep/build_index.py
```

Expected ChromaDB contract (collection `stylio_products`, cosine space):

| Field        | ChromaDB location | Type / notes                    |
| ------------ | ----------------- | ------------------------------- |
| `product_id` | document id       | unique string (upsertable)      |
| embedding    | vector            | 512-dim `float32` CLIP vector   |
| `name`       | metadata          | string                          |
| `category`   | metadata          | string                          |
| `price`      | metadata          | float                           |
| `image_url`  | metadata          | string (may be empty)           |
| `description`| metadata          | string                          |
| collection    | `stylio_products` | `metadata={"hnsw:space": "cosine"}` |

The ML service reads and serves from this same persistent Chroma store
(`CHROMA_DIR`), so `data_prep/build_index.py` should point at the same
directory/collection.

## Configuration (`.env` / environment variables)

| Variable         | Default                                            | Purpose                       |
| ---------------- | -------------------------------------------------- | ----------------------------- |
| `EMBEDDING_MODEL`| `sentence-transformers/clip-ViT-B-32-multilingual-v1` | Model used for embeddings |
| `EMBEDDING_DIM`  | `512`                                              | Expected embedding dimension  |
| `CHROMA_DIR`     | `./data/chroma`                                    | ChromaDB persist directory    |
| `CHROMA_COLLECTION` | `stylio_products`                               | ChromaDB collection name      |
| `TOP_K`          | `5`                                                | Default result count (visual) |
| `CORS_ORIGINS`   | `*`                                                | Comma-separated allowed origins |
| `EMBEDDING_BATCH_SIZE` | `16`                                         | Reserved for batching         |
| `REQUEST_TIMEOUT`| `60`                                               | Timeout for long requests     |
| `IMAGE_TIMEOUT`  | `15`                                               | Timeout fetching remote images|
| `PORT`           | `8000`                                             | Server port (Procfile)        |

## Notes & assumptions

- Score returned is cosine similarity (`1 - distance`); embeddings are
  L2-normalised before insert.
- If `sentence-transformers` is not installed / cannot load the model, the
  service attempts a `transformers` `CLIPModel` fallback. If that also fails,
  embedding endpoints return `503` with a helpful message; `/health` still works.
- Products with no usable image are embedded from their text (name/category/
  description) so they remain searchable.
- `query_embedding_id` is a per-request UUID identifying the query embedding.