import os

from dotenv import load_dotenv
from cryptography.fernet import Fernet

from database.connection import SessionLocal
from database.models import Server


load_dotenv()


SERVER_CREDENTIAL_KEY = os.getenv(
    "SERVER_CREDENTIAL_KEY"
)


if not SERVER_CREDENTIAL_KEY:
    raise RuntimeError(
        "SERVER_CREDENTIAL_KEY is not configured."
    )


cipher = Fernet(
    SERVER_CREDENTIAL_KEY.encode()
)


def encrypt_credential(
    credential: str
) -> str:

    return cipher.encrypt(
        credential.encode()
    ).decode()


def decrypt_credential(
    credential: str
) -> str:

    return cipher.decrypt(
        credential.encode()
    ).decode()


def get_server(server_id):

    db = SessionLocal()

    try:

        server = (
            db.query(Server)
            .filter(
                Server.server_id == server_id
            )
            .first()
        )


        if not server:

            raise ValueError(
                f"Server '{server_id}' not found."
            )


        result = {
            "host": server.host,
            "username": server.username,
            "auth_type": server.auth_type
        }


        if server.credential:

            credential = decrypt_credential(
                server.credential
            )


            if server.auth_type == "password":

                result["password"] = credential


            elif server.auth_type == "pem":

                result["pem_key"] = credential


        return result

    finally:

        db.close()


def list_servers():

    db = SessionLocal()

    try:

        servers = (
            db.query(Server)
            .order_by(Server.server_id)
            .all()
        )


        return [
            server.server_id
            for server in servers
        ]

    finally:

        db.close()


def add_server(
    server_id,
    server
):

    db = SessionLocal()

    try:

        existing_server = (
            db.query(Server)
            .filter(
                Server.server_id == server_id
            )
            .first()
        )


        if existing_server:

            raise ValueError(
                f"Server '{server_id}' already exists."
            )


        credential = None


        if server["auth_type"] == "password":

            credential = server.get(
                "password"
            )


        elif server["auth_type"] == "pem":

            credential = server.get(
                "pem_key"
            )


        if credential:

            credential = encrypt_credential(
                credential
            )


        new_server = Server(

            server_id=server_id,

            host=server["host"],

            username=server["username"],

            auth_type=server["auth_type"],

            credential=credential

        )


        db.add(new_server)

        db.commit()


    except Exception:

        db.rollback()

        raise

    finally:

        db.close()


def delete_server(server_id):

    db = SessionLocal()

    try:

        server = (
            db.query(Server)
            .filter(
                Server.server_id == server_id
            )
            .first()
        )


        if not server:

            raise ValueError(
                f"Server '{server_id}' not found."
            )


        db.delete(server)

        db.commit()


    except Exception:

        db.rollback()

        raise

    finally:

        db.close()