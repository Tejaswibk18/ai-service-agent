import os

from dotenv import load_dotenv


load_dotenv()


SERVER_HOST = os.getenv("SERVER_HOST")
SERVER_USERNAME = os.getenv("SERVER_USERNAME")
SERVER_PASSWORD = os.getenv("SERVER_PASSWORD")
SERVER_PEM_KEY = os.getenv("SERVER_PEM_KEY")