from flask import Flask, request, jsonify
from flask_cors import CORS
from data.query_data import query_rag

app = Flask(__name__)
CORS(app)

@app.route('/ask', methods=['POST', 'OPTIONS'])
def ask():
    """
    Handles chat queries and CORS preflight requests for a session.
    
    For OPTIONS requests, returns CORS headers for preflight checks. For POST requests, validates that the JSON payload includes a user ID, session ID (under "chat_id"), and question. It then retrieves the session's chat history, generates a response using available history with retrieval augmented generation, stores the new chat entry, and returns a JSON object with the original question, generated response, and sources.
    """
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    data = request.json
    user_id = data.get("user_id")
    session_id = data.get("chat_id")
    question = data.get("question")
    chat_history = data.get("history")

    if not user_id or not session_id or not question:
        return jsonify({"error": "User ID, session ID, and question are required"}), 400

    contract_history = [chat["response"] for chat in chat_history]

    response_text, sources, _ = query_rag(question, contract_history)

    # Save the new chat to the history for this session
    # save_chat(user_id, session_id, question, response_text)

    return jsonify({
        "question": question,
        "response": response_text,
        "sources": sources
    })

# @app.route('/history/<user_id>/<session_id>', methods=['GET'])
# def session_history(user_id, session_id):
#     chat_history = get_session_chat_history(user_id, session_id)
#     return jsonify(chat_history)

# @app.route('/history/<user_id>', methods=['GET'])
# def history(user_id):
#     chat_history = get_chat_history(user_id)
#     return jsonify(chat_history)

if __name__ == '__main__':
    app.run(debug=True)
