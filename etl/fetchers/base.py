from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel


class DataSourceError(Exception):
    pass


class BaseFetcher(ABC):
    @abstractmethod
    def fetch(self) -> list[BaseModel]:
        ...

    @abstractmethod
    def health_check(self) -> bool:
        ...
