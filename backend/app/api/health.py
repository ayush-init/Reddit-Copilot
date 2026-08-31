from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Health Check")
def health_check():
    """Simple health check endpoint to confirm backend is operational."""
    return {
        "status": "ok",
        "message": "Reddit Copilot backend is running",
    }
