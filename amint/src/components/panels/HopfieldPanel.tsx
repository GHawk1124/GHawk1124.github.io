import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Clock, FileText, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import type { NetworkStats, NetworkDoc, UserInfo, MemoryResult } from '@/App'; // Adjust import path if needed
import type { useToast } from "@/hooks/use-toast"; // Import type
import { cn } from '@/lib/utils'; // Import cn
import { queryMemories, type MemoryQueryResult } from '@/lib/api'; // Use updated API functions/types

interface HopfieldPanelProps {
    networkStats: NetworkStats;
    networkDocuments: NetworkDoc[];
    isLoadingStats: boolean;
    isLoadingDocuments: boolean;
    onRefresh: () => void;
    userInfo: UserInfo | null;
    toast: ReturnType<typeof useToast>['toast'];
    // queryMemories: (userId: string, params: any) => Promise<{ results: MemoryResult[], gemini_response?: string }>; // Keep if needed elsewhere, but we'll use the imported one
    onSelectDocument: (id: string | null) => void;
    selectedDocumentId: string | null;
    onOpenDocumentDrawer: (id: string) => void;
}

// Simple Stat Card Component (can be moved to ui folder)
const StatCard = ({ title, value, loading }: { title: string, value: number | string, loading: boolean }) => (
    <div className="bg-card border rounded-lg p-4 shadow-sm text-center">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">{title}</h4>
        {loading ? (
            <div className="h-8 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
            <p className="text-3xl font-bold text-card-foreground">{value}</p>
        )}
    </div>
);

