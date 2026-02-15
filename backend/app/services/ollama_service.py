import httpx
import json
from typing import List, AsyncGenerator, Dict
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with Ollama API."""

    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.embedding_model = settings.EMBEDDING_MODEL
        self.llm_model = settings.LLM_MODEL
        self.timeout = 60.0

    async def check_models(self) -> Dict[str, bool]:
        """
        Check if required models are available.

        Returns:
            Dict with {embedding: bool, llm: bool}
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()

                available_models = [model['name'] for model in data.get('models', [])]

                return {
                    'embedding': self.embedding_model in available_models,
                    'llm': self.llm_model in available_models
                }
        except Exception as e:
            logger.error(f"Error checking Ollama models: {str(e)}")
            return {'embedding': False, 'llm': False}

    async def embed(self, text: str, model: str = None) -> List[float]:
        """
        Generate embeddings for text.

        Args:
            text: Text to embed
            model: Model to use (defaults to config embedding model)

        Returns:
            List of embedding values

        Raises:
            Exception: If embedding fails
        """
        model = model or self.embedding_model

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": model, "prompt": text}
                )
                response.raise_for_status()
                data = response.json()
                return data['embedding']
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise Exception(f"Failed to generate embedding: {str(e)}")

    async def generate_stream(
        self,
        prompt: str,
        model: str = None,
        system: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming LLM response.

        Args:
            prompt: User prompt
            model: Model to use (defaults to config LLM model)
            system: System prompt

        Yields:
            Generated text tokens

        Raises:
            Exception: If generation fails
        """
        model = model or self.llm_model

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True
        }

        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json=payload
                ) as response:
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                if 'response' in data:
                                    yield data['response']

                                # Check if done
                                if data.get('done', False):
                                    break
                            except json.JSONDecodeError:
                                logger.warning(f"Failed to parse JSON: {line}")
                                continue
        except Exception as e:
            logger.error(f"Error generating stream: {str(e)}")
            raise Exception(f"Failed to generate response: {str(e)}")
