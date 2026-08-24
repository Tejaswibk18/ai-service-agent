import os

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is not set."
    )


client = genai.Client(
    api_key=api_key
)


def generate_response(
    contents,
    tools=None,
):

    return client.models.generate_content(
        model="gemini-3.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            tools=tools or [],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        ),
    )