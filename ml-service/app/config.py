import os
from dataclasses import dataclass, field


@dataclass(frozen=False)
class Settings:
    embedding_model: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "sentence-transformers/clip-ViT-B-32-multilingual-v1")
    )
    embedding_dim: int = field(
        default_factory=lambda: int(os.getenv("EMBEDDING_DIM", "512"))
    )
    chroma_dir: str = field(
        default_factory=lambda: os.getenv("CHROMA_DIR", "./data/chroma")
    )
    collection_name: str = field(
        default_factory=lambda: os.getenv("CHROMA_COLLECTION", "stylio_products")
    )
    top_k: int = field(
        default_factory=lambda: int(os.getenv("TOP_K", "5"))
    )
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "*").split(",")
            if origin.strip()
        ]
    )
    embedding_batch_size: int = field(
        default_factory=lambda: int(os.getenv("EMBEDDING_BATCH_SIZE", "16"))
    )
    request_timeout: float = field(
        default_factory=lambda: float(os.getenv("REQUEST_TIMEOUT", "60"))
    )
    image_timeout: float = field(
        default_factory=lambda: float(os.getenv("IMAGE_TIMEOUT", "15"))
    )


settings = Settings()
