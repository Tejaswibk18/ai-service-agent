import json
from pathlib import Path


OUTPUT_DIR = Path("outputs")
OUTPUT_FILE = OUTPUT_DIR / "agent_output.json"


def save_output(data):
    OUTPUT_DIR.mkdir(exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            indent=4,
            ensure_ascii=False
        )