import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { BookOpen } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  className?: string;
  memories?: any[]; // Optional source memories for citation mapping
}

// Types for processed citation data
interface Citation {
  text: string;
  sources: string[];
  sourceIndices: string[];
}

export function FormattedMessage({ content, className }: FormattedMessageProps) {
  const [processedContent, setProcessedContent] = useState<string>(content);
  const [citations, setCitations] = useState<Citation[]>([]);

  // Process the content on mount or when content changes
  useEffect(() => {
    const { processed, extractedCitations } = processContent(content);
    setProcessedContent(processed);
    setCitations(extractedCitations);
  }, [content]);

  // Process different tag types
  const processContent = (rawContent: string) => {
    let processed = rawContent;
    const extractedCitations: Citation[] = [];
    
    // Process citation tags with antml format
    processed = processed.replace(
      /(.+?)<\/antml:cite>/gs,
      (_, indexStr, text) => {
        const citationIndex = extractedCitations.length;
        extractedCitations.push({
          text,
          sources: [],
          sourceIndices: indexStr.split(',')
        });
        return `<span class="citation" data-citation-id="${citationIndex + 1}">${text}</span>`;
      }
    );
    
    // Process other common citation formats
    processed = processed.replace(
      /\[\^(\d+)\]/g, 
      (_, num) => {
        return `<span class="footnote-ref">[${num}]</span>`;
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

  // Custom component renderers for ReactMarkdown
  const renderers = {
    // Custom code block renderer with syntax highlighting
    code({ node: _, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={cn("bg-muted px-1 py-0.5 rounded text-sm", className)} {...props}>
          {children}
        </code>
      );
    },
    // Custom paragraph renderer
    p({ children }: any) {
      return <p className="mb-4 last:mb-0">{children}</p>;
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
        <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4">
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
    h1({ children }: any) {
      return <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>;
    },
    h4({ children }: any) {
      return <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>;
    },
  };

  // Render citations section if we have any
  const renderCitations = () => {
    if (citations.length === 0) return null;
    
    return (
      <div className="citations-section mt-4 pt-3 border-t border-border text-xs">
        <h4 className="font-semibold mb-2 flex items-center">
          <BookOpen className="mr-1 h-4 w-4" />
          Citations
        </h4>
        <ol className="pl-5 list-decimal">
          {citations.map((citation, index) => (
            <li key={index} className="mb-1">
              <span>{citation.sourceIndices.join(', ')}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <div className={cn("formatted-message", className)}>
      <div className="markdown-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          components={renderers}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
      
      {renderCitations()}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .citation {
          background-color: rgba(59, 130, 246, 0.1);
          border-radius: 4px;
          padding: 1px 3px;
          border-bottom: 1px dashed #3b82f6;
          position: relative;
          cursor: pointer;
        }
        
        .citation::after {
          content: "[" attr(data-citation-id) "]";
          font-size: 0.7em;
          vertical-align: super;
          color: #3b82f6;
          margin-left: 1px;
        }
        
        .information-block {
          background-color: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          padding: 12px 15px 12px 40px;
          margin: 16px 0;
          border-radius: 4px;
          position: relative;
        }
        
        .information-block::before {
          content: "";
          position: absolute;
          left: 12px;
          top: 14px;
          width: 20px;
          height: 20px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>');
          background-repeat: no-repeat;
        }
        
        .warning-block {
          background-color: rgba(245, 158, 11, 0.1);
          border-left: 4px solid #f59e0b;
          padding: 12px 15px 12px 40px;
          margin: 16px 0;
          border-radius: 4px;
          position: relative;
        }
        
        .warning-block::before {
          content: "";
          position: absolute;
          left: 12px;
          top: 14px;
          width: 20px;
          height: 20px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>');
          background-repeat: no-repeat;
        }
        
        .error-block {
          background-color: rgba(239, 68, 68, 0.1);
          border-left: 4px solid #ef4444;
          padding: 12px 15px 12px 40px;
          margin: 16px 0;
          border-radius: 4px;
          position: relative;
        }
        
        .error-block::before {
          content: "";
          position: absolute;
          left: 12px;
          top: 14px;
          width: 20px;
          height: 20px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>');
          background-repeat: no-repeat;
        }
        
        .success-block {
          background-color: rgba(34, 197, 94, 0.1);
          border-left: 4px solid #22c55e;
          padding: 12px 15px 12px 40px;
          margin: 16px 0;
          border-radius: 4px;
          position: relative;
        }
        
        .success-block::before {
          content: "";
          position: absolute;
          left: 12px;
          top: 14px;
          width: 20px;
          height: 20px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%2322c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>');
          background-repeat: no-repeat;
        }
        
        .citation-block {
          font-style: italic;
          color: #6b7280;
          position: relative;
          padding-left: 2rem;
        }
        
        .citation-block::before {
          content: """;
          position: absolute;
          left: 0;
          top: -0.5rem;
          font-size: 3rem;
          color: #d1d5db;
          line-height: 1;
        }
        
        .footnote-ref {
          color: #3b82f6;
          font-size: 0.75em;
          vertical-align: super;
          text-decoration: none;
          margin-left: 1px;
        }
      ` }} />
    </div>
  );
}