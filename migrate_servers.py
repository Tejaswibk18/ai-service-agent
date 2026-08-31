import json
from pathlib import Path

from database.connection import SessionLocal
from database.models import Server


SERVERS_FILE = Path("config/servers.json")


def migrate_servers():

    with open(
        SERVERS_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        servers = json.load(file)


    db = SessionLocal()

    try:

        migrated = 0
        skipped = 0


        for server_id, server_data in servers.items():

            existing_server = (
                db.query(Server)
                .filter(
                    Server.server_id == server_id
                )
                .first()
            )


            if existing_server:

                print(
                    f"Skipping '{server_id}' - already exists"
                )

                skipped += 1

                continue


            credential = None


            if server_data["auth_type"] == "password":

                credential = server_data.get(
                    "password"
                )


            elif server_data["auth_type"] == "pem":

                credential = server_data.get(
                    "pem_key"
                )


            new_server = Server(

                server_id=server_id,

                host=server_data["host"],

                username=server_data["username"],

                auth_type=server_data["auth_type"],

                credential=credential

            )


            db.add(new_server)

            migrated += 1


        db.commit()


        print()
        print(
            f"Migration completed."
        )

        print(
            f"Migrated: {migrated}"
        )

        print(
            f"Skipped: {skipped}"
        )


    except Exception as exc:

        db.rollback()

        print(
            f"Migration failed: {exc}"
        )

        raise


    finally:

        db.close()


if __name__ == "__main__":

    migrate_servers()