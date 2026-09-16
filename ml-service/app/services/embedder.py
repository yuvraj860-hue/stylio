from __future__ import annotations

import io
import logging
from typing import Any

import numpy as np
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingUnavailableError(RuntimeError):
    """Raised when no embedding backend is available."""


_backend: str | None = None
_model: Any = None
_processor: Any = None
_broken: bool = False


def is_model_loaded() -> bool:
    return _model is not None


def load_model() -> None:
    global _model, _processor, _backend, _broken

    if _model is not None:
        return
    if _broken:
        raise EmbeddingUnavailableError(
            f"Embedding model '{settings.embedding_model}' is unavailable. "
            "Ensure 'sentence-transformers' or 'transformers' is installed and the "
            "model can be downloaded (or pre-cached)."
        )

    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.embedding_model)
        _backend = "sentence-transformers"
        logger.info(
            "Embedder loaded via sentence-transformers (%s)", settings.embedding_model
        )
        return
    except Exception as exc:
        logger.warning("sentence-transformers load failed: %s", exc)

    try:
        from transformers import CLIPModel, CLIPProcessor

        _model = CLIPModel.from_pretrained(settings.embedding_model)
        _processor = CLIPProcessor.from_pretrained(settings.embedding_model)
        _backend = "transformers-clip"
        logger.info(
            "Embedder loaded via transformers CLIP fallback (%s)",
            settings.embedding_model,
        )
        return
    except Exception as exc:
        _broken = True
        raise EmbeddingUnavailableError(
            f"Embedding model '{settings.embedding_model}' could not be loaded through "
            "sentence-transformers or the transformers CLIP fallback. Install required "
            "packages and ensure the model is available."
        ) from exc


def _normalise(torch_tensor: Any) -> Any:
    import torch

    return torch.nn.functional.normalize(torch_tensor, p=2, dim=1)


def encode_text(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    load_model()
    assert _backend is not None

    if _backend == "sentence-transformers":
        embeddings = _model.encode(
            texts, normalize_embeddings=True, convert_to_numpy=True
        )
        return np.asarray(embeddings, dtype="float32").tolist()

    inputs = _processor(
        text=texts, padding=True, truncation=True, return_tensors="pt"
    )
    features = _normalise(_model.get_text_features(**inputs))
    return features.detach().cpu().numpy().tolist()


def encode_image(images: list[Image.Image]) -> list[list[float]]:
    if not images:
        return []
    load_model()
    assert _backend is not None

    if _backend == "sentence-transformers":
        embeddings = _model.encode(
            images, normalize_embeddings=True, convert_to_numpy=True
        )
        return np.asarray(embeddings, dtype="float32").tolist()

    inputs = _processor(images=images, return_tensors="pt")
    features = _normalise(_model.get_image_features(**inputs))
    return features.detach().cpu().numpy().tolist()


def load_image_from_bytes(data: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as exc:
        raise ValueError("Could not decode image bytes into a valid PIL image.") from exc
