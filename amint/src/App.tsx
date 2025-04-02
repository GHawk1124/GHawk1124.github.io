import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { Toaster } from "@/components/ui/toaster";
import { LoginForm } from "@/components/login-form";
import { useToast } from "@/hooks/use-toast";
import { getUserFromStorage, saveUserToStorage, clearUserFromStorage } from "@/lib/userStorage";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatHistoryItem {
  id: string;
  title: string;
  messages: Message[];
}

interface UserInfo {
  name: string;
  email: string;
  picture: string;
  user_id: string; // Added user_id from our API
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [nextChatNumber, setNextChatNumber] = useState(1);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (storedUser) {
      setIsAuthenticated(true);
      setUserInfo(storedUser);
      console.log("User restored from storage:", storedUser.name, "User ID:", storedUser.user_id);
    }
  }, []);

  // Debug log when chat history changes
  useEffect(() => {
    console.log('Current chat history:', chatHistory);
    console.log('Chat history length:', chatHistory.length);
    console.log('Chat history items:', chatHistory.map(c => c.title));
  }, [chatHistory]);

  // Initialize the first chat on mount
  useEffect(() => {
    const initialId = Date.now().toString();
    console.log('Initializing first chat with ID:', initialId);
    
    setCurrentChatId(initialId);
    // Don't add the first chat to history until it has messages
    setNextChatNumber(1);
  }, []);  // Empty dependency array = only run once

  // Save current chat to history if it has messages
  const saveCurrentChatIfNeeded = () => {
    if (!currentChatId || messages.length === 0) {
      return false; // Nothing to save or empty chat
    }
    
    // Check if this chat already exists in history
    const existingIndex = chatHistory.findIndex(chat => chat.id === currentChatId);
    
    if (existingIndex >= 0) {
      // Update existing chat without changing its title
      setChatHistory(prev => {
        const updatedHistory = [...prev];
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          messages: [...messages]
        };
        return updatedHistory;
      });
      console.log(`Updated existing chat: ${chatHistory[existingIndex]?.title}`);
      return true;
    } else {
      // Create a new chat entry with the next available number
      const newChatTitle = `Chat ${nextChatNumber}`;
      
      // Add as new chat
      setChatHistory(prev => [
        {
          id: currentChatId,
          title: newChatTitle,
          messages: [...messages]
        },
        ...prev
      ]);
      
      // Increment the next chat number
      setNextChatNumber(prev => prev + 1);
      console.log(`Added new chat to history: ${newChatTitle}`);
      return true;
    }
  };

  const handleNewChat = () => {
    console.log('Creating new chat...');
    
    // Save current chat to history if it has messages
    saveCurrentChatIfNeeded();
    
    // Create a new chat ID
    const newChatId = Date.now().toString();
    console.log('New empty chat created with ID:', newChatId);
    
    // Clear messages and set new chat ID
    setMessages([]);
    setCurrentChatId(newChatId);
  };

  const handleLoadChat = (chatId: string) => {
    console.log('Loading chat with ID:', chatId);
    
    // Don't do anything if trying to load the current chat
    if (currentChatId === chatId) {
      console.log('Already on this chat');
      return;
    }
    
    // Find chat in history
    const chatToLoad = chatHistory.find(chat => chat.id === chatId);
    
    if (!chatToLoad) {
      console.error('Chat not found in history:', chatId);
      return;
    }
    
    // Save current chat to history if needed (has messages and not empty)
    saveCurrentChatIfNeeded();
    
    // Load selected chat
    console.log('Loading chat content:', chatToLoad);
    setMessages(chatToLoad.messages);
    setCurrentChatId(chatId);
  };

  const handleLogin = (info?: UserInfo) => {
    console.log("App: handleLogin called.", info ? "Received UserInfo:" : "No UserInfo received.", info);
    // Store user info if available from Google login
    if (info) {
      // Only authenticate if valid info is received
      setIsAuthenticated(true);
      setUserInfo(info);
      saveUserToStorage(info);
      console.log("User logged in:", info.name, "User ID:", info.user_id);
      
      toast({
        title: "Welcome to AMINT!",
        description: `Logged in as ${info.name}`,
      });
    } else {
      // If info is undefined (login failed or cancelled), do not authenticate
      console.warn("Login attempt failed or did not provide user info.");
      setIsAuthenticated(false); // Ensure not authenticated
      setUserInfo(null);        // Ensure no user info is set
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    clearUserFromStorage();
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
  };
  
  const handleSelectDocument = (documentId: string | null) => {
    setSelectedDocumentId(documentId);
    console.log(documentId ? `Selected document: ${documentId}` : "Document selection cleared");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-md p-4">
          <LoginForm onLogin={handleLogin} />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    // Main container covering the whole screen height and width, using flex
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar component with fixed width */}
      <Sidebar 
        chatHistory={chatHistory}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onLogout={handleLogout}
        userInfo={userInfo}
        onSelectDocument={handleSelectDocument}
      />

      {/* ChatArea component - takes remaining space with full width */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <ChatArea 
          messages={messages}
          setMessages={setMessages}
          userId={userInfo?.user_id}
          selectedDocumentId={selectedDocumentId}
        />
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;