from google.genai import types

from llm.gemini import generate_response
from tools.system import collect_server_health


tools = {
    "collect_server_health": collect_server_health,
}


def execute_tool(function_call):

    tool = tools.get(function_call.name)

    if not tool:
        raise ValueError(
            f"Unknown tool: {function_call.name}"
        )

    arguments = dict(function_call.args)

    return tool(**arguments)


def run_agent(user_input):

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=user_input
                )
            ],
        )
    ]

    while True:

        response = generate_response(
            contents=contents,
            tools=list(tools.values()),
        )

        candidate = response.candidates[0]

        contents.append(candidate.content)

        function_calls = []

        for part in candidate.content.parts:

            if part.function_call:
                function_calls.append(
                    part.function_call
                )

        if not function_calls:

            return response.text

        tool_response_parts = []

        for function_call in function_calls:

            print(
                f"\nTool requested: "
                f"{function_call.name}"
            )

            print(
                f"Arguments: "
                f"{function_call.args}"
            )

            result = execute_tool(
                function_call
            )

            print(
                f"Tool result: {result}"
            )

            tool_response_parts.append(
                types.Part.from_function_response(
                    name=function_call.name,
                    response=result,
                )
            )

        contents.append(
            types.Content(
                role="user",
                parts=tool_response_parts,
            )
        )