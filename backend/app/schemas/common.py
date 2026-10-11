"""Shared query schemas (pagination)."""
from __future__ import annotations

from pydantic import BaseModel, Field


class PaginationQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=20, ge=1, le=100)

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.pageSize

    @property
    def limit(self) -> int:
        return self.pageSize
