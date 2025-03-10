from flask import Flask, request, jsonify
from chat_history import save_chat, get_chat_history
from data.query_data import query_rag

app = Flask(__name__)

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    user_id = data.get("user_id")
    question = data.get("question")

    if not user_id or not question:
        return jsonify({"error": "User ID and question are required"}), 400

    response_text, sources, _ = query_rag(question, None)

    # Save to chat history
    save_chat(user_id, question, response_text)

    return jsonify({
        "question": question,
        "response": response_text,
        "sources": sources
    })

@app.route('/history/<user_id>', methods=['GET'])
def history(user_id):
    chat_history = get_chat_history(user_id)
    return jsonify(chat_history)

if __name__ == '__main__':
    app.run(debug=True)
