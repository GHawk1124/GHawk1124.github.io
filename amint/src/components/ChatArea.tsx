import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryMemories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FormattedMessage } from "@/components/FormattedMessage";

interface Memory {
  memory_id: string;
  text: string;
  name: string;
  section_title?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  memories?: Memory[]; // Optional memories for context display
}

interface ChatAreaProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  userId?: string;
  selectedDocumentId?: string | null;
}

export function ChatArea({ messages, setMessages, userId, selectedDocumentId }: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
      }, 0);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading || !userId) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add thinking message
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "Thinking...",
      sender: 'ai',
    };
    setMessages(prevMessages => [...prevMessages, thinkingMessage]);

    try {
      // Query the API with Gemini integration
      const response = await queryMemories(userId, {
        query_text: newUserMessage.text,
        document_id: selectedDocumentId || undefined,
        k: 5,
        use_gemini: true
      });

      // Remove thinking message
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== thinkingMessage.id));

      // Format and add AI response
      const aiResponse: Message = {
        id: Date.now().toString(),
        text: response.gemini_response || "I couldn't generate a response based on the available memories.",
        sender: 'ai',
        memories: response.results, // Store retrieved memories with the message
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
    } catch (error) {
      // Remove thinking message
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== thinkingMessage.id));
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error while processing your request. Please try again.",
        sender: 'ai',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // Show toast notification
      toast({
        title: "Query failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      console.error("Error querying API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to render memory sources if available
  const renderMemorySources = (message: Message) => {
    if (!message.memories || message.memories.length === 0) return null;
    return (
      <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
        <div className="font-medium mb-1">Sources:</div>
        <div className="space-y-1">
          {message.memories.slice(0, 3).map((memory, index) => (
            <div key={memory.memory_id} className="flex items-start">
              <span className="mr-1">{index + 1}.</span>
              <span className="truncate">{memory.name}{memory.section_title ? ` - ${memory.section_title}` : ''}</span>
            </div>
          ))}
          {message.memories.length > 3 && (
            <div className="text-xs italic">+ {message.memories.length - 3} more sources</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-1 flex-col h-full w-full max-w-full overflow-hidden bg-muted/40">
      {/* Message Display Area */}
      <ScrollArea className="flex-1 p-4 lg:p-6 w-full overflow-y-auto" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex h-full w-full absolute inset-0 items-center justify-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-foreground/70">
              Amint: Hopfield based memory RAG
            </h1>
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "inline-block max-w-[80%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm overflow-hidden break-words",
                    message.sender === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-background border border-border rounded-bl-none"
                  )}
                >
                  {message.sender === 'user' ? (
                    message.text
                  ) : (
                    // Use the FormattedMessage component for AI responses
                    <FormattedMessage content={message.text} memories={message.memories} />
                  )}
                  {message.sender === 'ai' && renderMemorySources(message)}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t border-border bg-background p-4 lg:p-6 w-full">
        <div className="relative max-w-full">
          <Input
            placeholder="Type your message here..."
            className="pr-12 h-10 w-full"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </main>
  );
}