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
  } | null;
}

export function Sidebar({ chatHistory, onNewChat, onLoadChat, onLogout, userInfo }: SidebarProps) {
  const [activeView, setActiveView] = useState<'chat' | 'settings' | 'upload' | 'hopfield'>('chat');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
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

  const processFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const newDocuments: Document[] = [];
    const duplicates: string[] = [];

    fileArray.forEach(file => {
      // Check for duplicates by comparing name and size
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
      }
    });

    if (newDocuments.length > 0) {
      setDocuments(prev => [...prev, ...newDocuments]);
      
      toast({
        title: "Documents uploaded",
        description: `${newDocuments.length} document${newDocuments.length !== 1 ? 's' : ''} added successfully.`,
      });
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
                    <User className="h-4 w-4"/>
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