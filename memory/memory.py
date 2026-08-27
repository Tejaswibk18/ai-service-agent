import json
from pathlib import Path
from datetime import datetime


MEMORY_DIR = Path("memory")
MEMORY_FILE = MEMORY_DIR / "server_memory.json"


def save_memory(query, plan, results, analysis):

    MEMORY_DIR.mkdir(exist_ok=True)

    memory = []

    if MEMORY_FILE.exists():

        with open(
            MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            memory = json.load(file)

    memory.append({
        "timestamp": datetime.now().isoformat(),
        "query": query,
        "plan": plan,
        "results": results,
        "analysis": analysis
    })

    with open(
        MEMORY_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            memory,
            file,
            indent=4,
            ensure_ascii=False
        )

def get_recent_memory(limit=5):

    if not MEMORY_FILE.exists():
        return []

    with open(
        MEMORY_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        memory = json.load(file)

    return memory[-limit:]

def get_recent_memory(limit=5):

    if not MEMORY_FILE.exists():
        return []

    with open(
        MEMORY_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        memory = json.load(file)

    return memory[-limit:]