from __future__ import annotations

import asyncio
import logging
import urllib.request
from typing import Any

from fastapi import APIRouter, HTTPException
from PIL import Image

from app.config import settings
from app.models import (
    ProductDeleteResponse,
    ProductIn,
    ProductWriteResponse,
)
from app.services import embedder
from app.services.vectorstore import get_vectorstore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["products"])


def _fetch_image_bytes(url: str) -> bytes:
    request = urllib.request.Request(
        url, headers={"User-Agent": "stylio-ml/1.0"}
    )
    with urllib.request.urlopen(request, timeout=settings.image_timeout) as response:
        return response.read()


def _load_product_image(product: ProductIn) -> Image.Image | None:
    if product.image_path:
        try:
            with open(product.image_path, "rb") as fh:
                return embedder.load_image_from_bytes(fh.read())
        except (OSError, ValueError) as exc:
            logger.warning(
                "Local image unreadable for product %s (%s): %s",
                product.product_id,
                product.image_path,
                exc,
            )
    if product.image_url:
        try:
            data = _fetch_image_bytes(product.image_url)
            return embedder.load_image_from_bytes(data)
        except Exception as exc:
            logger.warning(
                "Remote image fetch failed for product %s (%s): %s",
                product.product_id,
                product.image_url,
                exc,
            )
    return None


def _embed_product(product: ProductIn) -> list[float]:
    image = _load_product_image(product)
    if image is not None:
        try:
            return embedder.encode_image([image])[0]
        except Exception as exc:
            logger.warning(
                "Image embedding failed for product %s, falling back to text: %s",
                product.product_id,
                exc,
            )

    text = " ".join(
        part for part in (product.name, product.category, product.description) if part
    ).strip()
    if not text:
        raise ValueError(
            f"Product '{product.product_id}' has no embeddable image or text content."
        )
    return embedder.encode_text([text])[0]


def _embed_all(products: list[ProductIn]) -> list[list[float]]:
    return [_embed_product(product) for product in products]


def _validate_embedding(embedding: list[float]) -> None:
    if len(embedding) != settings.embedding_dim:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Embedding dimension mismatch: got {len(embedding)}, "
                f"expected {settings.embedding_dim}. Model output does not match collection."
            ),
        )


async def _embed_products(products: list[ProductIn]) -> list[list[float]]:
    embeddings = await asyncio.to_thread(_embed_all, products)
    for embedding in embeddings:
        _validate_embedding(embedding)
    return embeddings


@router.post("/products", response_model=ProductWriteResponse, status_code=201)
async def add_products(products: list[ProductIn] | ProductIn) -> ProductWriteResponse:
    if isinstance(products, ProductIn):
        products = [products]
    if not products:
        return ProductWriteResponse(status="ok", count=0, product_ids=[])
    try:
        embeddings = await _embed_products(products)
    except embedder.EmbeddingUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    store = get_vectorstore()
    await asyncio.to_thread(store.add_products, products, embeddings)
    return ProductWriteResponse(
        status="ok",
        count=len(products),
        product_ids=[p.product_id for p in products],
    )


@router.post("/products/{product_id}", response_model=ProductWriteResponse)
async def upsert_product(
    product_id: str, product: ProductIn
) -> ProductWriteResponse:
    payload = product.model_copy(update={"product_id": product_id})
    try:
        embedding = (await _embed_products([payload]))[0]
    except embedder.EmbeddingUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    store = get_vectorstore()
    await asyncio.to_thread(store.add_product, payload, embedding)
    return ProductWriteResponse(status="ok", count=1, product_ids=[product_id])


@router.delete("/products/{product_id}", response_model=ProductDeleteResponse)
async def delete_product(product_id: str) -> ProductDeleteResponse:
    store = get_vectorstore()
    deleted = await asyncio.to_thread(store.remove_product, product_id)
    return ProductDeleteResponse(
        status="ok", product_id=product_id, deleted=deleted
    )