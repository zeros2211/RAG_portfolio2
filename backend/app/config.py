from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Ollama Configuration
    OLLAMA_URL: str = "http://ollama:11434"
    EMBEDDING_MODEL: str = "qwen3-embedding:0.6b"
    LLM_MODEL: str = "qwen3:8b"

    # Data Directories
    DATA_DIR: Path = Path("/app/data")
    PDF_DIR: Path = Path("/app/data/pdfs")
    CHROMA_DIR: Path = Path("/app/data/chroma")

    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 5
    MAX_CONTEXT_TURNS: int = 5

    # Database
    SQLITE_URL: str = "sqlite+aiosqlite:///./data/sessions.db"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.PDF_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
