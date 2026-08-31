import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import httpx
import jwt

from app.core.config import settings

REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/authorize"
REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
REDDIT_OAUTH_API_URL = "https://oauth.reddit.com/api/v1/me"


def get_authorization_url(state: str) -> str:
    """Generate the Reddit OAuth 2.0 authorization URL."""
    params = {
        "client_id": settings.REDDIT_CLIENT_ID,
        "response_type": "code",
        "state": state,
        "redirect_uri": settings.REDDIT_REDIRECT_URI,
        "duration": "permanent",  # Request permanent token for refresh_token
        "scope": settings.REDDIT_AUTH_SCOPES,
    }
    return f"{REDDIT_AUTH_URL}?{urllib.parse.urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange OAuth authorization code for access and refresh tokens."""
    if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
        raise ValueError("Reddit Client ID and Secret are not configured in environment variables.")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            REDDIT_TOKEN_URL,
            auth=(settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET),
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.REDDIT_REDIRECT_URI,
            },
            headers={"User-Agent": settings.REDDIT_USER_AGENT},
            timeout=15.0,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Reddit token exchange failed ({response.status_code}): {response.text}"
            )

        data = response.json()
        if "error" in data:
            raise RuntimeError(f"Reddit OAuth error: {data.get('error')}")

        return data


async def fetch_reddit_user_profile(access_token: str) -> Dict[str, Any]:
    """Fetch authenticated Reddit user identity from oauth.reddit.com/api/v1/me."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            REDDIT_OAUTH_API_URL,
            headers={
                "Authorization": f"bearer {access_token}",
                "User-Agent": settings.REDDIT_USER_AGENT,
            },
            timeout=15.0,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to fetch Reddit user profile ({response.status_code}): {response.text}"
            )

        return response.json()


def create_session_jwt(account_id: int) -> str:
    """Create a signed session JWT for the authenticated account."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)
    payload = {
        "sub": str(account_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_session_jwt(token: str) -> Optional[int]:
    """Decode and validate a session JWT, returning the account_id if valid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        account_id_str = payload.get("sub")
        if account_id_str is None:
            return None
        return int(account_id_str)
    except (jwt.PyJWTError, ValueError):
        return None
