"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, File, Paperclip, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface FileInfo {
  id: string
  file: File
  url?: string
  uploading: boolean
  error?: string
}

interface MultiFileUploadProps {
  onFilesChange: (files: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>) => void
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  bucket?: string
  path?: string
  label?: string
  hint?: string
  className?: string
}

export function MultiFileUpload({
  onFilesChange,
  accept = "*",
  maxSize = 50,
  maxFiles = 5,
  bucket = "union-files",
  path = "",
  label = "Attach files",
  hint = "Click to browse or drag and drop files",
  className
}: MultiFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }
    return null
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = path ? `${path}/${fileName}` : fileName

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleFiles = async (newFiles: FileList | File[]) => {
    setError(null)

    const fileArray = Array.from(newFiles)

    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validatedFiles: FileInfo[] = fileArray.map(file => {
      const validationError = validateFile(file)
      return {
        id: Math.random().toString(36).substring(7),
        file,
        uploading: !validationError,
        error: validationError || undefined
      }
    })

    setFiles(prev => [...prev, ...validatedFiles])

    // Upload files in parallel
    const uploadPromises = validatedFiles
      .filter(f => !f.error)
      .map(async (fileInfo) => {
        try {
          const url = await uploadToSupabase(fileInfo.file)
          setFiles(prev => prev.map(f =>
            f.id === fileInfo.id
              ? { ...f, url, uploading: false }
              : f
          ))
          return {
            fileName: fileInfo.file.name,
            fileUrl: url,
            fileType: fileInfo.file.type,
            fileSize: fileInfo.file.size
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Upload failed"
          setFiles(prev => prev.map(f =>
            f.id === fileInfo.id
              ? { ...f, uploading: false, error: errorMessage }
              : f
          ))
          return null
        }
      })

    const uploadedFiles = await Promise.all(uploadPromises)
    const successfulUploads = uploadedFiles.filter((f): f is NonNullable<typeof f> => f !== null)

    if (successfulUploads.length > 0) {
      onFilesChange(successfulUploads)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [files])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
  }

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setError(null)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
          "hover:border-primary hover:bg-accent/50",
          isDragging && "border-primary bg-accent",
          error && "border-destructive",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          multiple
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <Paperclip className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{hint}</p>
            <p className="text-xs text-muted-foreground">
              {maxSize && `Max size: ${maxSize}MB per file`}
              {maxFiles && ` • Max ${maxFiles} files`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileInfo) => (
            <div
              key={fileInfo.id}
              className={cn(
                "flex items-center gap-3 p-3 bg-muted rounded-lg",
                fileInfo.error && "bg-destructive/10 border border-destructive/20"
              )}
            >
              <File className={cn(
                "h-5 w-5 flex-shrink-0",
                fileInfo.error ? "text-destructive" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileInfo.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {fileInfo.error && (
                  <p className="text-xs text-destructive mt-1">{fileInfo.error}</p>
                )}
              </div>
              {fileInfo.uploading && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {!fileInfo.uploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(fileInfo.id)
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
