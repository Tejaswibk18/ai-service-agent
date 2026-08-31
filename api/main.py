from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.agent import router as agent_router
from api.routes.server import router as server_router

from database.connection import engine
from database.models import Base

app = FastAPI(
    title="AI Server Agent",
    description="AI-powered server management agent",
    version="1.0.0"
)

Base.metadata.create_all(
    bind=engine
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(agent_router)
app.include_router(server_router)


@app.get("/")
def root():
    return {
        "message": "AI Server Agent API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }