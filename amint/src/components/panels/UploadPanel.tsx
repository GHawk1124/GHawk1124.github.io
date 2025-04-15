// src/components/panels/UploadPanel.tsx
import React, { useRef, useState} from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, File, Trash2, Loader2, AlertCircle } from 'lucide-react';
import type { StagedDocument } from '@/App'; // Adjust import path if needed

interface UploadPanelProps {
    stagedDocuments: StagedDocument[];
    onStageFiles: (files: FileList | null) => void;
    onRemoveStaged: (id: string) => void;
    onUploadStaged: () => Promise<void>;
    isDevelopment: boolean;
    // Optional: addDummyFiles?: () => Promise<void>;
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
     if (bytes <= 0) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
     const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function UploadPanel({
    stagedDocuments,
    onStageFiles,
    onRemoveStaged,
    onUploadStaged,
    isDevelopment,
    // addDummyFiles
}: UploadPanelProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleBrowseClick = () => fileInputRef.current?.click();
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onStageFiles(event.target.files);
         if(event.target) event.target.value = ''; // Reset input
    }
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>) => setIsDragging(false);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        onStageFiles(e.dataTransfer.files);
    };

    const handleUploadClick = async () => {
        const filesReadyToUpload = stagedDocuments.filter(d => d.status === 'staging');
        if (filesReadyToUpload.length === 0) {
            toast({ title: "No Files Ready", description: "Stage some files first or remove failed uploads.", variant:"default"});
            return;
        }
        setIsUploading(true);
        try {
             await onUploadStaged();
        } catch (error) {
             console.error("Panel upload trigger error:", error);
             toast({ title: "Upload Error", description: "An unexpected error occurred during upload initiation.", variant: "destructive"});
        } finally {
             setIsUploading(false);
        }
    };

    const uploadDisabled = isUploading || stagedDocuments.filter(d => d.status === 'staging').length === 0;
    const uploadButtonText = isUploading ? 'Uploading...' : `Upload ${stagedDocuments.filter(d=>d.status === 'staging').length} Staged`;

    return (
        <div className="flex flex-col h-full bg-background"> {/* Panel background */}
             {/* Header specific to the panel */}
             <div className="p-4 border-b border-border flex-shrink-0">
                 <h2 className="text-lg font-semibold">Upload Documents</h2>
            </div>
            <ScrollArea className="flex-1 p-4 lg:p-6">
                 <div className="space-y-6 max-w-2xl mx-auto"> {/* Max width for content */}
                     {/* Upload Area */}
                     <div
                         className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/80 transition-colors", isDragging ? 'border-primary bg-primary/5' : 'border-border')}
                         onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleBrowseClick}
                     >
                         <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                         <h3 className="font-medium mb-2">Drag & drop documents or click browse</h3>
                         <p className="text-sm text-muted-foreground mb-4">Supports PDF, TXT, MD, JPG, PNG etc.</p>
                         <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md,.json,.csv,.jpg,.jpeg,.png" />
                     </div>

                     {/* Staged Documents List */}
                     {stagedDocuments.length > 0 && (
                         <div className="bg-card border rounded-lg p-4 shadow-sm">
                             <div className="flex justify-between items-center mb-3">
                                  <h3 className="font-medium text-base text-card-foreground">Staged Files ({stagedDocuments.length})</h3>
                                   <Button onClick={handleUploadClick} disabled={uploadDisabled} size="sm">
                                       {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                       {uploadButtonText}
                                   </Button>
                             </div>
                             <div className="space-y-2 mt-3 max-h-[calc(100vh-500px)] overflow-y-auto pr-2 border rounded-md p-2 bg-background"> {/* Adjust max-h */}
                                 {stagedDocuments.map((doc) => (
                                     <div key={doc.id} className={cn("flex items-center justify-between bg-card rounded border p-2 gap-2", doc.status === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-border')}>
                                         <div className="flex items-center space-x-2 overflow-hidden flex-1">
                                             {/* Status Icons */}
                                             {doc.status === 'uploading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />}
                                             {/* --- FIX IS HERE --- Wrap icon in span with title */}
                                             {doc.status === 'error' && (
                                                <span title={doc.errorMessage || 'Upload failed'}>
                                                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0"/>
                                                </span>
                                             )}
                                             {/* ------------------- */}
                                             {(doc.status === 'staging') && <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />}

                                             {/* File Info */}
                                             <div className="overflow-hidden">
                                                 <p className="text-sm font-medium truncate text-card-foreground" title={doc.name}>{doc.name}</p>
                                                 <p className="text-xs text-muted-foreground">
                                                     {formatFileSize(doc.size)}
                                                     {doc.status === 'error' && <span className="text-destructive ml-1 font-medium"> - Failed</span>}
                                                     {doc.status === 'uploading' && <span className="text-blue-600 ml-1 font-medium"> - Uploading...</span>}
                                                     {doc.status === 'staging' && <span className="text-gray-500 ml-1 font-medium"> - Ready</span>}
                                                 </p>
                                                  {/* Display error message inline (optional) */}
                                                  {/* {doc.status === 'error' && doc.errorMessage && <p className="text-xs text-destructive/90 truncate" title={doc.errorMessage}>Error: {doc.errorMessage}</p>} */}
                                             </div>
                                         </div>
                                         {/* Remove Button */}
                                         <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => onRemoveStaged(doc.id)} disabled={doc.status === 'uploading'}>
                                             <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                         </Button>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}

                     {/* Dummy Files Generator (Development Only) - Placeholder */}
                     {isDevelopment && (
                          <div className="bg-muted/30 rounded-lg p-4 border border-border text-center">
                               <p className="text-sm text-muted-foreground">Dev tools (e.g., Add Dummy Files) can be added here.</p>
                               {/* <Button variant="outline" size="sm" onClick={addDummyFiles} disabled={isAddingDummies}> ... </Button> */}
                          </div>
                     )}
                 </div>
             </ScrollArea>
        </div>
    );
}