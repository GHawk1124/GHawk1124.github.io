import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for conditional classes

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

interface ChatAreaProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function ChatArea({ messages, setMessages }: ChatAreaProps) {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        if (scrollAreaRef.current) {
            // Use setTimeout to allow the DOM to update before scrolling
            setTimeout(() => {
                const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
                if (scrollViewport) {
                    scrollViewport.scrollTop = scrollViewport.scrollHeight;
                }
            }, 0);
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (inputValue.trim() === '' || isLoading) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
        };

        // Add user message
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response after a short delay
        setTimeout(() => {
             const aiResponse: Message = {
                 id: (Date.now() + 1).toString(),
                 text: `Processing your message: "${newUserMessage.text}"...`, // Replace with actual AI call
                 sender: 'ai',
             };
             setMessages(prevMessages => [...prevMessages, aiResponse]);
             setIsLoading(false);
        }, 1500);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
             event.preventDefault(); // Prevent newline in input
             handleSendMessage();
        }
    };

    return (
        <main className="flex flex-1 flex-col h-full w-full max-w-full overflow-hidden bg-muted/40">
            {/* Message Display Area - Ensure it can scroll and takes available space */}
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
                                        "inline-block max-w-[80%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm overflow-hidden overflow-wrap-anywhere break-words whitespace-pre-wrap",
                                        message.sender === 'user'
                                            ? "bg-primary text-primary-foreground rounded-br-none" // User message style
                                            : "bg-background border border-border rounded-bl-none" // AI message style
                                    )}
                                >
                                    {message.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Input Area - Fixed at bottom */}
            <div className="border-t border-border bg-background p-4 lg:p-6 w-full">
                <div className="relative max-w-full">
                    <Input
                        placeholder="Type your message here..."
                        className="pr-12 h-10 w-full" // Full width input
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
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </div>
        </main>
    );
}