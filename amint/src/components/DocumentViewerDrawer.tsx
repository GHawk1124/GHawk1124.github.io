// *** .\GHawk1124.github.io\amint\src\components\DocumentViewerDrawer.tsx (New File) ***
import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"; // Use Drawer for mobile-friendly bottom sheet
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface DocumentViewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | null;
  content: string | null;
  isLoading: boolean;
  sourceType?: string;
}

export function DocumentViewerDrawer({
  isOpen,
  onClose,
  title,
  content,
  isLoading,
  sourceType
}: DocumentViewerDrawerProps) {

  // Custom component renderers for ReactMarkdown including KaTeX
  const renderers = {
    // Add other renderers if needed (like code blocks from FormattedMessage)
    // Custom paragraph renderer
     p({ children }: any) {
       return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>;
     },
     // Custom list renderers
     ul({ children }: any) {
       return <ul className="list-disc pl-6 mb-4">{children}</ul>;
     },
     ol({ children }: any) {
       return <ol className="list-decimal pl-6 mb-4">{children}</ol>;
     },
     li({ children }: any) {
       return <li className="mb-1">{children}</li>;
     },
     // Custom heading renderers
     h1({ children }: any) { return <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2">{children}</h1>; },
     h2({ children }: any) { return <h2 className="text-xl font-semibold mb-3 mt-5 border-b pb-1">{children}</h2>; },
     h3({ children }: any) { return <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>; },
     h4({ children }: any) { return <h4 className="text-base font-semibold mb-2 mt-3">{children}</h4>; },
     blockquote({ children }: any) {
         return <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-4 text-muted-foreground">{children}</blockquote>;
     },
  };


  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* DrawerTrigger is usually tied to the button that opens it, handled in Sidebar */}
      <DrawerContent className="h-[85vh] flex flex-col"> {/* Set height */}
        <DrawerHeader className="text-left border-b pb-3 pt-4 px-4">
          <DrawerTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{title || 'Document'}</span>
          </DrawerTitle>
          <DrawerDescription className="truncate">
             Displaying {sourceType === 'pdf' ? 'OCR text for PDF' : (sourceType || 'document')} content.
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading content...
            </div>
          ) : content === null || content === undefined ? (
             <div className="flex justify-center items-center h-full text-muted-foreground italic">
               Could not load document content.
            </div>
          ) : content.trim() === "" ? (
             <div className="flex justify-center items-center h-full text-muted-foreground italic">
              Document appears to be empty.
             </div>
           ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none markdown-content">
                 {/* Render Markdown with KaTeX support */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={renderers}
                  // Ensure KaTeX CSS is loaded globally (e.g., in main.tsx or index.html)
                >
                  {content}
                </ReactMarkdown>
            </div>
          )}
        </ScrollArea>

        <DrawerFooter className="border-t pt-3 pb-4 px-4">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
         {/* Add style block for Katex if needed, or ensure global import */}
         <style dangerouslySetInnerHTML={{ __html: `
            .markdown-content { line-height: 1.7; }
            .katex-display { overflow-x: auto; overflow-y: hidden; padding: 0.5em 0; } /* Make displayed KaTeX scrollable if too wide */
          `}} />
      </DrawerContent>
    </Drawer>
  );
}