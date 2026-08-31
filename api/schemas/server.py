from pydantic import BaseModel


class ServerConnectionRequest(BaseModel):
    server_id: str


class ServerCreateRequest(BaseModel):
    server_id: str
    host: str
    username: str
    auth_type: str
    password: str | None = None