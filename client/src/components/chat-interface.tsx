"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Menu, X, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "ai/react"
import ChatMessage from "./chat-message"
import { cn } from "@/lib/utils"

export default function ChatInterface() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className={cn("flex h-screen w-full", isDarkMode ? "dark" : "")}>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-100 dark:bg-black transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold dark:text-white">Chats</h2>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Button variant="outline" className="mb-4 dark:text-white dark:border-gray-700">
            + New Chat
          </Button>

          <div className="flex-1 overflow-y-auto">
            {/* Chat history would go here */}
            <div className="py-2 px-3 rounded-lg mb-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer dark:text-gray-300">
              Previous Chat 1
            </div>
            <div className="py-2 px-3 rounded-lg mb-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer dark:text-gray-300">
              Previous Chat 2
            </div>
          </div>

          <div className="mt-auto">
            <Button variant="ghost" className="w-full justify-start dark:text-gray-300" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
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
          <h1 className="text-xl font-bold dark:text-white">Chat UI</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <h2 className="text-2xl font-bold mb-2">Welcome to Chat UI</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} role={message.role} content={message.content} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

