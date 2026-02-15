from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List
import uuid
import logging
from pathlib import Path
import json

from ..models.document import Document, DocumentStatus
from ..services.pdf_service import PDFService
from ..services.ollama_service import OllamaService
from ..db.chroma_client import chroma_client
from ..utils.chunker import chunk_document_by_pages
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

# In-memory document registry (could be moved to SQLite for persistence)
document_registry: dict[str, Document] = {}


async def process_document(doc_id: str, pdf_path: Path, filename: str):
    """
    Background task to process uploaded PDF.

    Pipeline:
    1. Extract text by pages
    2. Normalize and chunk
    3. Generate embeddings
    4. Store in ChromaDB
    5. Update document status
    """
    try:
        logger.info(f"Starting processing for document {doc_id}")

        # Extract pages
        pdf_service = PDFService()
        pages = pdf_service.extract_text_by_pages(pdf_path)
        page_count = len(pages)

        logger.info(f"Extracted {page_count} pages from {filename}")

        # Chunk the document
        chunks = chunk_document_by_pages(
            pages,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP
        )

        logger.info(f"Created {len(chunks)} chunks from {filename}")

        # Generate embeddings
        ollama_service = OllamaService()
        embeddings = []

        for chunk in chunks:
            embedding = await ollama_service.embed(chunk['text'])
            embeddings.append(embedding)

        logger.info(f"Generated {len(embeddings)} embeddings for {filename}")

        # Store in ChromaDB
        chroma_client.add_chunks(
            doc_id=doc_id,
            filename=filename,
            chunks=chunks,
            embeddings=embeddings
        )

        # Update document status
        document_registry[doc_id].status = DocumentStatus.READY
        document_registry[doc_id].page_count = page_count

        logger.info(f"Successfully processed document {doc_id}")

    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {str(e)}")
        document_registry[doc_id].status = DocumentStatus.FAILED
        document_registry[doc_id].error_message = str(e)


@router.post("", response_model=List[Document])
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    Upload one or more PDF documents.

    Returns:
        List of all documents with their current status
    """
    for file in files:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")

        # Generate document ID
        doc_id = str(uuid.uuid4())

        # Save PDF
        pdf_path = settings.PDF_DIR / f"{doc_id}.pdf"
        content = await file.read()

        with open(pdf_path, "wb") as f:
            f.write(content)

        # Create document record
        document = Document(
            doc_id=doc_id,
            filename=file.filename,
            status=DocumentStatus.PROCESSING
        )
        document_registry[doc_id] = document

        # Start background processing
        background_tasks.add_task(
            process_document,
            doc_id=doc_id,
            pdf_path=pdf_path,
            filename=file.filename
        )

        logger.info(f"Uploaded document {doc_id}: {file.filename}")

    # Return all documents
    return list(document_registry.values())


@router.get("", response_model=List[Document])
async def get_documents():
    """
    Get all uploaded documents.

    Returns:
        List of all documents with their status
    """
    return list(document_registry.values())


@router.get("/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    """
    Get a specific document by ID.

    Args:
        doc_id: Document ID

    Returns:
        Document details
    """
    if doc_id not in document_registry:
        raise HTTPException(status_code=404, detail="Document not found")

    return document_registry[doc_id]


@router.get("/{doc_id}/file")
async def get_document_file(doc_id: str):
    """
    Download PDF file for a document.

    Args:
        doc_id: Document ID

    Returns:
        PDF file
    """
    pdf_path = settings.PDF_DIR / f"{doc_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")

    # Get filename from registry if available, otherwise use doc_id
    filename = document_registry[doc_id].filename if doc_id in document_registry else f"{doc_id}.pdf"

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=filename
    )
