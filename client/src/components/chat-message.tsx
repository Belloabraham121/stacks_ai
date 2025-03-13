import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant" | string
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex items-start gap-3 max-w-3xl", isUser ? "ml-auto" : "mr-auto")}>
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600 order-2" : "bg-gray-600 dark:bg-gray-700",
        )}
      >
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
      </div>

      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[85%]",
          isUser ? "bg-blue-600 text-white order-1" : "bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white",
        )}
      >
        {content}
      </div>
    </div>
  )
}

