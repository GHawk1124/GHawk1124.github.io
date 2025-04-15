import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Plus, Settings, Upload, MessageSquare, User, Brain, History, ChevronRight, PanelLeftClose,
  FileText // <-- Added FileText import
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ActiveView, UserInfo, ChatHistoryItem, NetworkDoc } from '@/App';

interface SidebarProps {
  chatHistory: ChatHistoryItem[];
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onLogout?: () => void;
  userInfo?: UserInfo | null;
  isOpen: boolean; // For mobile slide
  onToggle: () => void; // For mobile slide
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  networkDocuments: NetworkDoc[]; // Add networkDocuments prop
  onOpenDocumentDrawer: (docId: string) => void; // Add handler prop
}

export function Sidebar({
  chatHistory,
  onNewChat,
  onLoadChat,
  onLogout,
  userInfo,
  isOpen,
  onToggle,
  activeView,
  onViewChange,
  networkDocuments,
  onOpenDocumentDrawer
}: SidebarProps) {
  // Local UI state ONLY
  const [historyOpen, setHistoryOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);

  const handleSelectChat = (chatId: string) => {
    onLoadChat(chatId); // App handles sidebar close and view change to 'chat'
  };

  const handleNewChatClick = () => {
    onNewChat(); // App handles view change to 'chat'
  }

  const handleSelectDocument = (docId: string) => {
    onOpenDocumentDrawer(docId); // Call the handler passed from App
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onToggle(); // Close sidebar
    }
  };

  return (
    <>
      {/* Sidebar container - Classes manage mobile/desktop layout */}
      <aside
        className={cn(
          "flex flex-col h-full w-64 border-r border-border bg-background transition-transform duration-300 ease-in-out",
          // Mobile state: Fixed position, high z-index, translate based on isOpen
          "fixed inset-y-0 left-0 z-20 lg:relative lg:inset-y-auto lg:left-auto lg:z-auto lg:translate-x-0 lg:flex-shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 flex-shrink-0 border-b border-border">
          <h2 className="text-lg font-semibold">AMINT</h2>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggle} aria-label="Close sidebar">
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Scrollable Area */}
        <ScrollArea className="flex-1 overflow-y-auto p-4 min-h-0">
          {/* Top Buttons */}
          <div className="space-y-1 mb-4">
            <Button variant={activeView === 'chat' ? "secondary" : "ghost"} className="w-full justify-start" onClick={handleNewChatClick}>
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
            <Button variant={activeView === 'upload' ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => onViewChange('upload')}>
              <Upload className="mr-2 h-4 w-4" /> Upload Docs
            </Button>
            <Button variant={activeView === 'hopfield' ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => onViewChange('hopfield')}>
              <Brain className="mr-2 h-4 w-4" /> Network View
            </Button>
          </div>

          {/* Previous Chats */}
          <div className="mb-4">
            <Button variant="ghost" className="w-full justify-between px-2 h-8 text-muted-foreground font-medium text-sm hover:bg-accent/50" onClick={() => setHistoryOpen(!historyOpen)}>
              <div className="flex items-center"> <History className="mr-2 h-4 w-4" /> <span>Chats {chatHistory.length > 0 && `(${chatHistory.length})`}</span> </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${historyOpen ? 'rotate-90' : ''}`} />
            </Button>
            {historyOpen && (
              // *** Ensure text-center is REMOVED from this parent div if it was added ***
              <div className="mt-1 max-h-60 overflow-y-auto py-1 px-2 border-l border-border ml-2 space-y-0.5">
                {chatHistory.length === 0 ? (
                  // *** REPLACE the previous div with this new structure ***
                  <div className="flex justify-start items-center w-full px-2 py-1 text-xs text-muted-foreground italic">
                    {/* Using flex justify-start and px-2 like the button */}
                    {/* Added italic for visual style */}
                    No chat history
                  </div>
                ) : (
                  // Keep the button mapping as is, ensuring it has justify-start/text-left
                  chatHistory.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left px-2 py-1 h-auto whitespace-normal text-sm hover:bg-accent" // Ensure text-left/justify-start
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <MessageSquare className="mr-2 h-3 w-3 flex-shrink-0" />
                      <span className="truncate flex-1 mr-1" title={chat.title}>{chat.title}</span>
                    </Button>
                  ))
                )}
              </div>
            )}

            {/* Optionally show message count */}
            {/* {chat.messages.length > 0 && <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0"> {chat.messages.length}</span>} */}
          </div>

          {/* --- NEW: Network Documents Section --- */}
          <div className="mb-4">
            <Button variant="ghost" className="w-full justify-between px-2 h-8 text-muted-foreground font-medium text-sm hover:bg-accent/50" onClick={() => setDocumentsOpen(!documentsOpen)}>
              <div className="flex items-center"> <FileText className="mr-2 h-4 w-4" /> <span>Documents {networkDocuments.length > 0 && `(${networkDocuments.length})`}</span> </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${documentsOpen ? 'rotate-90' : ''}`} />
            </Button>
            {documentsOpen && (
              <div className="mt-1 max-h-60 overflow-y-auto py-1 px-2 border-l border-border ml-2 space-y-0.5">
                {networkDocuments.length === 0 ? (
                  <div className="py-3 text-xs text-muted-foreground text-center w-full overflow-visible">No documents uploaded</div>
                ) : (
                  networkDocuments.map((doc) => (
                    <Button
                      key={doc.document_id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left px-2 py-1 h-auto whitespace-normal text-sm hover:bg-accent"
                      onClick={() => handleSelectDocument(doc.document_id)}
                      title={`View content: ${doc.title}`}
                    >
                      <FileText className="mr-2 h-3 w-3 flex-shrink-0" />
                      <span className="truncate flex-1 mr-1">{doc.title}</span>
                      {doc.source_type && <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">.{doc.source_type.split('_').pop()}</span>} {/* Show basic type */}
                    </Button>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Area */}
        <div className="p-4 border-t border-border space-y-2 flex-shrink-0">
          <Button variant={activeView === 'settings' ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => onViewChange('settings')}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start items-center space-x-2 p-2 h-auto text-left">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={userInfo?.picture} alt={userInfo?.name} />
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium flex-1">{userInfo?.name || "Account"}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Logged in as {userInfo?.name} ({userInfo?.email}). Are you sure you want to log out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
      {/* Overlay is rendered in App.tsx */}
    </>
  );
}