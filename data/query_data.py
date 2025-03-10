import os
from langchain_google_genai import GoogleGenerativeAI
import argparse
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from data.get_embedding_function import get_embedding_function
from dotenv import load_dotenv

load_dotenv()

google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in the .env file.")

CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """
Using the Clarity syntax and examples provided in the following context, generate a complete and functional smart contract that meets the following requirements:

{question}

Context:

{context}

Ensure that the contract is written in valid Clarity syntax and includes all necessary components to fulfill the specified requirements.
"""



def main():
    print("Welcome to the Clarity Contract Generator!")
    print("Enter your requests below. Type 'quit' to exit.")
    current_contract = ""
    while True:
        query_text = input("Enter your request: ")
        if query_text.lower() == "quit":
            print("Goodbye!")
            break
        response_text, sources, is_contract = query_rag(query_text, current_contract)
        if is_contract:
            current_contract = response_text
        formatted_response = f"Response:\n{response_text}\n\nSources: {sources}"
        print(formatted_response)

def query_rag(query_text: str, current_contract: str):
    # Prepare the Chroma database
    embedding_function = get_embedding_function()
    try:
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    except Exception as e:
        raise ValueError(f"Error loading Chroma database: {e}")

    # Search the database for relevant context
    results = db.similarity_search_with_score(query_text, k=7)
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])

    # Initialize the Google Gemini LLM
    llm_gemini = GoogleGenerativeAI(
        model="gemini-1.5-pro",
        max_output_tokens=1024,
        google_api_key=google_api_key,
    )

    # Decide whether to create a new contract or modify the existing one
    if "write" in query_text.lower() or "create" in query_text.lower():
        # Prompt for a new contract
        prompt = (
            f"Generate a complete and functional Clarity smart contract that fulfills the following description: {query_text}\n\n"
            f"Use the syntax and examples from the provided context:\n{context_text}"
        )
    elif current_contract:
        # Prompt to modify the existing contract
        prompt = (
            f"Here is the current Clarity smart contract:\n\n{current_contract}\n\n"
            f"Modify this contract to include the following additional functionality: {query_text}\n\n"
            f"Use the syntax and examples from the provided context:\n{context_text}\n\n"
            "Ensure the modified contract is complete and functional."
        )
    else:
        # No contract exists yet, and this isn’t a creation request
        return "Please first create a contract by saying 'write a contract' or similar.", [], False


    try:
        response_text = llm_gemini.invoke(prompt)
    except Exception as e:
        raise ValueError(f"Error invoking Google Gemini LLM: {e}")

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    return response_text, sources, True

if __name__ == "__main__":
    main()


