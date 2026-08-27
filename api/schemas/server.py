from pydantic import BaseModel


class ServerConnectionRequest(BaseModel):
    ip: str
    username: str
    auth_type: str
    password: str | None = None
    pem_key: str | None = None