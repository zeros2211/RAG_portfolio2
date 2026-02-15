import fitz  # PyMuPDF
from pathlib import Path
from typing import List, Dict
import logging

from ..utils.text_normalizer import normalize_text

logger = logging.getLogger(__name__)


class PDFService:
    """Service for extracting text from PDF files."""

    @staticmethod
    def extract_text_by_pages(pdf_path: Path) -> List[Dict[str, any]]:
        """
        Extract text from PDF page by page.

        Args:
            pdf_path: Path to PDF file

        Returns:
            List of dicts with {page: int (1-based), text: str}

        Raises:
            Exception: If PDF is corrupted or unreadable
        """
        try:
            doc = fitz.open(pdf_path)
            pages = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()

                # Normalize the text
                normalized_text = normalize_text(text)

                pages.append({
                    'page': page_num + 1,  # 1-based page numbers
                    'text': normalized_text
                })

            doc.close()
            return pages

        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {str(e)}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")

    @staticmethod
    def get_page_count(pdf_path: Path) -> int:
        """
        Get the number of pages in a PDF.

        Args:
            pdf_path: Path to PDF file

        Returns:
            Number of pages

        Raises:
            Exception: If PDF is corrupted or unreadable
        """
        try:
            doc = fitz.open(pdf_path)
            page_count = len(doc)
            doc.close()
            return page_count
        except Exception as e:
            logger.error(f"Error getting page count from {pdf_path}: {str(e)}")
            raise Exception(f"Failed to get page count: {str(e)}")
