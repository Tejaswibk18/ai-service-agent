from pathlib import Path


OUTPUT_DIR = Path("outputs")
REPORT_FILE = OUTPUT_DIR / "health_report.md"


def save_report(analysis):

    OUTPUT_DIR.mkdir(exist_ok=True)

    with open(
        REPORT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(analysis)