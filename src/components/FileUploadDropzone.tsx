import { useCallback, useState } from 'react';
import { Upload, X, FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MarkdownPreviewDialog } from '@/components/MarkdownPreviewDialog';

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
}

interface FileUploadDropzoneProps {
  files: UploadedFile[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  onFileDownload: (file: UploadedFile) => void;
  onFilePreview: (file: UploadedFile) => Promise<string | null>;
  disabled?: boolean;
  accept?: string;
}

export function FileUploadDropzone({
  files,
  onFilesAdded,
  onFileRemove,
  onFileDownload,
  onFilePreview,
  disabled = false,
  accept = '.md',
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handlePreviewClick = async (file: UploadedFile) => {
    setPreviewFileName(file.file_name);
    setPreviewOpen(true);
    setLoadingPreview(true);
    setPreviewContent(null);

    const content = await onFilePreview(file);
    setPreviewContent(content);
    setLoadingPreview(false);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const mdFiles = droppedFiles.filter(file => file.name.endsWith('.md'));
    
    if (mdFiles.length > 0) {
      onFilesAdded(mdFiles);
    }
  }, [disabled, onFilesAdded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onFilesAdded(Array.from(selectedFiles));
    }
    e.target.value = '';
  }, [onFilesAdded]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      {!disabled && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop markdown files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports .md files only
            </p>
          </label>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({files.length})</p>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_size)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePreviewClick(file)}
                  title="Preview file"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onFileDownload(file)}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onFileRemove(file.id)}
                    title="Delete file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <MarkdownPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileName={previewFileName}
        content={previewContent}
        loading={loadingPreview}
      />
    </div>
  );
}
