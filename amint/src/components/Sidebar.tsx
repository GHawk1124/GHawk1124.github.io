import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Settings,
  Upload,
  MessageSquare,
  User,
  Moon,
  Sun,
  Volume2,
  Bell,
  Save,
  X,
  Brain,
  History,
  ChevronRight,
  File,
  Trash2,
  Search,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { uploadDocument } from "@/lib/api";
import { useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const isDevelopment = import.meta.env.DEV;

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

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface SidebarProps {
  chatHistory: ChatHistoryItem[];
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onLogout?: () => void;
  userInfo?: {
    name: string;
    email: string;
    picture: string;
    user_id: string; // Add this property
  } | null;
  onSelectDocument?: (documentId: string | null) => void; // Add this property
}

export function Sidebar({ chatHistory, onNewChat, onLoadChat, onLogout, userInfo }: SidebarProps) {
  const [activeView, setActiveView] = useState<'chat' | 'settings' | 'upload' | 'hopfield'>('chat');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [memoryQuery, setMemoryQuery] = useState("");
  const [memoryResults, setMemoryResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingDummyFiles, setIsAddingDummyFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [_networkStats, setNetworkStats] = useState({ 
    memory_count: 0, 
    document_count: 0,
    last_updated: new Date()
  });

  useEffect(() => {
    if (userInfo?.user_id) {
      fetchNetworkStats();
    }
  }, [userInfo]);

  const fetchNetworkStats = async () => {
    if (!userInfo?.user_id) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/network/stats?user_id=${userInfo.user_id}`
      );
      if (!response.ok) throw new Error("Failed to fetch network stats");
      
      const data = await response.json();
      setNetworkStats({
        memory_count: data.memory_count,
        document_count: data.document_count,
        last_updated: new Date()
      });
    } catch (error) {
      console.error("Error fetching network stats:", error);
    }
  };

  const handleViewChange = (view: 'chat' | 'settings' | 'upload' | 'hopfield') => {
    setActiveView(view);
  };

  const handleSelectChat = (chatId: string) => {
    // Load the selected chat
    onLoadChat(chatId);
    // Close the dropdown after a short delay
    setTimeout(() => {
      setHistoryOpen(false);
    }, 200);
    // Switch to chat view
    setActiveView('chat');
  };

  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || !userInfo?.user_id) return;

    const fileArray = Array.from(files);
    const newDocuments: Document[] = [];
    const duplicates: string[] = [];
    const uploadPromises: Promise<any>[] = [];

    // First check for duplicates and prepare upload list
    fileArray.forEach(file => {
      const isDuplicate = documents.some(
        doc => doc.name === file.name && doc.size === file.size && doc.lastModified === file.lastModified
      );

      if (isDuplicate) {
        duplicates.push(file.name);
      } else {
        newDocuments.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        // Add to upload queue
        const uploadPromise = uploadDocument(userInfo.user_id, file, file.name)
          .catch(error => {
            console.error(`Error uploading ${file.name}:`, error);
            return { error: true, fileName: file.name };
          });

        uploadPromises.push(uploadPromise);
      }
    });

    if (newDocuments.length > 0) {
      // Add to local state immediately to show in UI
      setDocuments(prev => [...prev, ...newDocuments]);

      // Show initial toast
      toast({
        title: "Uploading documents...",
        description: `Processing ${newDocuments.length} document${newDocuments.length !== 1 ? 's' : ''}`,
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Count successful uploads
      const successfulUploads = results.filter(r => !r.error).length;
      const failedUploads = results.filter(r => r.error).length;

      if (successfulUploads > 0) {
        toast({
          title: "Documents processed",
          description: `${successfulUploads} document${successfulUploads !== 1 ? 's' : ''} added to your Hopfield network`,
        });
      }

      if (failedUploads > 0) {
        toast({
          title: "Upload issues",
          description: `${failedUploads} document${failedUploads !== 1 ? 's' : ''} failed to process`,
          variant: "destructive",
        });
      }
    }

    if (duplicates.length > 0) {
      toast({
        title: "Duplicates detected",
        description: `${duplicates.length} duplicate document${duplicates.length !== 1 ? 's' : ''} skipped.`,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // Reset the input so the same file can be uploaded again if it was deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleDeleteDocument = (id: string) => {
    const docToDelete = documents.find(doc => doc.id === id);
    if (docToDelete) {
      setDocuments(documents.filter(doc => doc.id !== id));
      toast({
        title: "Document removed",
        description: `"${docToDelete.name}" has been removed.`,
      });
    }
  };

  const handleMemoryQuery = async () => {
    if (!memoryQuery.trim() || !userInfo?.user_id) return;
    
    setIsSearching(true);
    try {
      // Use the user_id from props instead of hardcoded value
      const userId = userInfo.user_id;
      const response = await fetch(
        `${API_BASE_URL}/memories/query?user_id=${userId}&query_text=${encodeURIComponent(memoryQuery)}&k=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to query memories');
      }
      
      const data = await response.json();
      setMemoryResults(data.results || []);
      
      if (data.results.length === 0) {
        toast({
          title: "No results found",
          description: "Your query didn't match any memories in the network.",
        });
      }
    } catch (error) {
      console.error("Error querying memories:", error);
      toast({
        title: "Query failed",
        description: "There was an error querying the memory network.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addDummyFiles = async () => {
    setIsAddingDummyFiles(true);
    try {
      const userId = "dev_user_123"; // This should come from your authentication system
      const response = await fetch("http://localhost:8000/dev/add-dummy-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          file_count: 5 // Number of dummy files to add
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add dummy files');
      }

      const data = await response.json();
      console.log("Response from add-dummy-files:", data); // Debug logging

      // Add the dummy files to the documents state
      if (data.file_names && data.file_names.length > 0) {
        const newDummyDocs = data.file_names.map((name: string) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          size: 1024, // Dummy size
          type: name.split('.').pop() || 'unknown',
          lastModified: Date.now()
        }));
        setDocuments(prev => [...prev, ...newDummyDocs]);
      }

      // Show detailed stats in the toast with fallbacks
      const stats = data.stats || {};
      const newMemories = stats.memories_created || 0;
      const updatedMemories = stats.memories_updated || 0;

      // Create a more informative message based on available data
      let description = '';
      if (newMemories > 0 || updatedMemories > 0) {
        description = `Added ${newMemories} new files and updated ${updatedMemories} existing files.`;
      } else if (data.file_names?.length > 0) {
        description = `Processed ${data.file_names.length} files.`;
      } else {
        description = `Files processed successfully.`;
      }

      toast({
        title: "Dummy files processed",
        description: description,
      });
    } catch (error) {
      console.error("Error adding dummy files:", error);
      toast({
        title: "Failed to add dummy files",
        description: "There was an error adding test files to the network.",
        variant: "destructive",
      });
    } finally {
      setIsAddingDummyFiles(false);
    }
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'settings':
        return (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveView('chat')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              {/* Theme Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Dark Mode</span>
                </div>
                <Button
                  variant={isDarkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? "On" : "Off"}
                </Button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </div>
                <Button
                  variant={notificationsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  {notificationsEnabled ? "On" : "Off"}
                </Button>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Sound</span>
                </div>
                <Button
                  variant={soundEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? "On" : "Off"}
                </Button>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input type="password" placeholder="Enter your API key" />
              </div>

              <Button className="w-full mt-4">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload Documents</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveView('chat')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator className="my-4" />

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              multiple
            />

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-border'} rounded-lg p-8 text-center mb-4 transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Drag and drop files here or click to browse</p>
              <Button variant="outline" size="sm" onClick={handleBrowseFiles}>
                Browse Files
              </Button>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-hidden">
              <div className="font-medium mb-2">Uploaded Documents {documents.length > 0 && `(${documents.length})`}</div>

              {documents.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
                  No documents uploaded yet
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border">
                        <div className="flex items-center overflow-hidden">
                          <File className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <div className="truncate text-sm font-medium">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="h-7 w-7 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        );
      case 'hopfield':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Hopfield Network</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveView('chat')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
              {/* Memory Query Section */}
              <div className="rounded-lg p-4 bg-muted">
                <h3 className="text-md font-medium mb-2">Memory Search</h3>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search memories..."
                      value={memoryQuery}
                      onChange={(e) => setMemoryQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleMemoryQuery();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleMemoryQuery}
                      disabled={isSearching || !memoryQuery.trim()}
                    >
                      {isSearching ? "..." : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  {memoryResults.length > 0 && (
                    <ScrollArea className="h-48 mt-2">
                      <div className="space-y-2">
                        {memoryResults.map((result, index) => (
                          <div key={result.memory_id} className="p-2 rounded-md bg-background border text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{result.name || `Memory ${index + 1}`}</span>
                              {result.timestamp && (
                                <div className="flex items-center text-muted-foreground text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(result.timestamp).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <p className="text-xs line-clamp-2">{result.text}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Developer Mode Button */}
                  {isDevelopment && (
                    <div className="mt-2 border-t pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={addDummyFiles}
                        disabled={isAddingDummyFiles}
                      >
                        {isAddingDummyFiles ? "Adding..." : "Add Dummy Files (Dev Mode)"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg p-4 bg-muted">
                <h3 className="text-md font-medium mb-2">Network Visualization</h3>
                <div className="h-64 bg-background/50 rounded flex items-center justify-center border">
                  <Brain className="h-12 w-12 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Visualization will appear here</span>
                </div>
              </div>
              <div className="rounded-lg p-4 bg-muted">
                <h3 className="text-md font-medium mb-2">Network Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Nodes:</span>
                    <span>1,024</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documents:</span>
                    <span>{documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>2 minutes ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <aside className="flex flex-col h-full w-64 border-r border-border bg-background p-4">
        {/* Top Section */}
        <div className="flex flex-col space-y-2 mb-4">
          {/* New Chat Button */}
          <Button
            variant="ghost"
            className="w-full justify-start hover:bg-accent"
            onClick={() => {
              onNewChat();
              setActiveView('chat');
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>

          {/* Upload Documents Button */}
          <Button
            variant={activeView === 'upload' ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange('upload')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>

          {/* View Hopfield Network Button */}
          <Button
            variant={activeView === 'hopfield' ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange('hopfield')}
          >
            <Brain className="mr-2 h-4 w-4" />
            View Hopfield Network
          </Button>
        </div>

        {/* Previous Chats Section */}
        <div className="mb-4">
          <Button
            variant="ghost"
            className="w-full justify-between px-2 h-8 text-muted-foreground font-medium text-sm"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <div className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              <span>Previous Chats {chatHistory.length > 0 && `(${chatHistory.length})`}</span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${historyOpen ? 'rotate-90' : ''}`} />
          </Button>

          {/* Chat History List */}
          {historyOpen && (
            <div className="mt-1 border rounded-md shadow-md bg-background">
              <div className="px-2 py-1.5 font-medium text-sm border-b">
                Chat History
              </div>

              {chatHistory.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No previous chats
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto py-1">
                  {chatHistory.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left px-2 py-1 my-0.5"
                      onClick={() => {
                        handleSelectChat(chat.id);
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                      {/* Display message count for non-empty chats */}
                      {chat.messages.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {chat.messages.length} msg{chat.messages.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Pushed to bottom */}
        <div className="mt-auto border-t border-border pt-4 space-y-2">
          {/* Settings Button */}
          <Button
            variant={activeView === 'settings' ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start items-center space-x-2 p-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={userInfo?.picture || "https://github.com/shadcn.png"} alt={userInfo?.name || "User"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">{userInfo?.name || "User Account"}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Logged in as {userInfo?.name || "User Account"} ({userInfo?.email || ""}). Do you want to log out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    }
                  }}
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Settings, Upload or Hopfield Panel that shows up instead of the chat area */}
      {activeView !== 'chat' && (
        <div className="absolute top-0 left-64 right-0 bottom-0 bg-background z-10">
          {renderMainContent()}
        </div>
      )}
    </>
  );
}