import re
from typing import List


def chunk_page(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
    """
    Chunk text from a single page with sentence-aware boundaries.

    Args:
        text: Text to chunk (single page)
        chunk_size: Target chunk size in characters
        overlap: Overlap between chunks in characters

    Returns:
        List of text chunks
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []

    # Split into sentences (basic sentence boundary detection)
    sentences = re.split(r'(?<=[.!?])\s+', text)

    chunks = []
    current_chunk = []
    current_size = 0

    for sentence in sentences:
        sentence_len = len(sentence)

        # If adding this sentence would exceed chunk_size
        if current_size + sentence_len > chunk_size and current_chunk:
            # Save current chunk
            chunks.append(' '.join(current_chunk))

            # Start new chunk with overlap
            # Find sentences from end of current_chunk that fit in overlap
            overlap_chunk = []
            overlap_size = 0
            for sent in reversed(current_chunk):
                sent_len = len(sent)
                if overlap_size + sent_len <= overlap:
                    overlap_chunk.insert(0, sent)
                    overlap_size += sent_len
                else:
                    break

            current_chunk = overlap_chunk
            current_size = overlap_size

        # Add sentence to current chunk
        current_chunk.append(sentence)
        current_size += sentence_len

    # Add final chunk if any
    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks


def chunk_document_by_pages(
    pages: List[dict],
    chunk_size: int = 1000,
    overlap: int = 150
) -> List[dict]:
    """
    Chunk a document page by page (no cross-page chunks).

    Args:
        pages: List of dicts with {page: int, text: str}
        chunk_size: Target chunk size
        overlap: Overlap between chunks

    Returns:
        List of dicts with {page: int, chunk_index: int, text: str}
    """
    all_chunks = []

    for page_data in pages:
        page_num = page_data['page']
        text = page_data['text']

        # Chunk this page
        page_chunks = chunk_page(text, chunk_size, overlap)

        # Add metadata to each chunk
        for idx, chunk_text in enumerate(page_chunks):
            all_chunks.append({
                'page': page_num,
                'chunk_index': idx,
                'text': chunk_text
            })

    return all_chunks
