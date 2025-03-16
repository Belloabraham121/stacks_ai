"use client"

import { Send, Menu, X, Moon, Sun, LogOut, PlusCircle } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { saveChatToLocalStorage, getSessionChatHistory, getUserChatHistory } from "@/utils/chatStorage"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import ChatMessage from "./chat-message"
import { getOrCreateUserId } from "@/utils/userId"
import { set } from "date-fns"
import { get } from "http"

// Simplified interfaces for our data types
interface User {
  id: string;
  name: string;
}

interface ChatHistory {
  chats: { question: string, response: string, timestamp: string }[];
  session_id: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

export default function ChatInterface() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Login and user state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [username, setUsername] = useState("")
  const [userId, setUserId] = useState<string>(getOrCreateUserId())
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(crypto.randomUUID())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // You could save this preference to localStorage
    localStorage.setItem('darkMode', (!isDarkMode).toString())
  }
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Load dark mode preference and check for saved login on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true')
    }
    setUserId(getOrCreateUserId())
    
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setCurrentUser(parsedUser)
        setIsLoggedIn(true)
        // Fetch chat history for this user
        getUserChatHistory(userId)
      } catch (e) {
        console.error('Failed to parse saved user:', e)
        localStorage.removeItem('currentUser')
      }
    }
  }, [])
  
  // API functions
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchChatHistory = async (userId: string, chatId: string) => {
    
      const data = getSessionChatHistory(userId, chatId)
      return data.reverse()
    }

  const fetchAllChatHistory = async (userId: string) => {
      
      const data = getUserChatHistory(userId)
      setChatHistory(data)
      
      // If there's chat history and no active chat, set the most recent one
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].session_id)
        loadChat(data[0])
      }
  
  }
  
  // Load a specific chat
  const loadChat = async (chat: ChatHistory) => {
    const chatMessagesData = await fetchChatHistory(userId, chat.session_id)
    setActiveChatId(chat.session_id)
    setMessages(chatMessagesData.map((msg: { question: string, response: string, timestamp: string }, index: number) => [
      {
      id: `q-${index}`,
      content: msg.question,
      role: "user"
      },
      {
      id: `a-${index}`,
      content: msg.response,
      role: "assistant"
      }
    ]).flat());
  }
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive"
      })
      return
    }
    
    // In a real app, you would validate credentials with your backend
    // For demo purposes, we'll create a simple user object
    const user: User = {
      id: userId,
      name: username
    }
    
    // Save user to localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(user))
    setCurrentUser(user)
    setIsLoggedIn(true)
    
    // Fetch this user's chat history
    fetchAllChatHistory(userId)
  }
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    setCurrentUser(null)
    setIsLoggedIn(false)
    setChatHistory([])
    setActiveChatId(null)
    setMessages([])
  }
  
  // Start new chat
  const startNewChat = () => {
    setActiveChatId(crypto.randomUUID())
    setMessages([])
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || !currentUser || isLoading) return
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: "user"
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    
    try {
      // Updated to use the full backend URL with port 5000
      const response = await fetch(`${backendUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          question: userMessage.content,
          chat_id: activeChatId,
          history: getSessionChatHistory(userId, activeChatId as string),
        }),
      }
    ) 
      if (!response.ok) throw new Error('Failed to send message')
      
      
      const data = await response.json()
      saveChatToLocalStorage(userId, activeChatId as string, input, data.response);
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: "assistant"
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Refresh chat history to include the new chat
      if (userId){
        fetchAllChatHistory(userId)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Make sure the backend server is running on port 5000.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Format date for chat list
  const formatChatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Login form
  if (!isLoggedIn) {
    return (
      <div className={cn("flex min-h-screen items-center justify-center p-4", isDarkMode ? "dark" : "")}>
        <div className="w-full max-w-md space-y-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold dark:text-white">Welcome To Stacks AI</h1>
            <p className="text-gray-500 dark:text-gray-400">Enter your username to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
          
          <div className="text-center">
            <Button variant="ghost" onClick={toggleDarkMode} size="sm">
              {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex h-screen w-full", isDarkMode ? "dark" : "")}>
      {/* Sidebar with chat history */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-100 dark:bg-black transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold dark:text-white">Chat History</h2>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* New chat button */}
          <Button 
            variant="outline" 
            className="mb-4 dark:text-white dark:border-gray-700 flex items-center gap-2"
            onClick={startNewChat}
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Button>

          {/* Chat history list */}
          <div className="flex-1 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No chat history yet
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.session_id}
                  className={cn(
                    "py-2 px-3 rounded-lg mb-2 cursor-pointer",
                    activeChatId === chat.session_id
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-200 dark:hover:bg-gray-800"
                  )}
                  onClick={() => loadChat(chat)}
                >
                  <div className="truncate dark:text-gray-300">
                    {/* Show first 30 chars of question as title */}
                    {chat.chats[0].question.length > 30 
                      ? chat.chats[0].question.substring(0, 30) + "..."
                      : chat.chats[0].question}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatChatDate(chat.chats[0].timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Settings section */}
          <div className="mt-auto space-y-2">
            <Button variant="ghost" className="w-full justify-start dark:text-gray-300" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </Button>
            
            <Button variant="ghost" className="w-full justify-start dark:text-gray-300" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout ({currentUser?.name})
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen bg-white dark:bg-black">
        {/* Header */}
        <header className="border-b dark:border-gray-700 p-4 flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5 dark:text-white" />
          </Button>
          <h1 className="text-xl font-bold dark:text-white truncate">
            {activeChatId 
              ? `Chat with ${currentUser?.name}` 
              : "New Conversation"}
          </h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mx-20 px-10">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <h2 className="text-2xl font-bold mb-2">Welcome, {currentUser?.name}</h2>
                <p>Start a new conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} role={message.role} content={message.content} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Enhanced styling */}
        <div className="border-t dark:border-gray-700 p-4 flex justify-center">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-600 overflow-hidden">
            <form onSubmit={handleSubmit} className="flex items-center">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-gray-800 dark:text-white px-4 py-3 min-h-[60px] max-h-[200px]"
                disabled={isLoading}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (input.trim()) {
                      handleSubmit(e as any)
                    }
                  }
                }}
              />
              <div className="pr-2 self-end pb-2">
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all",
                    input.trim() 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  )}
                  size="icon"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
