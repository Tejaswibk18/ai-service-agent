from fastapi import APIRouter, Depends, HTTPException

from api.auth import verify_api_key
from api.schemas.server import ServerConnectionRequest

from tools.system import collect_server_health
from config.server import list_servers


router = APIRouter(
    prefix="/server",
    tags=["Server"]
)


@router.post("/connect")
def connect_server(
    request: ServerConnectionRequest,
    _: bool = Depends(verify_api_key)
):

    server = {
        "host": request.ip,
        "username": request.username,
        "auth_type": request.auth_type
    }

    if request.auth_type == "password":

        if not request.password:
            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )

        server["password"] = request.password

    elif request.auth_type == "pem":

        if not request.pem_key:
            raise HTTPException(
                status_code=400,
                detail="PEM key path is required"
            )

        server["pem_key"] = request.pem_key

    else:

        raise HTTPException(
            status_code=400,
            detail="Authentication must be password or pem"
        )


    result = collect_server_health(
        server=server
    )


    if not result.get("success"):

        raise HTTPException(
            status_code=500,
            detail=result.get(
                "error",
                "Unable to connect to server"
            )
        )


    return result

@router.get("/health")
def server_health(
    _: bool = Depends(verify_api_key)
):

    result = collect_server_health()

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get(
                "error",
                "Unable to collect server health"
            )
        )

    return result

@router.get("/list")
def get_server_list(
    _: bool = Depends(verify_api_key)
):

    servers = list_servers()

    return {
        "success": True,
        "servers": servers
    }