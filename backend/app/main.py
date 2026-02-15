from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .routers import documents, chat
from .db.sqlite_client import sqlite_client
from .services.ollama_service import OllamaService
from .config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting RAG application...")

    # Initialize database
    await sqlite_client.init_db()

    # Check Ollama models
    ollama_service = OllamaService()
    models_status = await ollama_service.check_models()

    if not models_status['embedding']:
        logger.warning(f"Embedding model '{settings.EMBEDDING_MODEL}' not found in Ollama")
        logger.warning(f"Please pull it: docker exec -it rag_ollama ollama pull {settings.EMBEDDING_MODEL}")

    if not models_status['llm']:
        logger.warning(f"LLM model '{settings.LLM_MODEL}' not found in Ollama")
        logger.warning(f"Please pull it: docker exec -it rag_ollama ollama pull {settings.LLM_MODEL}")

    if models_status['embedding'] and models_status['llm']:
        logger.info("All Ollama models are available")

    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down application...")


app = FastAPI(
    title="RAG Chat System",
    description="Production-ready RAG system with PDF upload, semantic search, and streaming chat",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RAG Chat System"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "RAG Chat System API",
        "docs": "/docs",
        "health": "/health"
    }
