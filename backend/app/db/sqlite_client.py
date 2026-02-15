from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import update, delete
from typing import List, Optional
import logging
import uuid
from datetime import datetime

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

            # Update session's updated_at timestamp
            statement = (
                update(ChatSession)
                .where(ChatSession.session_id == session_id)
                .values(updated_at=datetime.utcnow())
            )
            await session.execute(statement)

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

    async def get_all_sessions(self) -> List[ChatSession]:
        """
        Get all chat sessions ordered by most recent.

        Returns:
            List of ChatSession objects
        """
        async with self.async_session() as session:
            statement = (
                select(ChatSession)
                .order_by(ChatSession.updated_at.desc())
            )
            result = await session.execute(statement)
            return list(result.scalars().all())

    async def get_session(self, session_id: str) -> Optional[ChatSession]:
        """
        Get a specific session.

        Args:
            session_id: Session ID

        Returns:
            ChatSession object or None
        """
        async with self.async_session() as session:
            statement = select(ChatSession).where(ChatSession.session_id == session_id)
            result = await session.execute(statement)
            return result.scalars().first()

    async def update_session_title(self, session_id: str, title: str) -> None:
        """
        Update session title and updated_at timestamp.

        Args:
            session_id: Session ID
            title: New title
        """
        async with self.async_session() as session:
            statement = (
                update(ChatSession)
                .where(ChatSession.session_id == session_id)
                .values(title=title, updated_at=datetime.utcnow())
            )
            await session.execute(statement)
            await session.commit()
            logger.info(f"Updated session {session_id} title to '{title}'")

    async def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all its messages.

        Args:
            session_id: Session ID

        Returns:
            True if session was deleted, False if not found
        """
        async with self.async_session() as session:
            # Delete all messages first
            message_statement = delete(ChatMessage).where(ChatMessage.session_id == session_id)
            await session.execute(message_statement)

            # Delete the session
            session_statement = delete(ChatSession).where(ChatSession.session_id == session_id)
            result = await session.execute(session_statement)

            await session.commit()

            deleted = result.rowcount > 0
            if deleted:
                logger.info(f"Deleted session {session_id}")
            else:
                logger.warning(f"Session {session_id} not found for deletion")

            return deleted


# Global instance
sqlite_client = SQLiteClient()
