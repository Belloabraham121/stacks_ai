# import sqlite3

# DB_FILE = "chat_history.db"

# # Initialize database
# def init_db():
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute('''
#         CREATE TABLE IF NOT EXISTS chats (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             user_id TEXT,
#             session_id TEXT,
#             question TEXT,
#             response TEXT,
#             timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
#         )
#     ''')
#     conn.commit()
#     conn.close()

# def save_chat(user_id, session_id, question, response):
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute("INSERT INTO chats (user_id, session_id ,question, response) VALUES (?, ?, ?, ?)",
#               (user_id, session_id, question, response))
#     conn.commit()
#     conn.close()

# def get_session_chat_history(user_id, session_id):
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute("SELECT question, response, timestamp FROM chats WHERE user_id = ? AND session_id = ? ORDER BY timestamp DESC", (user_id, session_id))
#     rows = c.fetchall()
#     conn.close()
#     return [{"question": row[0], "response": row[1], "timestamp": row[2]} for row in rows]

# def get_chat_history(user_id):
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute("SELECT session_id FROM chats WHERE user_id = ? GROUP BY session_id", (user_id,))
#     rows = c.fetchall()
#     conn.close()
#     return [{"session_id": row[0], "chats": get_session_chat_history(user_id, row[0])} for row in rows]

# # Initialize DB on first run
# init_db()
