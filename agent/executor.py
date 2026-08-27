from tools.system import collect_server_health
from tools.comparison import compare_servers


TOOLS = {
    "collect_server_health": collect_server_health,
    "compare_servers": compare_servers
}


def execute_step(step):

    tool_name = step["tool"]
    arguments = step.get("args", {})

    tool = TOOLS.get(tool_name)

    if not tool:
        raise ValueError(
            f"Unknown tool: {tool_name}"
        )

    return tool(**arguments)


def execute_plan(plan):

    results = []

    for step in plan["steps"]:

        result = execute_step(step)

        results.append({
            "tool": step["tool"],
            "result": result
        })

    return results