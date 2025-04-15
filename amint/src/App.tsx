import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { Toaster } from "@/components/ui/toaster";
import { LoginForm } from "@/components/login-form";
import { useToast } from "@/hooks/use-toast";
import { clearUserFromStorage, saveUserToStorage } from "@/lib/userStorage";
import { checkSession, logoutUser, listDocuments, getNetworkStats, uploadDocument, queryMemories, getDocumentContent } from "@/lib/api"; // Ensure getDocumentContent is imported
import { cn } from "@/lib/utils";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { UploadPanel } from "@/components/panels/UploadPanel";
import { HopfieldPanel } from "@/components/panels/HopfieldPanel";
import { MobileHeader } from "@/components/MobileHeader";
import { DocumentViewerDrawer } from "@/components/DocumentViewerDrawer"; // Ensure this is imported

// --- Types --- (Keep existing types)
export type ActiveView = 'chat' | 'settings' | 'upload' | 'hopfield';
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  memories?: MemoryResult[]; // For context display in ChatArea
}
export interface ChatHistoryItem {
  id: string;
  title: string;
  messages: Message[];
}
export interface UserInfo {
  name: string;
  email: string;
  picture: string;
  id: string;
}
export interface NetworkDoc {
  document_id: string;
  title: string;
  timestamp: string; // Assuming string from API/DB
  source_type?: string;
  metadata?: Record<string, any>;
}
export interface NetworkStats {
  memory_count: number;
  document_count: number;
  last_updated: Date; // Keep as Date object for client-side formatting
}
export interface StagedDocument {
  id: string; // Temporary client-side ID
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'staging' | 'uploading' | 'error';
  progress?: number;
  errorMessage?: string;
}
export interface MemoryResult {
  memory_id: string;
  text: string;
  name: string; // Source name (e.g., document title)
  section_title?: string;
  timestamp?: string; // Assuming string from API/DB
  metadata?: Record<string, any>;
}
export interface DocumentContentData { // Type for drawer content state
  title: string | null;
  content: string | null;
  sourceType?: string; // Added sourceType
}

const viewTitles: Record<ActiveView, string> = {
  chat: 'Chat',
  settings: 'Settings',
  upload: 'Upload Documents',
  hopfield: 'Network View',
};

