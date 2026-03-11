import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface WeeklyReviewFile {
  id: string;
  review_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
}

export function useWeeklyReviewFiles(reviewId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files: File[], profileId: string) => {
    if (!reviewId) {
      toast({ title: 'Error', description: 'Please save the review first before uploading files', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const uploadedFiles: WeeklyReviewFile[] = [];

    try {
      for (const file of files) {
        // Upload to storage
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${profileId}/${reviewId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('weekly-review-notes')
          .upload(filePath, file, {
            contentType: 'text/markdown',
            upsert: false,
          });

        if (uploadError) {
          toast({ 
            title: 'Upload failed', 
            description: `Failed to upload ${file.name}: ${uploadError.message}`, 
            variant: 'destructive' 
          });
          continue;
        }

        // Save metadata to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('weekly_review_files')
          .insert({
            review_id: reviewId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
          })
          .select()
          .single();

        if (dbError) {
          toast({ 
            title: 'Database error', 
            description: `Failed to save ${file.name} metadata: ${dbError.message}`, 
            variant: 'destructive' 
          });
          // Clean up uploaded file
          await supabase.storage.from('weekly-review-notes').remove([filePath]);
          continue;
        }

        uploadedFiles.push(fileRecord);
      }

      if (uploadedFiles.length > 0) {
        toast({ 
          title: 'Files uploaded', 
          description: `Successfully uploaded ${uploadedFiles.length} file(s)` 
        });
        queryClient.invalidateQueries({ queryKey: ['weekly_review_files', reviewId] });
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }

    return uploadedFiles;
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('weekly-review-notes')
        .remove([filePath]);

      if (storageError) {
        toast({ 
          title: 'Storage error', 
          description: storageError.message, 
          variant: 'destructive' 
        });
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('weekly_review_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        toast({ 
          title: 'Database error', 
          description: dbError.message, 
          variant: 'destructive' 
        });
        return;
      }

      toast({ title: 'File deleted' });
      queryClient.invalidateQueries({ queryKey: ['weekly_review_files', reviewId] });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('weekly-review-notes')
        .download(filePath);

      if (error) {
        toast({ 
          title: 'Download failed', 
          description: error.message, 
          variant: 'destructive' 
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  return {
    uploadFiles,
    deleteFile,
    downloadFile,
    uploading,
  };
}
