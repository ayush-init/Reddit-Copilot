from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from app.db.session import Base


class RedditAccount(Base):
    """Stores connected Reddit account credentials and profile metadata."""

    __tablename__ = "reddit_accounts"

    id = Column(Integer, primary_key=True, index=True)
    reddit_id = Column(String(64), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=False)
    icon_img = Column(Text, nullable=True)
    total_karma = Column(Integer, default=0)
    link_karma = Column(Integer, default=0)
    comment_karma = Column(Integer, default=0)
    
    # OAuth tokens
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    
    # Reddit metadata
    reddit_created_utc = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Return safe, non-sensitive public profile details."""
        return {
            "id": self.id,
            "reddit_id": self.reddit_id,
            "username": self.username,
            "icon_img": self.icon_img,
            "total_karma": self.total_karma,
            "link_karma": self.link_karma,
            "comment_karma": self.comment_karma,
            "reddit_created_utc": self.reddit_created_utc,
            "connected_at": self.created_at.isoformat() if self.created_at else None,
        }
