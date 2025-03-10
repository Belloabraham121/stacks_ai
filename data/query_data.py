import os
from langchain_google_genai import GoogleGenerativeAI
import argparse
from langchain_chroma import Chroma
from get_embedding_function import get_embedding_function
from dotenv import load_dotenv

load_dotenv()

google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in the .env file.")

CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """
Using the Clarity syntax and examples provided in the following context from the Stacks ecosystem (including Clarity language and Stacks.js), generate a complete and functional Clarity smart contract that meets the following requirements:

{question}

Context from Stacks ecosystem:

{context}

Ensure the contract:
- Is written in valid Clarity syntax.
- Adheres to Stacks blockchain conventions (e.g., STX token usage, principal types).
- Includes all necessary components (public/private functions, data variables, etc.) to fulfill the specified requirements.
- Is functional within the Stacks ecosystem.
"""

SUPPORTED_MESSAGE = (
    "This tool only supports generating or modifying Clarity smart contracts for the Stacks ecosystem "
    "using Clarity language and Stacks.js context. Please ask about writing or modifying a Clarity contract "
    "related to Stacks (e.g., 'write a contract for an NFT marketplace on Stacks')."
)

def main():
    print("Welcome to the Stacks Clarity Contract Generator!")
    print("This tool generates or modifies Clarity smart contracts for the Stacks ecosystem.")
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
    # Load the Chroma database with Stacks ecosystem data
    embedding_function = get_embedding_function()
    try:
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    except Exception as e:
        raise ValueError(f"Error loading Chroma database: {e}")

    # Search for relevant context from the Stacks ecosystem
    results = db.similarity_search_with_score(query_text, k=7)
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])

    # Initialize the Google Gemini LLM
    llm_gemini = GoogleGenerativeAI(
        model="gemini-1.5-pro",
        max_output_tokens=1024,
        google_api_key=google_api_key,
    )

    # Check if the query is relevant to Clarity contracts in Stacks
    query_lower = query_text.lower()
    is_creation = "write" in query_lower or "create" in query_lower or "generate" in query_lower
    is_modification = "modify" in query_lower or "update" in query_lower or "add" in query_lower

    if not (is_creation or (is_modification and current_contract)):
        return SUPPORTED_MESSAGE, [], False

    # Ensure the query relates to Stacks/Clarity
    if "clarity" not in query_lower and "stacks" not in query_lower and not current_contract:
        return SUPPORTED_MESSAGE, [], False

    # Prompt for creating or modifying a Clarity contract
    if is_creation:
        # Prompt for a new Clarity contract
        prompt = (
            f"Generate a complete and functional Clarity smart contract for the Stacks ecosystem that fulfills the following description: {query_text}\n\n"
            f"Use the syntax and examples from the provided Stacks ecosystem context (Clarity language and Stacks.js):\n{context_text}"
        )
    else:
        # Prompt to modify the existing contract
        prompt = (
            f"Here is the current Clarity smart contract for the Stacks ecosystem:\n\n{current_contract}\n\n"
            f"Modify this contract to include the following additional functionality: {query_text}\n\n"
            f"Use the syntax and examples from the provided Stacks ecosystem context (Clarity language and Stacks.js):\n{context_text}\n\n"
            "Ensure the modified contract is complete, functional, and adheres to Stacks conventions."
        )

    try:
        response_text = llm_gemini.invoke(prompt)
    except Exception as e:
        raise ValueError(f"Error invoking Google Gemini LLM: {e}")

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    return response_text, sources, True

if __name__ == "__main__":
    main()