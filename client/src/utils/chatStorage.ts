// utils/chatStorage.js

// Save a single chat message to localStorage
export const saveChatToLocalStorage = (user_id: string, session_id: string, question: string, response: string) => {
    const chatEntry = {
      user_id,
      session_id,
      question,
      response,
      timestamp: new Date().toISOString(),
    };
  
    // Retrieve existing chat history or initialize an empty array
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  
    // Add the new chat entry
    chatHistory.push(chatEntry);
  
    // Save the updated chat history back to localStorage
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  };
  
  // Retrieve chat history for a specific session
  export const getSessionChatHistory = (user_id: string, session_id: string) => {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  
    return chatHistory.filter(
      (chat: { user_id: string; session_id: string; }) => chat.user_id === user_id && chat.session_id === session_id
    );
  };
  
  // Retrieve all chat sessions for a user
  export const getUserChatHistory = (user_id: string) => {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  
    // Group chats by session_id
    const sessions: { [key: string]: any[] } = {};
    chatHistory.forEach((chat: { user_id: string; session_id: string | number; }) => {
      if (chat.user_id === user_id) {
        if (!sessions[chat.session_id]) {
          sessions[chat.session_id] = [];
        }
        sessions[chat.session_id].push(chat);
      }
    });
  
    return Object.keys(sessions).map((session_id) => ({
      session_id,
      chats: sessions[session_id],
    }));
  };