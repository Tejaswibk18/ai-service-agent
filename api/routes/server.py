from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from api.auth import verify_api_key
from api.schemas.server import ServerConnectionRequest

from tools.system import collect_server_health
from config.server import (
    list_servers,
    add_server,
    delete_server
)


router = APIRouter(
    prefix="/server",
    tags=["Server"]
)


# =========================================================
# PEM STORAGE
# =========================================================

CREDENTIALS_DIR = Path("credentials")

CREDENTIALS_DIR.mkdir(
    exist_ok=True
)


# =========================================================
# CONNECT EXISTING SERVER
# =========================================================

@router.post("/connect")
def connect_server(
    request: ServerConnectionRequest
):

    try:

        result = collect_server_health(
            server_id=request.server_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc)
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


# =========================================================
# SERVER HEALTH
# =========================================================

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


# =========================================================
# LIST SERVERS
# =========================================================

@router.get("/list")
def get_server_list():

    return {
        "success": True,
        "servers": list_servers()
    }


# =========================================================
# TEST CONNECTION
# =========================================================

@router.post("/test-connection")
async def test_server_connection(

    server_id: str = Form(...),

    host: str = Form(...),

    username: str = Form(...),

    auth_type: str = Form(...),

    password: str | None = Form(
        default=None
    ),

    pem_file: UploadFile | None = File(
        default=None
    )
):

    # -----------------------------------------------------
    # Validate authentication type
    # -----------------------------------------------------

    if auth_type not in [
        "password",
        "pem"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Authentication must be password or pem"
        )


    # -----------------------------------------------------
    # Password authentication
    # -----------------------------------------------------

    if auth_type == "password":

        if not password:

            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )


        server = {

            "host": host,

            "username": username,

            "auth_type": "password",

            "password": password

        }


        try:

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


            return {

                "success": True,

                "message": "Connection successful"

            }


        except HTTPException:

            raise


        except Exception as exc:

            raise HTTPException(
                status_code=500,
                detail=str(exc)
            )


    # -----------------------------------------------------
    # PEM authentication
    # -----------------------------------------------------

    if auth_type == "pem":

        if pem_file is None:

            raise HTTPException(
                status_code=400,
                detail="PEM file is required"
            )


        if not pem_file.filename:

            raise HTTPException(
                status_code=400,
                detail="Invalid PEM file"
            )


        if not pem_file.filename.lower().endswith(
            ".pem"
        ):

            raise HTTPException(
                status_code=400,
                detail="Only .pem files are allowed"
            )


        temporary_path = (
            CREDENTIALS_DIR /
            f"test_{server_id}.pem"
        )


        try:

            file_content = await pem_file.read()


            if not file_content:

                raise HTTPException(
                    status_code=400,
                    detail="PEM file is empty"
                )


            with open(
                temporary_path,
                "wb"
            ) as file:

                file.write(
                    file_content
                )


            server = {

                "host": host,

                "username": username,

                "auth_type": "pem",

                "pem_key": str(
                    temporary_path
                )

            }


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


            return {

                "success": True,

                "message": "Connection successful"

            }


        except HTTPException:

            raise


        except Exception as exc:

            raise HTTPException(
                status_code=500,
                detail=str(exc)
            )


        finally:

            if temporary_path.exists():

                temporary_path.unlink()


# =========================================================
# ADD SERVER
# =========================================================

@router.post("/add")
async def add_new_server(

    server_id: str = Form(...),

    host: str = Form(...),

    username: str = Form(...),

    auth_type: str = Form(...),

    password: str | None = Form(
        default=None
    ),

    pem_file: UploadFile | None = File(
        default=None
    )
):

    # -----------------------------------------------------
    # Validate authentication type
    # -----------------------------------------------------

    if auth_type not in [
        "password",
        "pem"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Authentication must be password or pem"
        )


    # -----------------------------------------------------
    # Password authentication
    # -----------------------------------------------------

    if auth_type == "password":

        if not password:

            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )


        server = {

            "host": host,

            "username": username,

            "auth_type": "password",

            "password": password

        }


    # -----------------------------------------------------
    # PEM authentication
    # -----------------------------------------------------

    elif auth_type == "pem":

        if pem_file is None:

            raise HTTPException(
                status_code=400,
                detail="PEM file is required"
            )


        if not pem_file.filename:

            raise HTTPException(
                status_code=400,
                detail="Invalid PEM file"
            )


        if not pem_file.filename.lower().endswith(
            ".pem"
        ):

            raise HTTPException(
                status_code=400,
                detail="Only .pem files are allowed"
            )


        try:

            file_content = await pem_file.read()


            if not file_content:

                raise HTTPException(
                    status_code=400,
                    detail="PEM file is empty"
                )


            pem_filename = (
                f"{server_id}.pem"
            )


            pem_path = (
                CREDENTIALS_DIR /
                pem_filename
            )


            with open(
                pem_path,
                "wb"
            ) as file:

                file.write(
                    file_content
                )


            server = {

                "host": host,

                "username": username,

                "auth_type": "pem",

                "pem_key": str(
                    pem_path
                )

            }


        except HTTPException:

            raise


        except Exception as exc:

            raise HTTPException(
                status_code=500,
                detail=f"Unable to store PEM file: {exc}"
            )


    # -----------------------------------------------------
    # Save server to database
    # -----------------------------------------------------

    try:

        add_server(
            server_id,
            server
        )


    except ValueError as exc:

        # Remove PEM file if database insertion failed
        if auth_type == "pem":

            pem_path = (
                CREDENTIALS_DIR /
                f"{server_id}.pem"
            )


            if pem_path.exists():

                pem_path.unlink()


        raise HTTPException(
            status_code=409,
            detail=str(exc)
        )


    except Exception as exc:

        if auth_type == "pem":

            pem_path = (
                CREDENTIALS_DIR /
                f"{server_id}.pem"
            )


            if pem_path.exists():

                pem_path.unlink()


        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )


    return {

        "success": True,

        "message": "Server added successfully",

        "server_id": server_id

    }


# =========================================================
# DELETE SERVER
# =========================================================

@router.delete("/{server_id}")
def remove_server(
    server_id: str
):

    try:

        server = None

        try:

            from config.server import get_server

            server = get_server(
                server_id
            )

        except ValueError:

            raise HTTPException(
                status_code=404,
                detail=f"Server '{server_id}' not found."
            )


        delete_server(
            server_id
        )


        # -------------------------------------------------
        # Remove backend PEM file
        # -------------------------------------------------

        if (
            server.get("auth_type") == "pem"
        ):

            pem_path = (
                server.get("pem_key")
            )


            if pem_path:

                path = Path(
                    pem_path
                )


                if path.exists():

                    path.unlink()


        return {

            "success": True,

            "message": "Server removed successfully",

            "server_id": server_id

        }


    except HTTPException:

        raise


    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )