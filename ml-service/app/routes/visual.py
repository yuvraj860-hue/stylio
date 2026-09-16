from __future__ import annotations

import asyncio

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.models import SearchResponse
from app.services import embedder
from app.services.vectorstore import get_vectorstore

router = APIRouter(prefix="/api/ml", tags=["visual"])


@router.post("/visual-search", response_model=SearchResponse)
async def visual_search(file: UploadFile = File(...)) -> SearchResponse:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        image = embedder.load_image_from_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        embedding = (await asyncio.to_thread(embedder.encode_image, [image]))[0]
    except embedder.EmbeddingUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    store = get_vectorstore()
    try:
        query_id, results = await asyncio.to_thread(
            store.search_by_image, embedding, settings.top_k
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return SearchResponse(query_embedding_id=query_id, results=results)