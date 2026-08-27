import json
from pathlib import Path


SERVERS_FILE = Path("config/servers.json")

def load_servers():
    with open(
        SERVERS_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def get_server(server_id):

    servers = load_servers()

    server = servers.get(server_id)

    if not server:
        raise ValueError(
            f"Server '{server_id}' not found."
        )

    return server


def list_servers():

    servers = load_servers()

    return list(servers.keys())