export function HopfieldPanel({
    networkStats,
    networkDocuments,
    isLoadingStats,
    isLoadingDocuments,
    onRefresh,
    userInfo,
    toast,
    // queryMemories, // Can remove from props if using imported one directly
    onSelectDocument,
    selectedDocumentId,
    onOpenDocumentDrawer
}: HopfieldPanelProps) {
    const [memoryQuery, setMemoryQuery] = useState("");
    const [memoryResults, setMemoryResults] = useState<MemoryResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [lastQueryStats, setLastQueryStats] = useState<{ count: number; threshold: number } | null>(null); // Store stats from last query

    const handleDocViewClick = (docId: string) => {
        onOpenDocumentDrawer(docId);
    };

    // Handle memory query - Modified
    const handleMemoryQuery = useCallback(async () => {
        if (!memoryQuery.trim() || !userInfo?.id) return;
        setIsSearching(true);
        setMemoryResults([]);
        setLastQueryStats(null); // Reset stats
        const currentThreshold = 0.7; // Define threshold for this specific query type

        try {
            console.log(`Querying memories for "${memoryQuery}" with threshold ${currentThreshold}...`);
            // Use imported queryMemories directly
            const data: MemoryQueryResult = await queryMemories(userInfo.id, {
                query_text: memoryQuery,
                similarity_threshold: currentThreshold, // Use threshold
                use_gemini: false // Don't need Gemini response in this panel view
            });
            console.log(`Query results received: ${data.results?.length || 0} (Retrieved ${data.retrieved_count})`);
            setMemoryResults(data.results || []);
            setLastQueryStats({ count: data.retrieved_count, threshold: data.threshold_used }); // Store stats

            if (!data.results || data.results.length === 0) {
                toast({ title: "No Results", description: `Query didn't match stored memories above threshold ${currentThreshold}.`, duration: 3000 });
            }
        } catch (error) {
            console.error("Error querying memories:", error);
            toast({ title: "Query Error", description: error instanceof Error ? error.message : "Could not query network.", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    // Include userInfo.id in dependencies
    }, [memoryQuery, userInfo?.id, toast]);

    // handleKeyDown (remains the same)
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isSearching) {
            handleMemoryQuery();
        }
    };

    // handleDocClick (remains the same)
    const handleDocClick = (docId: string) => {
        const newSelectedId = selectedDocumentId === docId ? null : docId;
        onSelectDocument(newSelectedId);
    };

    // Return statement - Modified results display
    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-semibold">Hopfield Network View</h2>
            </div>
            <ScrollArea className="flex-1 p-4 lg:p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <StatCard title="Total Memories" value={networkStats.memory_count} loading={isLoadingStats} />
                         <StatCard title="Documents" value={networkStats.document_count} loading={isLoadingDocuments || isLoadingStats} />
                     </div>

                     {/* Network Documents */}
                     <div className="bg-card border rounded-lg p-4 shadow-sm">
                        {/* ... (Document list remains the same) ... */}
                         <div className="flex justify-between items-center mb-3">
                             <h3 className="font-medium text-lg text-card-foreground">Network Documents</h3>
                             <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingDocuments || isLoadingStats}>
                                 {isLoadingDocuments || isLoadingStats ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                 Refresh
                             </Button>
                         </div>
                         {isLoadingDocuments ? (
                             <div className="flex justify-center items-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                         ) : networkDocuments.length === 0 ? (
                             <p className="text-sm text-muted-foreground text-center py-4 italic">
                                 {networkStats.document_count > 0 ? <span className="flex items-center justify-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Docs exist but cannot be listed (server issue).</span> : "No documents found."}
                             </p>
                         ) : (
                             <ScrollArea className="h-48 w-full rounded-md border bg-background">
                                 <div className="p-2 space-y-1">
                                     {networkDocuments.map((doc) => (
                                         <div key={doc.document_id} className="flex items-center justify-between w-full">
                                             {/* Button for setting context */}
                                             <Button
                                                  variant={selectedDocumentId === doc.document_id ? "secondary" : "ghost"}
                                                  className={cn("flex items-center justify-start h-auto py-1.5 px-2 text-left flex-1 mr-1", selectedDocumentId === doc.document_id ? "ring-2 ring-primary/50" : "")}
                                                  onClick={() => handleDocClick(doc.document_id)}
                                                  title={`Click to ${selectedDocumentId === doc.document_id ? 'clear' : 'set'} chat context to: ${doc.title}`}
                                             >
                                                  <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground"/>
                                                  <span className="font-medium truncate text-sm">{doc.title}</span>
                                              </Button>
                                              {/* Separate Button for viewing content */}
                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="flex-shrink-0 h-auto py-1 px-2 ml-1"
                                                  onClick={() => handleDocViewClick(doc.document_id)}
                                                  title={`View content: ${doc.title}`}
                                              >
                                                  View
                                              </Button>
                                          </div>
                                      ))}
                                  </div>
                              </ScrollArea>
                          )}
                          <div className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
                              <Info size={14} /> Click a document to scope chat context (click again to clear).
                          </div>
                      </div>


                     {/* Memory Query */}
                     <div className="bg-card border rounded-lg p-4 shadow-sm">
                         <h3 className="font-medium text-lg mb-3 text-card-foreground">Query Memories</h3>
                         <div className="flex space-x-2">
                            <Input value={memoryQuery} onChange={(e) => setMemoryQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter text to find relevant memories..." className="flex-1" disabled={isSearching} aria-label="Memory query input" />
                            <Button onClick={handleMemoryQuery} disabled={isSearching || !memoryQuery.trim()} aria-label="Search memories">
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Search</span>
                            </Button>
                         </div>

                         {/* Query Results - Modified */}
                         {(isSearching || memoryResults.length > 0 || lastQueryStats) && ( // Show section if searching, have results, or have stats from last search
                            <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                                     Results {lastQueryStats ? `(${lastQueryStats.count} found @ threshold ${lastQueryStats.threshold})` : (isSearching ? '...' : '')}
                                </h4>
                                <ScrollArea className="h-72 w-full rounded-md border bg-background">
                                    {isSearching && memoryResults.length === 0 ? (
                                        <div className="flex justify-center items-center h-full text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Searching...</div>
                                    ) : memoryResults.length > 0 ? ( // Only map if results exist
                                        <div className="p-3 space-y-3">
                                            {memoryResults.map((result) => (
                                                <div key={result.memory_id} className="p-3 bg-muted/40 rounded border border-border/50 text-sm">
                                                    <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground gap-2">
                                                        <span className="font-medium truncate pr-2" title={result.name}>Source: {result.name} {result.section_title ? `> ${result.section_title}` : ''}</span>
                                                        <span className="flex items-center flex-shrink-0 whitespace-nowrap"><Clock className="h-3 w-3 mr-1" /> {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap line-clamp-4 text-foreground/90">{result.text}</p>
                                                    {/* Optional: Display similarity score if backend provides it */}
                                                    {/* {result.similarity_score && <p className="text-xs text-blue-500 mt-1">Score: {result.similarity_score.toFixed(4)}</p>} */}
                                                </div>
                                            ))}
                                        </div>
                                     ) : null } {/* Render nothing if not searching and no results */}
                                 </ScrollArea>
                             </div>
                         )}
                         {/* Show no results message only if not searching and query was made */}
                          {memoryResults.length === 0 && memoryQuery.trim() !== "" && !isSearching && lastQueryStats && (
                              <p className="text-sm text-muted-foreground text-center mt-4 italic">No results found above threshold {lastQueryStats.threshold}.</p>
                          )}
                      </div>
                 </div>
             </ScrollArea>
         </div>
     );
}