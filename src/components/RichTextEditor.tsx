import React, { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Code, Quote, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className, maxHeight = "300px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML content to prevent XSS and handle complex HTML
  const sanitizeHtml = useCallback((html: string) => {
    // Basic sanitization - allow common formatting tags
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'a', 'span', 'div'
    ];
    const allowedAttributes = ['href', 'target', 'rel', 'class', 'style'];

    // Simple HTML sanitization - in production, use a proper sanitizer library
    let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '');
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');

    return sanitized;
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');

    if (text) {
      const sanitized = sanitizeHtml(text);
      document.execCommand('insertHTML', false, sanitized);
    }
  }, [sanitizeHtml]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Ctrl+B, Ctrl+I, Ctrl+U shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  }, [execCommand]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'pre')}
          className="h-8 w-8 p-0"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[120px] p-3 prose prose-sm max-w-none focus:outline-none overflow-y-auto"
        style={{ maxHeight }}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
    </div>
  );
}