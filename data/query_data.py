import os
from langchain_google_genai import GoogleGenerativeAI
import argparse
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from get_embedding_function import get_embedding_function
from dotenv import load_dotenv

load_dotenv()

google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in the .env file.")

CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""



def main():
    # Create CLI.
    parser = argparse.ArgumentParser()
    parser.add_argument("query_text", type=str, help="The query text.")
    args = parser.parse_args()
    query_text = args.query_text
    query_rag(query_text)


def query_rag(query_text: str):
    # Prepare the DB.
    embedding_function = get_embedding_function()

    try:
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    except Exception as e:
        raise ValueError(f"Error loading Chroma database: {e}")

    # Search the DB.
    results = db.similarity_search_with_score(query_text, k=5)

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)


    # Google Gemini LLM
    llm_gemini = GoogleGenerativeAI(
        model="gemini-1.5-pro",
        max_output_tokens=1024,
        google_api_key=google_api_key,
    )


    try:
        response_text = llm_gemini.invoke(prompt)
    except Exception as e:
        raise ValueError(f"Error invoking Google Gemini LLM: {e}")

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    formatted_response = f"Response: {response_text}\nSources: {sources}"
    print(formatted_response)
    return response_text


if __name__ == "__main__":
    main()