// --- Main App Component ---
function App() {
  // --- State --- (Keep existing state)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [nextChatNumber, setNextChatNumber] = useState(1);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [networkStats, setNetworkStats] = useState<NetworkStats>({ memory_count: 0, document_count: 0, last_updated: new Date() });
  const [networkDocuments, setNetworkDocuments] = useState<NetworkDoc[]>([]);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocument[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [retryDataFetchCount, setRetryDataFetchCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for drawer visibility
  const [selectedDocData, setSelectedDocData] = useState<DocumentContentData>({ title: null, content: null, sourceType: undefined }); // State for drawer content
  const [isLoadingDocContent, setIsLoadingDocContent] = useState(false); // State for drawer loading
  const { toast } = useToast();

  // --- Handlers --- (Keep existing handlers)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handler to open and fetch content for the drawer
  const handleOpenDocumentDrawer = useCallback(async (docId: string) => {
    console.log("Opening drawer for doc:", docId);
    setIsDrawerOpen(true); // Open drawer immediately
    setIsLoadingDocContent(true);
    setSelectedDocData({ title: 'Loading...', content: null, sourceType: undefined }); // Set loading state title
    try {
      const data = await getDocumentContent(docId); // Fetch content
      console.log("Fetched doc content:", data.title, `(${data.content?.length} chars)`);
      setSelectedDocData({ title: data.title, content: data.content, sourceType: data.source_type }); // Update state with fetched data
    } catch (error) {
      console.error("Failed to fetch document content:", error);
      const errorMsg = error instanceof Error ? error.message : "Could not load content.";
      toast({ title: "Error Loading Document", description: errorMsg, variant: "destructive" });
      setSelectedDocData({ title: "Error", content: `Failed to load content: ${errorMsg}`, sourceType: undefined }); // Show error in drawer
    } finally {
      setIsLoadingDocContent(false);
    }
  }, [toast]); // Add toast dependency

  // Handler to close the drawer
  const handleCloseDocumentDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // Optional: Reset content when closing to avoid showing old data briefly
    setSelectedDocData({ title: null, content: null, sourceType: undefined });
  }, []);


  const handleViewChange = useCallback((view: ActiveView) => {
    setActiveView(view);
    if (window.innerWidth < 1024) { // Close mobile sidebar when changing main view
      setIsSidebarOpen(false);
    }
  }, []);

  const refreshAllData = useCallback(() => {
    // This function is primarily for manual refresh triggers now
    console.log("Manual refresh triggered...");
    setRetryDataFetchCount(prev => prev + 1); // Trigger useEffect to refetch
  }, []);


  // --- Data Fetching Logic --- (Keep existing logic)
   const fetchNetworkStats = useCallback(async () => {
    // No need to check userInfo here, guard clause inside main effect
    setIsLoadingStats(true);
    console.log("Fetching network stats...");
    try {
      const data = await getNetworkStats(); // Fetch from API
      console.log("Raw Stats Data:", data);
      // Update state directly from API response
      setNetworkStats({
        memory_count: data.memory_count || 0,
        document_count: data.document_count || 0, // Use count from API
        last_updated: new Date() // Use current time as 'last updated' marker client-side
      });
    } catch (error) {
      console.error("Error fetching network stats:", error);
      toast({ title: "Error fetching stats", description: error instanceof Error ? error.message : "Could not load network statistics.", variant: "destructive" });
      // Reset on error to avoid stale data display
      setNetworkStats(prev => ({ ...prev, memory_count: 0, document_count: 0 }));
    } finally {
      setIsLoadingStats(false);
    }
    // Depend only on stable external values needed to *initiate* the fetch
  }, [toast]);

  const fetchDocumentsFromServer = useCallback(async () => {
    // No need to check userInfo here, guard clause inside main effect
    setIsLoadingDocuments(true);
    console.log("Fetching documents...");
    try {
      const data = await listDocuments();
      console.log("Raw Documents Data:", data);
      setNetworkDocuments(data.documents || []);
      // REMOVED the problematic networkStats update logic here
    } catch (error) {
      console.error("Error fetching documents from server:", error);
      // Keep error handling for document fetching itself
      if (!(error instanceof Error && error.message.includes("get_user_documents"))) {
        toast({ title: "Error fetching documents", description: error instanceof Error ? error.message : "Could not load document list.", variant: "destructive" });
      }
      setNetworkDocuments([]); // Reset on error
    } finally {
      setIsLoadingDocuments(false);
    }
    // Depend only on stable external values needed to *initiate* the fetch
  }, [toast]);

  // --- Effects --- (Keep existing effects)
  // Initial Auth Check & URL Param Handling
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const sessionData = await checkSession();
        if (sessionData.authenticated && sessionData.user) {
          setIsAuthenticated(true);
          const user = sessionData.user;
          const newUserInfo = {
            name: user.name || "User",
            email: user.email,
            picture: user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`,
            id: user.id
          };
          setUserInfo(newUserInfo);
          // Storing user info to localStorage can be useful for persistence across refreshes
          // but session check should be the primary source of truth for authentication status.
          saveUserToStorage({ user_id: newUserInfo.id, name: newUserInfo.name, email: newUserInfo.email, picture: newUserInfo.picture }); // Use correct keys for storage if needed elsewhere
          console.log("Session valid, user set:", newUserInfo.id);
        } else {
          setIsAuthenticated(false);
          setUserInfo(null);
          clearUserFromStorage();
          console.log("Session invalid or expired.");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setUserInfo(null);
        clearUserFromStorage();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();

    // Check URL parameters for auth success/error
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    if (authStatus === 'success') {
      toast({ title: "Authentication successful", description: "You are now logged in." });
      window.history.replaceState({}, '', window.location.pathname); // Clean URL
    } else if (authStatus === 'error') {
      const errorMessage = urlParams.get('message') || "Authentication failed";
      toast({ title: "Authentication Failed", description: errorMessage, variant: "destructive" });
      window.history.replaceState({}, '', window.location.pathname); // Clean URL
    }
  }, [toast]); // Only run once on mount


  // Fetch data when user or retry count changes
  useEffect(() => {
    if (isAuthenticated && userInfo?.id) {
      console.log(`Workspaceing data for user ${userInfo.id}, trigger: ${retryDataFetchCount}`);
      fetchNetworkStats();
      fetchDocumentsFromServer();
    } else {
      // Reset data if user logs out
      console.log("User logged out or changed, resetting data.");
      setNetworkStats({ memory_count: 0, document_count: 0, last_updated: new Date() });
      setNetworkDocuments([]);
      setStagedDocuments([]);
      setMessages([]);
      setChatHistory([]);
      setCurrentChatId(null);
      setSelectedDocumentId(null); // Reset document scope on logout
      setActiveView('chat');
      setIsSidebarOpen(false);
    }
    // Depend ONLY on the triggers: user login/logout and manual refresh count
  }, [isAuthenticated, userInfo?.id, retryDataFetchCount, fetchNetworkStats, fetchDocumentsFromServer]);


  // Periodic data refresh
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isAuthenticated && userInfo?.id) {
      // Function to perform the refresh action
      const refreshPeriodically = () => {
        console.log("Periodic refresh triggered...");
        // Don't set loading indicators for background refresh
        getNetworkStats().then(data => {
          setNetworkStats({
            memory_count: data.memory_count || 0,
            document_count: data.document_count || 0,
            last_updated: new Date()
          });
        }).catch(error => console.error("Periodic stats refresh failed:", error));

        listDocuments().then(data => {
          setNetworkDocuments(data.documents || []);
        }).catch(error => console.error("Periodic documents refresh failed:", error));
      };

      // Set up the interval
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      intervalId = setInterval(refreshPeriodically, FIVE_MINUTES_MS);
      console.log("Started periodic refresh interval.");

      // Cleanup function: clear interval when component unmounts or user logs out
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          console.log("Cleared periodic refresh interval.");
        }
      };
    } else {
      // Ensure cleanup if auth status changes while interval is running
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Cleared periodic refresh interval due to auth change.");
      }
    }
    // This effect should run only when authentication status or user changes
  }, [isAuthenticated, userInfo?.id]);

  // Initialize first chat
  useEffect(() => {
    // Only initialize if authenticated, in chat view, and no current chat exists
    if (!currentChatId && isAuthenticated && activeView === 'chat') {
      const id = Date.now().toString();
      setCurrentChatId(id);
      setMessages([]); // Ensure messages are cleared for the new initial chat
      setNextChatNumber(1); // Reset numbering for new session
      setChatHistory([]); // Clear history from previous sessions if any lingered
      console.log('Initialized first chat for new session:', id);
    }
  }, [currentChatId, isAuthenticated, activeView]);


  // Log chat history changes
  useEffect(() => {
    console.log('Chat history updated:', chatHistory);
  }, [chatHistory]);

  // --- Chat Management --- (Keep existing logic)
    const saveCurrentChatIfNeeded = useCallback(() => {
    if (!currentChatId || messages.length === 0) return false;

    const existingIndex = chatHistory.findIndex(c => c.id === currentChatId);

    // Try to get a more meaningful title from the first user message
    const firstUserMessage = messages.find(m => m.sender === 'user');
    let potentialTitle = firstUserMessage?.text.substring(0, 35) || '';
    if (potentialTitle.length >= 35) potentialTitle += '...';

    // Determine the title: Use potential title or fallback to numbering
    let chatTitle = potentialTitle || `Chat ${nextChatNumber}`;

    if (existingIndex >= 0) {
      // Update existing chat - only update messages, keep original title
      console.log(`Updating existing chat [${chatHistory[existingIndex].title}] in history`);
      setChatHistory(prev => prev.map((chat, index) =>
        index === existingIndex ? { ...chat, messages: [...messages] } : chat
      ));
    } else {
      // Add as new chat
      console.log(`Adding new chat [${chatTitle}] to history`);
      setChatHistory(prev => [{ id: currentChatId, title: chatTitle, messages: [...messages] }, ...prev]);
      // Only increment number if we used the fallback title
      if (!potentialTitle) {
        setNextChatNumber(prev => prev + 1);
      }
    }
    return true;
  }, [currentChatId, messages, chatHistory, nextChatNumber]);


  const handleNewChat = useCallback(() => {
    console.log('Handling new chat request...');
    saveCurrentChatIfNeeded(); // Save the current one first
    const newChatId = Date.now().toString();
    setMessages([]); // Clear messages for the new chat
    setCurrentChatId(newChatId); // Set the ID for the new chat
    setActiveView('chat'); // Explicitly switch view to chat
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar on mobile
    console.log('New chat started:', newChatId);
  }, [saveCurrentChatIfNeeded]); // Add save function dependency


  const handleLoadChat = useCallback((chatId: string) => {
    if (currentChatId === chatId) {
      console.log('Chat already loaded:', chatId);
      if (window.innerWidth < 1024) setIsSidebarOpen(false); // Still close sidebar on mobile
      setActiveView('chat'); // Ensure view is chat
      return;
    }
    console.log('Loading chat:', chatId);
    saveCurrentChatIfNeeded(); // Save the previous chat
    const chatToLoad = chatHistory.find(chat => chat.id === chatId);
    if (chatToLoad) {
      setMessages(chatToLoad.messages);
      setCurrentChatId(chatId);
      setActiveView('chat'); // Switch view to chat
      if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar on mobile
    } else {
      console.error("Chat not found in history:", chatId);
      toast({ title: "Error", description: "Could not load the selected chat.", variant: "destructive" });
    }
  }, [currentChatId, chatHistory, saveCurrentChatIfNeeded, toast]); // Add dependencies


  // --- Auth Handlers --- (Keep existing logic)
    const handleGoogleLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsAuthenticated(false);
      setUserInfo(null);
      // State resets (chat history, messages, etc.) handled by useEffect dependency on userInfo.id
      clearUserFromStorage(); // Clear local storage
      toast({ title: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
    }
  };

  // --- Upload Panel Logic Handlers --- (Keep existing logic)
  const handleStageFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: StagedDocument[] = [];
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isDuplicate = stagedDocuments.some(doc => doc.name === file.name && doc.size === file.size);
      if (!isDuplicate) {
        newFiles.push({ id: Date.now().toString() + i, file, name: file.name, size: file.size, type: file.type, status: 'staging' });
      } else {
        skippedCount++;
      }
    }

    setStagedDocuments(prev => [...prev, ...newFiles]);

    if (skippedCount > 0) {
      toast({ title: "Duplicates Skipped", description: `${skippedCount} file(s) already staged.` });
    }

    if (newFiles.length > 0) {
      setActiveView('upload'); // Switch to upload view automatically if files are staged
    }
  }, [stagedDocuments, toast]); // Added toast dependency


  const handleRemoveStagedDocument = useCallback((id: string) => {
    setStagedDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const handleUploadStagedFiles = useCallback(async () => {
    const filesToUpload = stagedDocuments.filter(d => d.status === 'staging');
    if (filesToUpload.length === 0) {
      toast({ title: "No Files to Upload", description: "Only files marked as 'staging' can be uploaded.", variant: "default" })
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    toast({ title: `Uploading ${filesToUpload.length} file(s)...` });

    // Mark files as uploading
    setStagedDocuments(prev => prev.map(doc => filesToUpload.some(f => f.id === doc.id) ? { ...doc, status: 'uploading' } : doc));

    const uploadPromises = filesToUpload.map(async (stagedDoc) => {
      try {
        console.log(`Uploading: ${stagedDoc.name}`);
        const result = await uploadDocument(stagedDoc.file, stagedDoc.name);
        // Remove successful uploads from the list entirely
        setStagedDocuments(prev => prev.filter(d => d.id !== stagedDoc.id));
        successCount++;
        console.log(`Success: ${stagedDoc.name}`, result);
      } catch (error: any) {
        errorCount++;
        console.error(`Failed: ${stagedDoc.name}`, error);
        // Keep failed uploads in the list, mark as error
        setStagedDocuments(prev => prev.map(d => d.id === stagedDoc.id ? { ...d, status: 'error', errorMessage: error.message || "Unknown error" } : d));
      }
    });

    await Promise.all(uploadPromises);

    console.log(`Upload complete: ${successCount} success, ${errorCount} failed`);
    toast({
      title: "Upload Finished",
      description: `${successCount} successful, ${errorCount} failed. ${errorCount > 0 ? 'Failed files remain listed.' : ''}`,
      variant: errorCount > 0 ? "destructive" : "default"
    });

    if (successCount > 0) {
      refreshAllData(); // Refresh network docs and stats if anything succeeded
    }
  }, [stagedDocuments, refreshAllData, toast]); // Added dependencies


  // Select document for chat context
  const handleSelectDocumentForChat = useCallback((docId: string | null) => {
    setSelectedDocumentId(docId);
    // Optionally provide user feedback via toast
    if (docId) {
      const doc = networkDocuments.find(d => d.document_id === docId);
      toast({ title: "Chat Context Set", description: `Queries will focus on: ${doc?.title || 'selected document'}.`, duration: 3000 });
    } else {
      toast({ title: "Chat Context Cleared", description: "Queries will search all documents.", duration: 3000 });
    }
  }, [networkDocuments, toast]);


  // --- Render ---
  if (isLoading) return <div className="flex h-screen w-screen items-center justify-center text-xl animate-pulse">Loading AMINT...</div>;

  if (!isAuthenticated) return <div className="flex h-screen w-screen items-center justify-center bg-background"><LoginForm onGoogleLogin={handleGoogleLogin} /> <Toaster /></div>;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      <Sidebar
        chatHistory={chatHistory}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onLogout={handleLogout}
        userInfo={userInfo}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        activeView={activeView}
        onViewChange={handleViewChange}
        networkDocuments={networkDocuments}
        onOpenDocumentDrawer={handleOpenDocumentDrawer} // Pass the handler
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm lg:hidden" onClick={toggleSidebar} />}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-muted/30 dark:bg-zinc-900/50">
        {/* Mobile Header */}
        <MobileHeader
          title={viewTitles[activeView]}
          onToggleSidebar={toggleSidebar}
        />

        {/* Conditional Panel Rendering */}
        {activeView === 'chat' && userInfo && (
          <ChatArea
            key={currentChatId} // Force re-render on chat change if needed
            messages={messages}
            setMessages={setMessages}
            userId={userInfo.id}
            selectedDocumentId={selectedDocumentId}
            onToggleSidebar={toggleSidebar} // Pass toggle for hamburger
          />
        )}
        {activeView === 'settings' && (
          <SettingsPanel />
        )}
        {activeView === 'upload' && (
          <UploadPanel
            stagedDocuments={stagedDocuments}
            onStageFiles={handleStageFiles}
            onRemoveStaged={handleRemoveStagedDocument}
            onUploadStaged={handleUploadStagedFiles}
            isDevelopment={import.meta.env.DEV}
          />
        )}
        {activeView === 'hopfield' && userInfo && (
          <HopfieldPanel
            networkStats={networkStats}
            networkDocuments={networkDocuments}
            isLoadingStats={isLoadingStats}
            isLoadingDocuments={isLoadingDocuments}
            onRefresh={refreshAllData}
            userInfo={userInfo}
            toast={toast}
            // queryMemories={queryMemories}
            onSelectDocument={handleSelectDocumentForChat}
            selectedDocumentId={selectedDocumentId}
            onOpenDocumentDrawer={handleOpenDocumentDrawer} // Pass the handler
          />
        )}
      </div>

      {/* === ADD THE DRAWER COMPONENT HERE === */}
      <DocumentViewerDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDocumentDrawer}
        title={selectedDocData.title}
        content={selectedDocData.content}
        isLoading={isLoadingDocContent}
        sourceType={selectedDocData.sourceType} // Pass sourceType
      />
      {/* ===================================== */}

      <Toaster />
    </div>
  );
}

export default App;