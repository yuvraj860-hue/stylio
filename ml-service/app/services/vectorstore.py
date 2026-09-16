from __future__ import annotations

import logging
import uuid
from typing import Any

import chromadb

from app.config import settings
from app.models import ProductIn

logger = logging.getLogger(__name__)


class ProductNotFoundError(LookupError):
    pass


class VectorStore:
    def __init__(self, path: str, collection_name: str) -> None:
        self._client = chromadb.PersistentClient(path=path)
        self._collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        self._observed_dim: int | None = None

    @property
    def size(self) -> int:
        return self._collection.count()

    def _collect_dim(self) -> int:
        """Return the embedding dimension of the existing collection.

        Detected lazily from the first stored embedding so a model change is
        surfaced as a clear error instead of a confusing low-level Chroma
        failure. Falls back to the configured dimension when empty.
        """
        if self._observed_dim is not None:
            return self._observed_dim
        if self.size > 0:
            sample = self._collection.get(include=["embeddings"], limit=1)
            embeds = sample.get("embeddings") or []
            if embeds:
                self._observed_dim = len(embeds[0])
                return self._observed_dim
        return settings.embedding_dim

    def validate_dim(self, embedding: list[float]) -> int:
        expected = self._collect_dim()
        if len(embedding) != expected:
            raise ValueError(
                f"Embedding dimension mismatch: got {len(embedding)}, "
                f"expected {expected} for collection '{self._collection.name}'. "
                "The embedding model output no longer matches the stored index; "
                "verify EMBEDDING_MODEL/EMBEDDING_DIM or rebuild the index."
            )
        return expected

    @staticmethod
    def _product_metadata(product: ProductIn) -> dict[str, Any]:
        metadata: dict[str, Any] = {
            "name": product.name,
            "category": product.category,
            "price": float(product.price),
            "image_url": product.image_url or "",
            "description": product.description,
        }
        if product.brand:
            metadata["brand"] = product.brand
        if product.tags:
            metadata["tags"] = ", ".join(product.tags)
        return metadata

    def add_product(self, product: ProductIn, embedding: list[float]) -> None:
        self.validate_dim(embedding)
        self._collection.upsert(
            ids=[product.product_id],
            embeddings=[embedding],
            metadatas=[self._product_metadata(product)],
        )

    def add_products(
        self, products: list[ProductIn], embeddings: list[list[float]]
    ) -> None:
        if not products:
            return
        for embedding in embeddings:
            self.validate_dim(embedding)
        self._collection.upsert(
            ids=[p.product_id for p in products],
            embeddings=embeddings,
            metadatas=[self._product_metadata(p) for p in products],
        )

    def remove_product(self, product_id: str) -> bool:
        existing = self._collection.get(ids=[product_id])
        if not existing.get("ids"):
            return False
        self._collection.delete(ids=[product_id])
        return True

    def get_embedding(self, product_id: str) -> list[float] | None:
        result = self._collection.get(ids=[product_id], include=["embeddings"])
        embeddings = result.get("embeddings") or []
        if not embeddings:
            return None
        return embeddings[0]

    def _query(
        self, embedding: list[float], top_k: int
    ) -> tuple[str, list[dict[str, Any]]]:
        self.validate_dim(embedding)
        query_id = uuid.uuid4().hex
        count = self.size
        if count == 0:
            return query_id, []

        n = min(top_k, count)
        response = self._collection.query(
            query_embeddings=[embedding],
            n_results=n,
            include=["metadatas", "distances"],
        )
        ids = response["ids"][0]
        distances = response["distances"][0]
        metadatas = response["metadatas"][0]

        results: list[dict[str, Any]] = []
        for pid, dist, meta in zip(ids, distances, metadatas):
            results.append(
                {
                    "product_id": pid,
                    "name": str(meta.get("name", "")),
                    "price": float(meta.get("price", 0.0)),
                    "image_url": str(meta.get("image_url", "")),
                    "score": round(1.0 - float(dist), 6),
                }
            )
        return query_id, results

    def search_by_image(
        self, embedding: list[float], top_k: int = 5
    ) -> tuple[str, list[dict[str, Any]]]:
        return self._query(embedding, top_k)

    def search_by_text(
        self, embedding: list[float], top_k: int = 5
    ) -> tuple[str, list[dict[str, Any]]]:
        return self._query(embedding, top_k)

    def search_similar(
        self, product_id: str, top_k: int = 6
    ) -> tuple[str, list[dict[str, Any]]]:
        embedding = self.get_embedding(product_id)
        if embedding is None:
            raise ProductNotFoundError(product_id)
        query_id, results = self._query(embedding, top_k + 1)
        filtered = [r for r in results if r["product_id"] != product_id][:top_k]
        return query_id, filtered


_store: VectorStore | None = None


def get_vectorstore() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore(settings.chroma_dir, settings.collection_name)
    return _store
