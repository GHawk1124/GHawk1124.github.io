// .\GHawk1124.github.io\amint\src\components\FormattedMessage.tsx
import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from "@/lib/utils";
import type { MemoryResult } from '@/App'; // Import MemoryResult type
import React from 'react';

interface FormattedMessageProps {
  content: string;
  className?: string;
  memories?: MemoryResult[]; // Use specific type
}

// Types for processed citation data
interface Citation {
  text: string;
  sources: string[]; // Could store source names if mapping is done
  sourceIndices: string[]; // Indices as strings ('1', '2', etc.)
}

export function FormattedMessage({ content, className, memories }: FormattedMessageProps) { // Accept memories prop
  const [processedContent, setProcessedContent] = useState<string>(content);
  const [/*citations*/, setCitations] = useState<Citation[]>([]);

  // Process the content on mount or when content changes
  useEffect(() => {
    const { processed, extractedCitations } = processContent(content);
    setProcessedContent(processed);

    // Map extracted citation indices to actual source names from memories prop
    const mappedCitations = extractedCitations.map(citation => {
        const sources = citation.sourceIndices
            .map(indexStr => parseInt(indexStr, 10) - 1) // Convert '1' -> 0, '2' -> 1 etc.
            .filter(index => memories && index >= 0 && index < memories.length) // Ensure index is valid
            .map(index => memories![index]) // Get the memory object
            .map(mem => `${mem.name}${mem.section_title ? ` - ${mem.section_title}` : ''}`); // Format the source string
        return { ...citation, sources };
    });

    setCitations(mappedCitations);
  }, [content, memories]); // Add memories to dependency array

  // Process different tag types
  const processContent = (rawContent: string) => {
    let processed = rawContent;
    const extractedCitations: Citation[] = [];

    // Regex to capture <antml:cite indices="1,2">cited text</antml:cite>
    // It looks for the indices attribute and captures the indices string and the text content.
     processed = processed.replace(
        /<antml:cite indices="([\d,]+)">(.*?)<\/antml:cite>/gs,
        (_, indicesStr, text) => {
            // const citationIndex = extractedCitations.length;
            extractedCitations.push({
                text,
                sources: [], // Will be populated later
                sourceIndices: indicesStr.split(',') // Store the original indices ('1', '2')
            });
            // Embed the citation index in the output HTML for potential linking/styling
            return `<span class="citation" data-citation-ref="${indicesStr}">${text}<sup class="citation-sup">[${indicesStr}]</sup></span>`;
        }
    );

    // --- Keep other replacements as they are ---
    // Process standard markdown footnotes like [^1]
    processed = processed.replace(
      /\[\^(\d+)\]/g,
      (_, num) => {
        // You might want to link this to a footnote definition later
        return `<sup class="footnote-ref">[${num}]</sup>`;
      }
    );
     // Process simple bracketed numbers like [1] or [Document 1] which Gemini might use
    processed = processed.replace(
      /\[(?:Document\s*)?(\d+)\]/g,
      (_, num) => {
         // Try to find a matching citation if memories are available
         const matchingCitation = memories?.[parseInt(num, 10) -1];
         const title = matchingCitation ? `${matchingCitation.name}${matchingCitation.section_title ? ` - ${matchingCitation.section_title}` : ''}` : `Source ${num}`;
         // Add a title attribute for hover info
         return `<sup class="footnote-ref" title="${title}">[${num}]</sup>`;
      }
    );

    // Process information tags
    processed = processed.replace(
      /<information>(.+?)<\/information>/gs,
      '<div class="information-block">$1</div>'
    );
    // Process warning tags
    processed = processed.replace(
      /<warning>(.+?)<\/warning>/gs,
      '<div class="warning-block">$1</div>'
    );
    // Process error tags
    processed = processed.replace(
      /<error>(.+?)<\/error>/gs,
      '<div class="error-block">$1</div>'
    );
    // Process success/tips tags
    processed = processed.replace(
      /<success>(.+?)<\/success>/gs,
      '<div class="success-block">$1</div>'
    );
    // Process quote/citation blocks
    processed = processed.replace(
      /<quote>(.+?)<\/quote>/gs,
      '<blockquote class="citation-block">$1</blockquote>'
    );

    return { processed, extractedCitations };
  };

  // Custom component renderers for ReactMarkdown (keep as is)
  const renderers = {
     // Custom code block renderer with syntax highlighting
    code({ node: _, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-2 text-sm" // Ensure text size is appropriate
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={cn("bg-muted px-1 py-0.5 rounded text-sm font-mono", className)} {...props}>
          {children}
        </code>
      );
    },
     // Custom paragraph renderer - remove extra bottom margin if it contains only tags that have margins
     p({ children, /*node*/ }: any) {
         // Check if paragraph only contains block elements like code blocks or divs, which already have margins
         const containsOnlyBlocks = React.Children.toArray(children).every((child: any) =>
            typeof child === 'object' && child?.type && ['pre', 'div', 'blockquote', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4'].includes(child.type)
         );
         return <p className={cn("leading-relaxed", !containsOnlyBlocks && "mb-4 last:mb-0")}>{children}</p>;
     },
    // Custom link renderer
    a({ node: _, href, children, ...props }: any) {
      return (
        <a
          href={href}
          className="text-primary underline hover:text-primary/80"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    // Custom blockquote renderer
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground">
          {children}
        </blockquote>
      );
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
    h1({ children }: any) { return <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>; },
    h2({ children }: any) { return <h2 className="text-xl font-semibold mb-3 mt-5">{children}</h2>; }, // Use semibold for H2
    h3({ children }: any) { return <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>; }, // Use semibold for H3
    h4({ children }: any) { return <h4 className="text-base font-semibold mb-2 mt-3">{children}</h4>; }, // Use semibold for H4
    sup({ children }: any) { return <sup className="footnote-ref">{children}</sup> } // Handle superscript for citations
  };

  // Render citations section if we have any mapped citations
  // const renderCitationsSection = () => {
  //     // Only render if there are citations AND memories were provided to potentially map them
  //     if (citations.length === 0 || !memories || memories.length === 0) return null;

  //     // Filter out citations that couldn't be mapped to any source
  //     const validCitations = citations.filter(c => c.sources.length > 0);
  //     if (validCitations.length === 0) return null;

  //     return (
  //         <div className="citations-section mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
  //             <h4 className="font-semibold mb-2 flex items-center text-foreground/80">
  //                 <BookOpen className="mr-1.5 h-4 w-4" />
  //                 Cited Sources
  //             </h4>
  //             <ol className="pl-5 list-decimal space-y-1">
  //                 {validCitations.map((citation, index) => (
  //                     <li key={index} className="leading-snug">
  //                          {/* Display the actual source names */}
  //                         {citation.sources.join('; ')}
  //                          {/* Optionally keep the original text, linked via index */}
  //                         {/* <span className='ml-2 italic'>({citation.text})</span> */}
  //                     </li>
  //                 ))}
  //             </ol>
  //         </div>
  //     );
  // };


  return (
    <div className={cn("formatted-message", className)}>
      <div className="markdown-content break-words"> {/* Ensure words break */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={renderers}
          // Allow HTML for custom tags and citation spans
          // Be cautious with allowDangerousHtml if content isn't fully trusted
          // remarkRehypeOptions={{ allowDangerousHtml: true }}
          // rehypePlugins={[rehypeRaw]} // Use rehypeRaw if needed and installed
        >
          {processedContent}
        </ReactMarkdown>
      </div>
      {/* Comment out the separate citation section rendering, as it's handled within ChatArea now */}
      {/* {renderCitationsSection()} */}

       {/* Add CSS Styles - Adjusted citation styling */}
       <style dangerouslySetInnerHTML={{ __html: `
        .markdown-content p:last-child { margin-bottom: 0 !important; } /* Attempt to remove margin from last p */
        .markdown-content { line-height: 1.7; }
        .katex-display { overflow-x: auto; overflow-y: hidden; padding: 0.5em 0; }
        .citation {
          /* background-color: rgba(59, 130, 246, 0.1); */ /* Optional background */
          /* border-radius: 3px; */
          /* padding: 0px 2px; */
          /* border-bottom: 1px dotted #3b82f6; */ /* Dotted underline */
          /* position: relative; */
          /* cursor: default; */ /* Default cursor */
        }
         .citation-sup { /* Style the superscript number */
           font-size: 0.75em;
           vertical-align: super;
           color: #3b82f6; /* Blue color */
           margin-left: 1px;
           font-weight: 500;
           text-decoration: none; /* No underline */
           cursor: help; /* Help cursor */
        }
         .footnote-ref { /* Style standard markdown footnote refs */
           color: #3b82f6;
           font-size: 0.75em;
           vertical-align: super;
           text-decoration: none;
           margin-left: 1px;
           cursor: help;
        }

         /* Keep block styles as they are */
        .information-block { background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 10px 15px 10px 35px; margin: 12px 0; border-radius: 4px; position: relative; }
        .information-block::before { content: ""; position: absolute; left: 10px; top: 12px; width: 16px; height: 16px; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'); background-repeat: no-repeat; }

        .warning-block { background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 10px 15px 10px 35px; margin: 12px 0; border-radius: 4px; position: relative; }
        .warning-block::before { content: ""; position: absolute; left: 10px; top: 12px; width: 16px; height: 16px; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'); background-repeat: no-repeat; }

        .error-block { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 10px 15px 10px 35px; margin: 12px 0; border-radius: 4px; position: relative; }
        .error-block::before { content: ""; position: absolute; left: 10px; top: 12px; width: 16px; height: 16px; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>'); background-repeat: no-repeat; }

        .success-block { background-color: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; padding: 10px 15px 10px 35px; margin: 12px 0; border-radius: 4px; position: relative; }
        .success-block::before { content: ""; position: absolute; left: 10px; top: 12px; width: 16px; height: 16px; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2322c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>'); background-repeat: no-repeat; }

        /* Keep citation block styling */
        .citation-block { font-style: italic; color: #6b7280; position: relative; padding-left: 2rem; margin-top: 1rem; margin-bottom: 1rem; }
        .citation-block::before { content: '"'; position: absolute; left: 0; top: -0.5rem; font-size: 3rem; color: #d1d5db; line-height: 1; }

       ` }} />
    </div>
  );
}