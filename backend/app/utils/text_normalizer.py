import re
import unicodedata


def normalize_text(text: str) -> str:
    """
    Clean and normalize text extracted from PDFs.

    Removes:
    - Unicode replacement characters (\uFFFD)
    - Soft hyphens (\u00AD)
    - Null characters (\x00)
    - Unicode formatting characters (Cf category)

    Normalizes:
    - Multiple spaces to single space
    - Multiple newlines to double newline (paragraph breaks)
    """
    if not text:
        return ""

    # Remove problematic Unicode characters
    text = text.replace('\uFFFD', '')  # Replacement character
    text = text.replace('\u00AD', '')  # Soft hyphen
    text = text.replace('\x00', '')    # Null character

    # Remove Unicode format characters (Cf category)
    text = ''.join(char for char in text if unicodedata.category(char) != 'Cf')

    # Normalize whitespace
    # Collapse multiple spaces to single space
    text = re.sub(r' +', ' ', text)

    # Normalize newlines - keep paragraph breaks (double newline) but collapse excessive ones
    text = re.sub(r'\n\n+', '\n\n', text)

    # Remove spaces at line boundaries
    text = re.sub(r' *\n *', '\n', text)

    # Strip leading/trailing whitespace
    text = text.strip()

    return text
