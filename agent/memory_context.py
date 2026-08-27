import json

from memory.memory import get_recent_memory


def build_memory_context(limit=5):

    memories = get_recent_memory(limit)

    if not memories:
        return ""

    return json.dumps(
        memories,
        indent=2,
        ensure_ascii=False
    )