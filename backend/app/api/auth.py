import secrets
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.db.models import RedditAccount
from app.services.reddit_oauth import (
    get_authorization_url,
    exchange_code_for_tokens,
    fetch_reddit_user_profile,
    create_session_jwt,
    decode_session_jwt,
)

router = APIRouter(prefix="/auth", tags=["auth"])

OAUTH_STATE_COOKIE = "reddit_oauth_state"


@router.get("/reddit/login", summary="Initiate Reddit OAuth Login")
def reddit_login(response: Response):
    """Generates state and redirects user to Reddit OAuth authorization page."""
    if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
        error_msg = "Reddit OAuth credentials (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET) are not configured."
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote(error_msg)}"
        )

    state = secrets.token_urlsafe(32)
    auth_url = get_authorization_url(state)

    redirect_resp = RedirectResponse(url=auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    redirect_resp.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        samesite="lax",
        max_age=600,  # 10 minutes
    )
    return redirect_resp


@router.get("/reddit/callback", summary="Reddit OAuth Callback")
async def reddit_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Handles OAuth callback from Reddit, exchanges tokens, saves user, and sets session cookie."""
    if error:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote(error)}"
        )

    if not code:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote('Missing authorization code from Reddit')}"
        )

    # Validate state to prevent CSRF attacks
    saved_state = request.cookies.get(OAUTH_STATE_COOKIE)
    if saved_state and state and saved_state != state:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote('Invalid OAuth state parameter (possible CSRF)')}"
        )

    try:
        # 1. Exchange code for OAuth tokens
        token_data = await exchange_code_for_tokens(code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        # 2. Fetch Reddit user profile
        profile = await fetch_reddit_user_profile(access_token)
        reddit_id = profile.get("id")
        username = profile.get("name")
        icon_img = profile.get("icon_img", "").split("?")[0] if profile.get("icon_img") else None
        total_karma = profile.get("total_karma", 0)
        link_karma = profile.get("link_karma", 0)
        comment_karma = profile.get("comment_karma", 0)
        created_utc = profile.get("created_utc")

        # 3. Upsert into database
        account = db.query(RedditAccount).filter(RedditAccount.username == username).first()
        if not account:
            account = RedditAccount(
                reddit_id=f"t2_{reddit_id}",
                username=username,
                icon_img=icon_img,
                total_karma=total_karma,
                link_karma=link_karma,
                comment_karma=comment_karma,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=expires_at,
                reddit_created_utc=created_utc,
            )
            db.add(account)
        else:
            account.reddit_id = f"t2_{reddit_id}"
            account.icon_img = icon_img
            account.total_karma = total_karma
            account.link_karma = link_karma
            account.comment_karma = comment_karma
            account.access_token = access_token
            if refresh_token:
                account.refresh_token = refresh_token
            account.token_expires_at = expires_at
            account.reddit_created_utc = created_utc

        db.commit()
        db.refresh(account)

        # 4. Create session token and set HTTP-only cookie
        session_token = create_session_jwt(account.id)
        redirect_resp = RedirectResponse(
            url=f"{settings.FRONTEND_URL}?auth_success=1",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )
        redirect_resp.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_token,
            httponly=True,
            samesite="lax",
            max_age=settings.SESSION_EXPIRE_DAYS * 24 * 3600,
            path="/",
        )
        redirect_resp.delete_cookie(key=OAUTH_STATE_COOKIE)
        return redirect_resp

    except Exception as exc:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}?auth_error={urllib.parse.quote(str(exc))}"
        )


def get_current_account(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[RedditAccount]:
    """Extract authenticated Reddit account from session cookie or Authorization header."""
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        # Check Authorization Bearer header as fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    account_id = decode_session_jwt(token)
    if not account_id:
        return None

    return db.query(RedditAccount).filter(RedditAccount.id == account_id).first()


@router.get("/me", summary="Get Current Authenticated User")
def get_me(current_account: Optional[RedditAccount] = Depends(get_current_account)):
    """Returns the profile of the currently connected Reddit user or unauthenticated status."""
    if not current_account:
        return {
            "authenticated": False,
            "user": None,
        }
    return {
        "authenticated": True,
        "user": current_account.to_dict(),
    }


@router.post("/logout", summary="Log Out Connected Account")
def logout(response: Response):
    """Clears the session cookie."""
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return {
        "status": "ok",
        "message": "Logged out successfully",
    }
