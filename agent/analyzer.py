import json

from llm.gemini import generate_response
from agent.memory_context import build_memory_context
from rag.retriever import retrieve


ANALYZER_PROMPT = """
You are a server health analysis component.

Analyze the current server data.

Use the provided previous history and documentation
when relevant.

Do not invent information.

Provide:
1. Overall health status
2. Important observations
3. Potential concerns
4. Recommended actions
"""


def analyze_results(results, user_query):

    memory_context = build_memory_context()

    documents = retrieve(user_query)

    prompt = ANALYZER_PROMPT

    if memory_context:

        prompt += f"""

Previous server history:

{memory_context}
"""

    if documents:

        prompt += """

Relevant documentation:

"""

        for document in documents:

            prompt += (
                f"\n--- {document['file']} ---\n"
                f"{document['content']}\n"
            )

    prompt += f"""

Current server data:

{json.dumps(results, indent=2)}
"""

    response = generate_response(
        contents=prompt
    )

    return response.text