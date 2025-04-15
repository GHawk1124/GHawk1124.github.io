import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Loader2, Menu, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryMemories, type MemoryQueryResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FormattedMessage } from "@/components/FormattedMessage";
import type { Message, MemoryResult } from '@/App'; // Import types

interface ChatAreaProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    userId?: string;
    selectedDocumentId?: string | null;
    onToggleSidebar: () => void; // For mobile hamburger
}

export function ChatArea({
    messages,
    setMessages,
    userId,
    selectedDocumentId,
    onToggleSidebar
}: ChatAreaProps) {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Scroll to bottom useEffect
    useEffect(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            // Use setTimeout to ensure scrolling happens after render updates
            setTimeout(() => {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }, 10); // Small delay often helps
        }
    }, [messages]); // Trigger on messages change

    // handleSendMessage
    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isLoading || !userId) return;

        const userMessageText = inputValue;
        const newUserMessage: Message = { id: Date.now().toString(), text: userMessageText, sender: 'user' };

        // Append user message immediately
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        // Add thinking message
        const thinkingMessageId = (Date.now() + 1).toString();
        const thinkingMessage: Message = { id: thinkingMessageId, text: "Thinking...", sender: 'ai' };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const contextMessages = messages.slice(-6).map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`).join("\n");
            const contextualQuery = contextMessages
                ? `Previous messages:\n${contextMessages}\n\nNew message: ${userMessageText}`
                : userMessageText;

            console.log("Sending query:", contextualQuery, "Doc ID:", selectedDocumentId);

            // Call API using threshold
            const response = await queryMemories(userId, {
                query_text: contextualQuery,
                document_id: selectedDocumentId || undefined,
                similarity_threshold: 0.75, // Use threshold
                use_gemini: true,
                max_gemini_context: 5 // Limit context for Gemini explicitly
            });

            console.log("API Response:", response);

            // Replace thinking message with actual response
            setMessages(prev => {
                const updatedMessages = prev.filter(msg => msg.id !== thinkingMessageId);
                const aiResponse: Message = {
                    id: Date.now().toString(),
                    text: response.gemini_response || "I couldn't generate a response based on the context. Please check the retrieved sources or try rephrasing.", // Fallback
                    sender: 'ai',
                    // Populate the memories field (these are the ones above threshold)
                    memories: response.results || [],
                };
                return [...updatedMessages, aiResponse];
            });

        } catch (error) {
            console.error("Error querying API:", error);
            // Remove thinking message on error
            setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
            const errorText = error instanceof Error ? error.message : "An unknown error occurred";
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: `Sorry, I encountered an error: ${errorText}`,
                sender: 'ai',
            };
            setMessages(prev => [...prev, errorMessage]);
            toast({ title: "Query Failed", description: errorText, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // Input handlers
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { setInputValue(event.target.value); };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !isLoading) { // Prevent send while loading
            event.preventDefault();
            handleSendMessage();
        }
    };

    // renderMemorySources helper
    const renderMemorySources = (message: Message) => {
        if (!message.memories || message.memories.length === 0) return null;

        // Determine if the AI response likely used the sources
        // Simple check: if Gemini response exists and isn't a generic error/fallback
        const likelyUsedSources = message.sender === 'ai' && message.text && !message.text.startsWith("I couldn't generate") && !message.text.startsWith("Sorry, I encountered an error");

        if (!likelyUsedSources) return null; // Don't show sources if AI didn't seem to use them

        return (
            <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <details>
                    <summary className="font-medium cursor-pointer hover:text-foreground/80 flex items-center gap-1">
                        <BookOpen className="mr-1.5 h-4 w-4" />
                        Retrieved Sources ({message.memories.length}) {/* Show total retrieved count */}
                    </summary>
                    <div className="mt-1 space-y-1 pl-2 max-h-32 overflow-y-auto"> {/* Limit height */}
                        {message.memories.map((memory: MemoryResult, index) => (
                            <div key={memory.memory_id} className="flex items-start text-[11px] leading-tight">
                                <span className="mr-1.5 font-semibold">{index + 1}.</span>
                                <span className="truncate" title={`${memory.name}${memory.section_title ? ` - ${memory.section_title}` : ''}`}>
                                    {memory.name}{memory.section_title ? ` - ${memory.section_title}` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        );
    };

    return (
        <main className="flex flex-1 flex-col h-full w-full max-w-full overflow-hidden bg-muted/30 dark:bg-zinc-900/50">
            {/* Message Display Area */}
            <ScrollArea className="flex-1 p-4 lg:p-6 w-full overflow-y-auto" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center absolute inset-0 pointer-events-none px-4">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-foreground/30">
                            AMINT
                        </h1>
                    </div>
                ) : (
                    <div className="space-y-4 w-full max-w-4xl mx-auto pb-4"> {/* Centered content */}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn("flex w-full", message.sender === 'user' ? "justify-end" : "justify-start")}
                            >
                                <div
                                    className={cn(
                                        "inline-block max-w-[85%] md:max-w-[75%] rounded-lg px-3.5 py-2 text-sm shadow-sm",
                                        message.sender === 'user'
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-card border border-border rounded-bl-none text-card-foreground"
                                    )}
                                >
                                    {message.sender === 'user' ? (
                                        <div className="break-words whitespace-pre-wrap">{message.text}</div>
                                    ) : message.text === "Thinking..." ? (
                                        <div className="flex items-center space-x-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Thinking...</span>
                                        </div>
                                    ) : (
                                        // Render AI message content using FormattedMessage
                                        // Pass memories for potential citation linking inside FormattedMessage if implemented
                                        <FormattedMessage content={message.text} memories={message.memories} />
                                    )}
                                    {/* Call renderMemorySources for AI messages (excluding 'Thinking...') */}
                                    {message.sender === 'ai' && message.text !== "Thinking..." && renderMemorySources(message)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
            {/* Input Area */}
            <div className="border-t border-border bg-background p-3 lg:p-4 w-full flex-shrink-0">
                <div className="relative max-w-4xl mx-auto flex items-center space-x-2">
                    <Input
                        placeholder={`Ask anything${selectedDocumentId ? ' about the selected document' : ''}...`}
                        className="flex-1 pr-10 h-10"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        aria-label="Send message"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </main>
    );
}