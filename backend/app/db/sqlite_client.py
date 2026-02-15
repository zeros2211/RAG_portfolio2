from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
import logging
import uuid

from ..models.session import ChatSession, ChatMessage
from ..config import settings

logger = logging.getLogger(__name__)


class SQLiteClient:
    """Client for SQLite session storage."""

    def __init__(self):
        self.engine = create_async_engine(
            settings.SQLITE_URL,
            echo=False,
            connect_args={"check_same_thread": False}
        )
        self.async_session = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

    async def init_db(self):
        """Initialize database tables."""
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database tables initialized")

    async def create_session(self, session_id: str = None) -> str:
        """
        Create a new chat session.

        Args:
            session_id: Optional session ID (generates UUID if not provided)

        Returns:
            Session ID
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        async with self.async_session() as session:
            # Check if session already exists
            statement = select(ChatSession).where(ChatSession.session_id == session_id)
            result = await session.execute(statement)
            existing = result.scalars().first()

            if not existing:
                db_session = ChatSession(session_id=session_id)
                session.add(db_session)
                await session.commit()
                logger.info(f"Created session {session_id}")

        return session_id

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sources: Optional[List[dict]] = None
    ) -> None:
        """
        Add a message to a session.

        Args:
            session_id: Session ID
            role: 'user' or 'assistant'
            content: Message content
            sources: Optional list of sources (for assistant messages)
        """
        async with self.async_session() as session:
            message = ChatMessage(
                session_id=session_id,
                role=role,
                content=content,
                sources=sources
            )
            session.add(message)
            await session.commit()
            logger.debug(f"Added {role} message to session {session_id}")

    async def get_recent_messages(
        self,
        session_id: str,
        limit: int = 10
    ) -> List[ChatMessage]:
        """
        Get recent messages from a session.

        Args:
            session_id: Session ID
            limit: Maximum number of messages to return

        Returns:
            List of ChatMessage objects (oldest first)
        """
        async with self.async_session() as session:
            statement = (
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.created_at.desc())
                .limit(limit)
            )
            result = await session.execute(statement)
            messages = result.scalars().all()

            # Reverse to get chronological order (oldest first)
            return list(reversed(messages))


# Global instance
sqlite_client = SQLiteClient()
