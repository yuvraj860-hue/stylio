from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter

from app.models import ChatRequest, ChatResponse
from app.services import embedder
from app.services.vectorstore import get_vectorstore

router = APIRouter(prefix="/api/ml", tags=["chat"])
logger = logging.getLogger(__name__)

_REPLY_GREETINGS = (
    "Hey! I'm your STYLIO stylist. "
    "Tell me what you're looking for — style, category, or occasion — and I'll find the best picks."
)


def _build_reply(results: list[dict]) -> str:
    if not results:
        return (
            "I don't have anything matching that in our catalog right now. "
            "Try describing a style, category, or budget."
        )

    names = [r.get("name", "a piece") for r in results[:3]]
    prices = [r.get("price", 0) for r in results[:3]]
    categories = list({r.get("category", "") for r in results[:3] if r.get("category")})

    parts: list[str] = []
    if len(names) == 1:
        parts.append(f"Check out the {names[0]}.")
    elif len(names) == 2:
        parts.append(f"I'd suggest the {names[0]} or the {names[1]}.")
    else:
        parts.append(f"Top picks: {', '.join(names[:-1])}, and {names[-1]}.")

    if categories:
        parts.append(f"From our {', '.join(categories[:2])} collection.")

    valid_prices = [p for p in prices if p > 0]
    if valid_prices:
        low, high = min(valid_prices), max(valid_prices)
        if low == high:
            parts.append(f"Starting at ₹{low}.")
        else:
            parts.append(f"Between ₹{low} and ₹{high}.")

    parts.append("Head to the shop to see the full selection!")
    return " ".join(parts)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    query = (request.message or "").strip()

    if not query:
        return ChatResponse(reply=_REPLY_GREETINGS)

    greeting_words = {"hi", "hello", "hey", "howdy", "sup"}
    words = set(query.lower().split())
    if words & greeting_words and len(query) < 20:
        return ChatResponse(reply=_REPLY_GREETINGS)

    store = get_vectorstore()
    if store.size == 0:
        return ChatResponse(
            reply=(
                "Our catalog is still warming up — "
                "check back in a moment and I'll have recommendations ready!"
            )
        )

    try:
        embedding = (await asyncio.to_thread(embedder.encode_text, [query]))[0]
    except embedder.EmbeddingUnavailableError:
        return ChatResponse(
            reply="The recommendation engine is loading. Please try again in a moment!"
        )

    try:
        _, results = await asyncio.to_thread(store.search_by_text, embedding, 3)
    except Exception as exc:
        logger.warning("Chat search failed: %s", exc)
        return ChatResponse(
            reply="I ran into a hiccup looking that up. Try again shortly!"
        )

    return ChatResponse(reply=_build_reply(results))
