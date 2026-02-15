import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
import logging
import uuid

from ..config import settings

logger = logging.getLogger(__name__)


class ChromaClient:
    """Client for ChromaDB vector database."""

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=str(settings.CHROMA_DIR),
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection_name = "documents"
        self.collection = self._get_or_create_collection()

    def _get_or_create_collection(self):
        """Get or create the documents collection."""
        try:
            return self.client.get_collection(name=self.collection_name)
        except Exception:
            return self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )

    def add_chunks(
        self,
        doc_id: str,
        filename: str,
        chunks: List[Dict],
        embeddings: List[List[float]]
    ) -> None:
        """
        Add document chunks to ChromaDB.

        Args:
            doc_id: Document ID
            filename: Original filename
            chunks: List of dicts with {page: int, chunk_index: int, text: str}
            embeddings: List of embedding vectors (same order as chunks)
        """
        if not chunks or not embeddings:
            logger.warning(f"No chunks to add for document {doc_id}")
            return

        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks must match number of embeddings")

        # Prepare data for ChromaDB
        ids = []
        documents = []
        metadatas = []
        embedding_list = []

        for chunk, embedding in zip(chunks, embeddings):
            # Generate unique ID for this chunk
            chunk_id = f"{doc_id}_p{chunk['page']}_c{chunk['chunk_index']}"
            ids.append(chunk_id)
            documents.append(chunk['text'])
            metadatas.append({
                'doc_id': doc_id,
                'filename': filename,
                'page': chunk['page'],
                'chunk_index': chunk['chunk_index']
            })
            embedding_list.append(embedding)

        # Add to collection
        try:
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embedding_list
            )
            logger.info(f"Added {len(chunks)} chunks for document {doc_id}")
        except Exception as e:
            logger.error(f"Error adding chunks to ChromaDB: {str(e)}")
            raise

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        doc_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Search for similar chunks.

        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return
            doc_ids: Optional list of document IDs to filter by

        Returns:
            List of dicts with {doc_id, filename, page, chunk_index, text, score}
        """
        try:
            # Build where clause for filtering
            where = None
            if doc_ids:
                where = {"doc_id": {"$in": doc_ids}}

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where
            )

            # Format results
            formatted_results = []
            if results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    metadata = results['metadatas'][0][i]
                    formatted_results.append({
                        'doc_id': metadata['doc_id'],
                        'filename': metadata['filename'],
                        'page': metadata['page'],
                        'chunk_index': metadata['chunk_index'],
                        'text': results['documents'][0][i],
                        'score': results['distances'][0][i] if results.get('distances') else 0.0
                    })

            return formatted_results
        except Exception as e:
            logger.error(f"Error searching ChromaDB: {str(e)}")
            raise

    def delete_document(self, doc_id: str) -> None:
        """
        Delete all chunks for a document.

        Args:
            doc_id: Document ID to delete
        """
        try:
            self.collection.delete(where={"doc_id": doc_id})
            logger.info(f"Deleted document {doc_id} from ChromaDB")
        except Exception as e:
            logger.error(f"Error deleting document from ChromaDB: {str(e)}")
            raise


# Global instance
chroma_client = ChromaClient()
