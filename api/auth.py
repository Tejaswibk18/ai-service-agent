import os

from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader


load_dotenv()


API_KEY = os.getenv("AGENT_API_KEY")

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=True
)


def verify_api_key(
    api_key: str = Security(api_key_header)
):

    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="API key is not configured"
        )

    if api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    return True