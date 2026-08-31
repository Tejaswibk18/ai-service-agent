from database.connection import SessionLocal
from database.models import Server

from config.server import encrypt_credential


def migrate_credentials():

    db = SessionLocal()

    try:

        servers = (
            db.query(Server)
            .all()
        )

        migrated = 0
        skipped = 0

        for server in servers:

            if not server.credential:

                print(
                    f"Skipping '{server.server_id}' - no credential"
                )

                skipped += 1

                continue


            try:

                # Test whether the credential
                # is already encrypted.
                from config.server import decrypt_credential

                decrypt_credential(
                    server.credential
                )

                print(
                    f"Skipping '{server.server_id}' - already encrypted"
                )

                skipped += 1

                continue

            except Exception:

                # Credential is plaintext.
                pass


            server.credential = encrypt_credential(
                server.credential
            )

            migrated += 1


        db.commit()


        print()
        print("Credential migration completed.")
        print(f"Migrated: {migrated}")
        print(f"Skipped: {skipped}")


    except Exception as exc:

        db.rollback()

        print(
            f"Credential migration failed: {exc}"
        )

        raise


    finally:

        db.close()


if __name__ == "__main__":

    migrate_credentials()