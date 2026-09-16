from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from app.models import RecommendRequest, SearchResponse
from app.services import embedder
from app.services.vectorstore import ProductNotFoundError, get_vectorstore

router = APIRouter(prefix="/api/ml", tags=["recommend"])


@router.post("/recommend", response_model=SearchResponse)
async def recommend(request: RecommendRequest) -> SearchResponse:
    if request.product_id is None and not request.query:
        raise HTTPException(
            status_code=422,
            detail="Provide either 'product_id' or 'query'.",
        )

    store = get_vectorstore()

    if request.product_id is not None:
        try:
            query_id, results = await asyncio.to_thread(
                store.search_similar, request.product_id, request.limit
            )
        except ProductNotFoundError as exc:
            raise HTTPException(
                status_code=404,
                detail=f"Product '{request.product_id}' is not present in the index.",
            ) from exc
        return SearchResponse(query_embedding_id=query_id, results=results)

    try:
        embedding = (await asyncio.to_thread(embedder.encode_text, [request.query]))[0]
    except embedder.EmbeddingUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        query_id, results = await asyncio.to_thread(
            store.search_by_text, embedding, request.limit
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return SearchResponse(query_embedding_id=query_id, results=results)