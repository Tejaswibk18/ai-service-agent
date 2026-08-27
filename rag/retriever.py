from pathlib import Path


KNOWLEDGE_DIR = Path("knowledge")


def retrieve(query, limit=3):

    if not KNOWLEDGE_DIR.exists():
        return []

    query_words = set(
        query.lower().split()
    )

    matches = []

    for file in KNOWLEDGE_DIR.rglob("*"):

        if not file.is_file():
            continue

        try:
            content = file.read_text(
                encoding="utf-8"
            )
        except Exception:
            continue

        content_words = set(
            content.lower().split()
        )

        score = len(
            query_words & content_words
        )

        if score > 0:

            matches.append({
                "file": str(file),
                "score": score,
                "content": content
            })

    matches.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return matches[:limit]