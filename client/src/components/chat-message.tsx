import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, solarizedDarkAtom } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react'; // Assuming you're using Lucide icons
import { cn } from '@/lib/utils'; // Assuming you're using a utility function for class names
import { solarizedDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface ChatMessageProps {
  role: "user" | "assistant" | string
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto justify-end' : 'mr-auto')}>
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-600 order-2' : 'bg-gray-600 dark:bg-gray-700',
        )}
      >
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
      </div>

      <div
        className={cn(
          'rounded-lg px-4 py-2 max-w-[85%]',
          isUser ? 'bg-blue-600 text-white order-1' : 'bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white',
        )}
      >
        <ReactMarkdown
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus as any} // Use a syntax highlighting style
                  language={match[1]} // Extract the language from the code block
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}