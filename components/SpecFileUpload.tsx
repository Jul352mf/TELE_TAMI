"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, Check } from "lucide-react";
import { emit } from "@/utils/telemetry";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
}

interface SpecFileUploadProps {
  onFileUploaded?: (file: UploadedFile) => void;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

export default function SpecFileUpload({ 
  onFileUploaded,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx'],
  className = ""
}: SpecFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(file => {
      // Validate file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxFileSize)}.`);
        return;
      }

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        alert(`File type ${fileExtension} is not supported.`);
        return;
      }

      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: Date.now(),
        status: 'uploading'
      };

      setFiles(prev => [...prev, uploadedFile]);

      // Simulate upload process
      uploadFile(file, uploadedFile);
    });
  };

  const uploadFile = async (file: File, uploadedFile: UploadedFile) => {
    try {
      // Emit telemetry
      emit({ 
        type: 'spec_uploaded', 
        filename: file.name, 
        size: file.size 
      });

      // In a real implementation, this would upload to your storage service
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        originalName: file.name,
        uploadedAt: uploadedFile.uploadedAt
      }));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate successful upload
      const mockUrl = `/uploads/${uploadedFile.id}/${file.name}`;
      
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'success', url: mockUrl }
          : f
      ));

      if (onFileUploaded) {
        onFileUploaded({ ...uploadedFile, status: 'success', url: mockUrl });
      }

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error' }
          : f
      ));
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Spec Files</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptedTypes.join(', ')} up to {formatFileSize(maxFileSize)}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Files list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {files.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      file.status === 'success' ? 'default' :
                      file.status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {file.status === 'uploading' && "Uploading..."}
                    {file.status === 'success' && (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded
                      </>
                    )}
                    {file.status === 'error' && "Error"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}