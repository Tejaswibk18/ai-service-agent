from tools.system import collect_server_health


def compare_servers(server_ids: list[str]):
    """
    Collects health information from multiple servers.
    """

    results = []

    for server_id in server_ids:

        health = collect_server_health(
            server_id=server_id
        )

        results.append({
            "server_id": server_id,
            "health": health
        })

    return {
        "success": True,
        "servers": results
    }