import os
from query_data import query_rag
from langchain_google_genai import GoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
       raise ValueError("GOOGLE_API_KEY environment variable not set")



EVAL_PROMPT = """
Expected Response: {expected_response}
Actual Response: {actual_response}
---
(Answer with 'true' or 'false') Does the actual response match the expected response? 
"""


