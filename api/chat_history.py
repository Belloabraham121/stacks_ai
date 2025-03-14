import sqlite3

DB_FILE = "chat_history.db"

# Initialize database
def init_db():
    """
    Initializes the SQLite database and creates the 'chats' table if it does not exist.
    
    Connects to the database specified by DB_FILE and ensures that the 'chats'
    table is set up with columns for an auto-increment primary key (id), user
    identifier, session identifier, question, response, and a timestamp that
    defaults to the current time.
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            session_id TEXT,
            question TEXT,
            response TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_chat(user_id, session_id, question, response):
    """
    Saves a chat record in the SQLite database.
    
    Inserts a new entry into the 'chats' table using the provided user and session
    identifiers along with the question and response. The change is committed and
    the connection is closed.
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO chats (user_id, session_id ,question, response) VALUES (?, ?, ?, ?)",
              (user_id, session_id, question, response))
    conn.commit()
    conn.close()

def get_session_chat_history(user_id, session_id):
    """
    Retrieves a user's chat history for a specific session.
    
    Connects to the SQLite database and fetches chat entries matching the specified
    user and session identifiers. Returns a list of dictionaries, each containing
    the 'question', 'response', and 'timestamp' for a chat record, ordered with the
    most recent entries first.
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT question, response, timestamp FROM chats WHERE user_id = ? AND session_id = ? ORDER BY timestamp DESC", (user_id, session_id))
    rows = c.fetchall()
    conn.close()
    return [{"question": row[0], "response": row[1], "timestamp": row[2]} for row in rows]

def get_chat_history(user_id):
    """
    Retrieves chat sessions and their histories for a given user.
    
    Connects to the SQLite database to find distinct session IDs associated with the
    user, then compiles each session's chat history via get_session_chat_history. Each
    result is a dictionary containing a "session_id" and its corresponding "chats".
    
    Returns:
        list[dict]: A list of dictionaries, each with keys:
            "session_id": The unique session identifier.
            "chats": A list of chat records for the session.
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT session_id FROM chats WHERE user_id = ? GROUP BY session_id", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{"session_id": row[0], "chats": get_session_chat_history(user_id, row[0])} for row in rows]

# Initialize DB on first run
init_db()
