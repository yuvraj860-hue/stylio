from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import HealthResponse
from app.routes import chat, products, recommend, visual
from app.services import embedder
from app.services.vectorstore import get_vectorstore


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.chroma_dir).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="STYLIO ML Service",
    description="CLIP-based visual & text product search and recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visual.router)
app.include_router(recommend.router)
app.include_router(products.router)
app.include_router(chat.router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=embedder.is_model_loaded(),
        collection_size=get_vectorstore().size,
    )