# STYLIO — AI-Powered Fashion E-Commerce Platform

**STYLIO** is a full-stack fashion e-commerce platform with a twist: instead of generic keyword filters, search is powered by **image embeddings**. When a shopper describes a product in natural language — *"a red floral summer dress"* — STYLIO matches it against CLIP-generated embeddings of the actual product photos, returning visually and semantically relevant results.

The platform is built as three deployable services (ML, backend, frontend) plus a data-preparation pipeline that trains nothing but indexes everything.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Quick Start](#quick-start)
5. [Data Preparation Pipeline](#data-preparation-pipeline)
6. [APIs](#apis)
7. [Environment Variables](#environment-variables)
8. [Docker Deployment](#docker-deployment)
9. [Cloud Deployment](#cloud-deployment)
10. [How Vector Search Works](#how-vector-search-works)
11. [Roadmap](#roadmap)

---

## Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │                  FRONTEND                    │
                    │           React + Vite  (:5173)              │
                    └───────────────┬──────────────────────────────┘
                                    │ REST / JSON
                                    ▼
                    ┌──────────────────────────────────────────────┐
                    │                  BACKEND                     │
                    │        Express.js + MongoDB  (:5000)         │
                    │   catalog · auth · payments · search proxy   │
                    └───────┬──────────────────────────▲──────────┘
                            │  product embeds via      │  search query
                            │  ML_SERVICE_URL          │  (embed → match)
                            ▼                          │
                    ┌──────────────────────────────────────────────┐
                    │                 ML SERVICE                   │
                    │            FastAPI  (:8000)                  │
                    │   CLIP ViT-B-32 embedder · ChromaDB store    │
                    └──────────────────────────────────────────────┘
                            ▲
                            │ index built offline
                    ┌──────────────────────────────────────────────┐
                    │              DATA PREP (data-prep/)          │
                    │  Kaggle Fashion Product Images (Small)       │
                    │  download_dataset.py → build_index.py        │
                    └──────────────────────────────────────────────┘
                    ┌──────────────────────────────────────────────┐
                    │                 MONGODB   (:27017)           │
                    │         catalog · users · orders             │
                    └──────────────────────────────────────────────┘
```

**Request flow for search:**

1. User types `"red floral summer dress"` in the frontend.
2. Backend forwards the query to the ML service.
3. ML service embeds the text with the same CLIP model used at index time.
4. ChromaDB performs a **cosine-similarity nearest-neighbour search** against 44k+ product embeddings.
5. Top-k product ids come back to the frontend, metadata comes from MongoDB.

---

## Tech Stack

| Layer          | Technology                                             | Port  |
|----------------|--------------------------------------------------------|-------|
| ML service     | Python · FastAPI · sentence-transformers (CLIP ViT-B-32) · ChromaDB | 8000 |
| Backend        | Node.js · Express · MongoDB (Mongoose) · JWT · Stripe   | 5000  |
| Frontend       | React · Vite                                            | 5173  |
| Database       | MongoDB 6                                               | 27017 |
| Data prep      | Python · pandas · Pillow · Kaggle API                   | —     |
| Orchestration  | Docker Compose                                          | —     |

---

## Folder Structure

```
STYLIO/
├── data-prep/                  # Offline dataset + index pipeline
│   ├── download_dataset.py     #   fetch & extract Kaggle dataset
│   ├── build_index.py          #   embed images → ChromaDB + API sync
│   ├── requirements.txt
│   └── README.md
├── ml-service/                 # AI catalogue service
│   ├── app/                    #   FastAPI application
│   ├── data_prep/              #   standalone index builder
│   │   └── build_index.py      #     dependency-light, any image folder
│   ├── data/                   #   ChromaDB persistence (git-ignored)
│   └── Dockerfile
├── backend/                    # Express API
│   ├── src/
│   ├── uploads/
│   ├── .env.example
│   └── Dockerfile
├── frontend/                   # React storefront
│   ├── src/
│   ├── .env.example
│   └── vite.config.js
├── docker-compose.yml          # full local/self-hosted stack
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.10+ (3.14 recommended)
- Node.js 18+ (npm)
- Docker + Docker Compose (for the containerized stack)
- A Kaggle account for the fastest dataset download (optional)

### ⚡ Run everything at once (Windows)

Double-click `start-local.bat` (or run it from the terminal) — it checks MongoDB,
seeds the catalog if needed, and launches **ML (8000), Backend (5000) and Frontend (5173)**
in three separate windows:

```bash
start-local.bat
# then open → http://localhost:5173
```

Or via npm (cross-platform), from the repo root:

```bash
npm install                 # installs `concurrently` at root
npm run setup               # installs backend + frontend + ML deps
npm run seed                # requires MongoDB on localhost:27017
npm run dev:all             # runs ML, backend and frontend together
```

If you have no local MongoDB, either install it or use Docker:

```bash
docker run -d --name stylio-mongo -p 27017:27017 mongo:6
```

### 1 · ML Service

```bash
cd ml-service
pip install -r requirements.txt    # or uv sync
uvicorn app.main:app --reload --port 8000
```

Standalone index build from any image folder:

```bash
python data_prep/build_index.py --images-dir /path/to/images --sample 100
```

### 2 · Backend

```bash
cd backend
cp .env.example .env               # fill in MONGO_URI, JWT_SECRET, STRIPE keys
npm install
npm run dev                        # http://localhost:5000
```

### 3 · Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                        # http://localhost:5173
```

### 4 · Everything with Docker

```bash
docker compose up --build
#  ml-service → http://localhost:8000
#  backend    → http://localhost:5000
#  frontend   → http://localhost:5173
#  mongo      → mongodb://localhost:27017
```

---

## Data Preparation Pipeline

The `data-prep/` directory handles acquiring the catalogue and building the vector index.

```bash
cd data-prep
pip install -r requirements.txt

python download_dataset.py            # download Kaggle "Fashion Product Images (Small)"
python build_index.py --test          # 50-image smoke test
python build_index.py                 # full 44k-product index
python build_index.py --sync-api      # also POST products to Express backend
```

> Prefer the Kaggle CLI. If Kaggle is unavailable, `download_dataset.py` falls back to a public mirror ZIP, then to sample images — so the pipeline always stays runnable.

The index is persisted to `ml-service/data/chroma/` (ChromaDB), ready for the ML service to query.

**See `data-prep/README.md` for the full flag reference.**

---

## APIs

### ML Service (`:8000`)

| Method | Endpoint       | Description                                |
|--------|----------------|--------------------------------------------|
| GET    | `/health`      | Liveness probe + model load status         |
| GET    | `/search?q=…&k=10` | Text → CLIP embed → top-k product ids  |
| GET    | `/products/{id}` | Fetch metadata for one indexed product    |

### Backend (`:5000`)

| Method | Endpoint              | Auth    | Description                                  |
|--------|-----------------------|---------|----------------------------------------------|
| POST   | `/api/auth/register`  | —       | Create user account                          |
| POST   | `/api/auth/login`     | —       | Login → JWT                                  |
| GET    | `/api/products`       | —       | List catalogue products (paginated)          |
| GET    | `/api/products/:id`   | —       | Single product detail                        |
| POST   | `/api/products`       | Admin   | Create/manage a product                      |
| PATCH  | `/api/products/:id`   | Admin   | Update a product (used by `sync_to_api`)     |
| GET    | `/api/search?q=…`     | —       | Semantic search (proxies ML service)         |
| POST   | `/api/cart`           | User    | Add item to cart                             |
| POST   | `/api/orders`         | User    | Checkout — creates Stripe PaymentIntent      |
| POST   | `/api/checkout`       | User    | Stripe session / payment confirmation        |

### Frontend (`:5173`)

Served as a client-side SPA. No backend API surface.

---

## Environment Variables

| Variable          | Service | Default      | Required | Description                                 |
|-------------------|---------|--------------|----------|---------------------------------------------|
| `ML_SERVICE_URL`  | backend | `http://localhost:8000` | Yes | URL of the ML service (set to `http://ml-service:8000` in Docker) |
| `MONGO_URI`       | backend | `mongodb://localhost:27017/stylio` | Yes | MongoDB connection string |
| `JWT_SECRET`      | backend | *(empty)*    | **Yes**  | Secret used to sign auth tokens |
| `STRIPE_SECRET_KEY`| backend | *(empty)*   | **Yes**  | Stripe API secret key |
| `MONGO_URI`       | compose | `mongodb://mongo:27017/stylio` | — | Overridden in `docker-compose.yml` |
| `BACKEND_URL`     | data-prep| `http://localhost:5000` | —   | Base URL for `--sync-api` |
| `ADMIN_TOKEN`     | data-prep| *(none)*     | —        | Bearer token for admin auth during sync    |
| `STYLIO_CHROMA_DIR` | data-prep | `ml-service/data/chroma` | — | ChromaDB persistence directory |

---

## Docker Deployment

`docker-compose.yml` defines four services on a single bridge network:

| Service      | Image/Build        | Port           | Notes                              |
|--------------|--------------------|----------------|------------------------------------|
| `ml-service` | `./ml-service`     | 8000 → 8000    | ChromaDB persisted on `./ml-service/data` volume |
| `backend`    | `./backend`        | 5000 → 5000    | Env forwarded from your shell / `.env` |
| `frontend`   | `./frontend`       | 5173 → 5173    | Dev server / built SPA             |
| `mongo`      | `mongo:6`          | 27017 → 27017  | Data in a named Docker volume      |

```bash
# Provide secrets from the environment (recommended)
export MONGO_URI=mongodb://mongo:27017/stylio
export JWT_SECRET='<strong-secret>'
export STRIPE_SECRET_KEY='sk_live_...'

docker compose up --build
```

The `mongo:6` image uses the official MongoDB image; data survives container restarts via the `stylio-mongo-data` named volume.

---

## Cloud Deployment

Every service is self-contained, so they can be hosted independently on different providers.

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build                       # outputs to dist/
```

- **Vercel:** import the repo → framework preset **Vite** → set `VITE_*` env vars.
- **Netlify:** build command `npm run build`, publish directory `dist/`.
- Point `VITE_API_URL` at the deployed backend URL.

### Backend → Render / Railway

- **Render:** create a **Web Service** from the `backend/` folder; start command `npm start`; add env vars `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `ML_SERVICE_URL`.
- **Railway:** push `backend/` as a service, attach the shared template, mirror the same env vars.

### ML Service → HuggingFace Spaces / AWS EC2

- **HuggingFace Spaces (Docker):** create a Space → configure the `ml-service/` Dockerfile. Persistent ChromaDB data can live on a Space Dataset or be rebuilt on cold start.
- **AWS EC2:** `docker compose up -d ml-service` (or a systemd unit). Expose port 8000 behind a security group / reverse proxy; set `ML_SERVICE_URL` on the backend accordingly.

> **Tip:** because the index build is offline, production deployments only need the *pre-built* ChromaDB folder — the CLIP model itself is downloaded at first start.

---

## How Vector Search Works

1. **Offline (data-prep):** every product photo → resized to `224×224` RGB → encoded with **CLIP ViT-B-32 multilingual** → 512-dimensional embedding stored in ChromaDB under `stylio_products`.
2. **Online (request time):** the shopper's text query is encoded with the **same model**, producing a vector in the same latent space.
3. **Matching:** ChromaDB returns the `k` nearest embeddings by cosine similarity — in practice this means *"closest in visual meaning"*, which correctly joins **text to image** even when the words never appear in the product name.
4. **Hydration:** the returned product ids are resolved against MongoDB for full catalogue metadata.

This approach captures visual semantics that keyword search cannot — *"summer dress"* surfaces floral prints and breezy silhouettes, *"athleisure"* surfaces track pants and hoodies, across translations thanks to the multilingual CLIP checkpoint.

---

## Roadmap

- [x] Dataset acquisition & extraction pipeline
- [x] Offline CLIP + ChromaDB index builder
- [x] Standalone dependency-light indexer for the ML service
- [x] Docker Compose stack (ML + backend + frontend + MongoDB)
- [ ] Hybrid search (vector + text) with reranking
- [ ] User-upload product images → auto-upsert into the index
- [ ] Multilingual search UI (hindi + english)
- [ ] Recommendation service ("similar looks") using the same embeddings
- [ ] CI pipeline that rebuilds the index on catalogue changes

---

**STYLIO — when fashion meets vector space.** 🔎