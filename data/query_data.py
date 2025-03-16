import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAI
from langchain_chroma import Chroma
from get_embedding_function import get_embedding_function  
# import logging


# logging.basicConfig(level=logging.DEBUG)

load_dotenv()


google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in the .env file.")


CHROMA_PATH = "chroma"


SUPPORTED_MESSAGE = (
    "This tool only supports generating or modifying Clarity smart contracts for the Stacks ecosystem "
    "using Clarity language and Stacks.js context. Please ask about writing or modifying a Clarity contract "
    "related to Stacks (e.g., 'write a contract for an NFT marketplace on Stacks')."
)

def main():
    """
    Main function to run the Clarity Contract Generator interactive loop.
    """
    print("Welcome to the Stacks Clarity Contract Generator!")
    print("This tool generates or modifies Clarity smart contracts for the Stacks ecosystem.")
    print("Enter your requests below. Type 'quit' to exit.")
    
 
    current_contracts = []
    
    while True:
     
        query_text = input("Enter your request: ")
        if query_text.lower() == "quit":
            print("Goodbye!")
            break
        
      
        response_text, sources, is_contract = query_rag(query_text, current_contracts)
        
        
        if is_contract:
            current_contracts.append(response_text)
        

        formatted_response = f"Response:\n{response_text}\n\nSources: {sources}"
        print(formatted_response)

def query_rag(query_text: str, current_contracts: list):
    """
    Process a user query using Retrieval-Augmented Generation (RAG).

    Args:
        query_text (str): The user's query, potentially including frontend code.
        current_contracts (list): List of previously generated contracts.

    Returns:
        tuple: (response_text, sources, is_contract)
            - response_text: The LLM's response (contract code + explanation or a message).
            - sources: List of document IDs from the Chroma database.
            - is_contract: Boolean indicating if the response is a contract.
    """
    
    embedding_function = get_embedding_function()
    try:
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    except Exception as e:
        raise ValueError(f"Error loading Chroma database: {e}")


    results = db.similarity_search_with_score(query_text, k=7)
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])


    contract_history = "\n\n---\n\n".join(current_contracts) if current_contracts else "No prior contract exists."

    # Construct the prompt for the LLM
    prompt = f"""
    First, determine if the following query is directly related to generating or modifying a Clarity smart contract for the Stacks ecosystem, or integrating it with Stacks.js (including based on provided frontend code).

    Query: {query_text}

    If it is not related, respond with exactly: "{SUPPORTED_MESSAGE}"

    If it is related, provide a response in the following format:
    ```
    [Clarity smart contract code here, if applicable]
    ```
    ### Detailed Explanation
    - **Purpose**: [Describe what the contract or integration does and its use case.]
    - **How It Works**: [Explain the contract’s functions or the integration logic.]
    - **Usage**: [Provide an example of how to use the contract or integration.]

    ### Stacks.js Integration (if requested or if frontend code is provided)
    ```
    [JavaScript code showing how to interact with the contract or integrate with the provided frontend code using Stacks.js]
    ```
    - **Explanation**: [Explain how the Stacks.js code works with the contract or frontend.]

    ### Installation Commands
    [List the `npm install` commands for required Stacks.js packages.]

    ### Debugging Tips
    [Provide practical debugging advice, e.g., common errors and how to fix them.]

    Here is the history of Clarity smart contracts from this session:

    {contract_history}

    Based on the query, either:
    - Generate a new Clarity contract if requested.
    - Modify the most recent contract from the history if specified.
    - Provide Stacks.js integration for the most recent contract or the provided frontend code if integration is requested.

    Use the syntax and examples from the provided Stacks ecosystem context (Clarity language and Stacks.js):

    {context_text}

    Ensure the contract (if included) is complete, functional, and adheres to Stacks conventions. If frontend code is provided in the query, analyze it and tailor the Stacks.js integration accordingly.
    """

    # Initialize the Google Gemini LLM
    llm_gemini = GoogleGenerativeAI(
        model="gemini-1.5-pro",
        max_output_tokens=2048,  
        google_api_key=google_api_key,
    )

    # Invoke the LLM with the prompt
    try:
        response_text = llm_gemini.invoke(prompt)
    except Exception as e:
        raise ValueError(f"Error invoking Google Gemini LLM: {e}")

    # Determine if the response is a contract or integration (not the supported message)
    is_contract = response_text.strip() != SUPPORTED_MESSAGE.strip()

    # Extract sources from the retrieved documents
    sources = [doc.metadata.get("id", None) for doc, _score in results]

    return response_text, sources, is_contract

if __name__ == "__main__":
    main()