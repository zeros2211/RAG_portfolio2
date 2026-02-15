from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional, AsyncGenerator
import json
import logging
import uuid

from ..services.ollama_service import OllamaService
from ..db.chroma_client import chroma_client
from ..db.sqlite_client import sqlite_client
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based on the provided context from documents.

IMPORTANT RULES:
1. Answer ONLY using information from the provided context
2. If the context doesn't contain enough information to answer the question, say "I don't know based on the provided documents"
3. Do NOT make up information or sources
4. Be concise and direct in your answers
5. If you reference information, it should be from the provided context
"""


def build_prompt(question: str, context_chunks: List[dict], conversation_history: List[dict] = None) -> str:
    """
    Build the prompt for the LLM with context and conversation history.

    Args:
        question: User's question
        context_chunks: List of relevant chunks from ChromaDB
        conversation_history: Optional list of previous messages

    Returns:
        Formatted prompt
    """
    # Build context section
    context_text = "\n\n".join([
        f"[Document: {chunk['filename']}, Page {chunk['page']}]\n{chunk['text']}"
        for chunk in context_chunks
    ])

    # Build conversation history if available
    history_text = ""
    if conversation_history:
        history_text = "Previous conversation:\n"
        for msg in conversation_history:
            role = msg['role'].capitalize()
            history_text += f"{role}: {msg['content']}\n"
        history_text += "\n"

    # Combine into prompt
    prompt = f"""Context from documents:
{context_text}

{history_text}Question: {question}

Answer:"""

    return prompt


async def generate_chat_stream(
    session_id: str,
    message: str,
    doc_ids: Optional[List[str]] = None
) -> AsyncGenerator[str, None]:
    """
    Generate SSE stream for chat response.

    Yields SSE events:
    - event: session
    - event: token
    - event: sources
    - event: done
    - event: error
    """
    try:
        # Ensure session exists
        await sqlite_client.create_session(session_id)

        # Send session ID
        yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"

        # Embed the query
        ollama_service = OllamaService()
        query_embedding = await ollama_service.embed(message)

        # Search for relevant chunks
        results = chroma_client.search(
            query_embedding=query_embedding,
            top_k=settings.TOP_K,
            doc_ids=doc_ids
        )

        logger.info(f"Found {len(results)} relevant chunks for query")

        # Get conversation history
        recent_messages = await sqlite_client.get_recent_messages(
            session_id=session_id,
            limit=settings.MAX_CONTEXT_TURNS * 2  # user + assistant pairs
        )

        # Convert to dict format for prompt building
        history = [{'role': msg.role, 'content': msg.content} for msg in recent_messages]

        # Build prompt
        prompt = build_prompt(message, results, history)

        # Save user message
        await sqlite_client.add_message(session_id, "user", message)

        # Stream LLM response
        full_response = ""
        async for token in ollama_service.generate_stream(
            prompt=prompt,
            system=SYSTEM_PROMPT
        ):
            full_response += token
            yield f"event: token\ndata: {json.dumps({'text': token})}\n\n"

        # Save assistant message
        await sqlite_client.add_message(session_id, "assistant", full_response)

        # Send sources
        sources = [
            {
                'doc_id': chunk['doc_id'],
                'filename': chunk['filename'],
                'page': chunk['page'],
                'score': chunk['score'],
                'snippet': chunk['text'][:200] + '...' if len(chunk['text']) > 200 else chunk['text']
            }
            for chunk in results
        ]
        yield f"event: sources\ndata: {json.dumps({'sources': sources})}\n\n"

        # Send done event
        yield f"event: done\ndata: {{}}\n\n"

    except Exception as e:
        logger.error(f"Error in chat stream: {str(e)}")
        error_data = {'message': str(e)}
        yield f"event: error\ndata: {json.dumps(error_data)}\n\n"


@router.post("/stream")
async def chat_stream(
    message: str = Query(..., description="User message"),
    session_id: Optional[str] = Query(None, description="Session ID for conversation context"),
    doc_ids: Optional[str] = Query(None, description="Comma-separated document IDs to search")
):
    """
    Stream chat response using Server-Sent Events (SSE).

    Query params:
        message: User's question
        session_id: Optional session ID (generates new if not provided)
        doc_ids: Optional comma-separated list of document IDs to search

    Returns:
        SSE stream with events: session, token, sources, done, error
    """
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    # Parse doc_ids
    doc_id_list = None
    if doc_ids:
        doc_id_list = [did.strip() for did in doc_ids.split(',') if did.strip()]

    return StreamingResponse(
        generate_chat_stream(session_id, message, doc_id_list),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
