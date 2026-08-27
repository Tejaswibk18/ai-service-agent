from pydantic import BaseModel


class AgentRequest(BaseModel):
    query: str


class AgentResponse(BaseModel):
    success: bool
    query: str
    plan: dict
    results: list
    analysis: str | None