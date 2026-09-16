from __future__ import annotations

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ProductIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: str = Field(
        default="",
        validation_alias=AliasChoices("product_id", "productId"),
    )
    name: str = ""
    category: str = ""
    price: float = 0.0
    description: str = ""
    brand: str = ""
    tags: list[str] = []
    image_path: str | None = Field(
        default=None,
        validation_alias=AliasChoices("image_path", "imagePath"),
    )
    image_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("image_url", "imageUrl"),
    )


class ProductWriteResponse(BaseModel):
    status: str
    count: int
    product_ids: list[str]


class ProductDeleteResponse(BaseModel):
    status: str
    product_id: str
    deleted: bool


class SearchHit(BaseModel):
    product_id: str
    name: str = ""
    price: float = 0.0
    image_url: str = ""
    score: float


class SearchResponse(BaseModel):
    query_embedding_id: str
    results: list[SearchHit]


class RecommendRequest(BaseModel):
    product_id: str | None = None
    query: str | None = None
    limit: int = Field(default=6, ge=1, le=50)


class ChatRequest(BaseModel):
    message: str = ""


class ChatResponse(BaseModel):
    reply: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    collection_size: int