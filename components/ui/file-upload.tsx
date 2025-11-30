"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, File, Image as ImageIcon, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { resizeImage, smartCropImage, getImageDimensions, blobToFile } from "@/lib/utils/image"

interface FileUploadProps {
  onFileSelect: (file: File | null, url?: string) => void
  accept?: string
  maxSize?: number // in MB
  currentUrl?: string
  label?: string
  hint?: string
  className?: string
  bucket?: string
  path?: string
  recommendedDimensions?: {
    width: number
    height: number
  }
  autoResize?: boolean
  smartCrop?: boolean
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  maxSize = 10,
  currentUrl,
  label = "Upload file",
  hint = "Click to browse or drag and drop",
  className,
  bucket = "union-files",
  path = "",
  recommendedDimensions,
  autoResize = false,
  smartCrop = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }
    if (accept && accept !== "*") {
      const acceptedTypes = accept.split(",").map(t => t.trim())
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith("/*")) {
          const category = type.split("/")[0]
          return file.type.startsWith(category + "/")
        }
        return file.type === type
      })
      if (!isAccepted) {
        return `File type must be: ${accept}`
      }
    }
    return null
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient()

    // Generate unique filename
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

  const handleFile = async (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    let processedFile = file

    // Process images with resize or smart crop if enabled
    if (file.type.startsWith("image/") && (autoResize || smartCrop) && recommendedDimensions) {
      setIsUploading(true)
      try {
        const dimensions = await getImageDimensions(file)
        const { width, height } = recommendedDimensions

        let processedBlob: Blob

        if (smartCrop) {
          // Use smart crop for exact dimensions
          processedBlob = await smartCropImage(file, width, height, 0.9)
        } else if (autoResize) {
          // Use resize to fit within dimensions
          processedBlob = await resizeImage(file, {
            maxWidth: width,
            maxHeight: height,
            quality: 0.9,
            maintainAspectRatio: true
          })
        } else {
          processedBlob = file
        }

        processedFile = blobToFile(processedBlob, file.name)
      } catch (err) {
        console.error('Image processing error:', err)
        // Continue with original file if processing fails
      }
    }

    // Show preview for images
    if (processedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(processedFile)
    } else {
      setPreview(null)
    }

    // Upload to Supabase
    setIsUploading(true)
    try {
      const url = await uploadToSupabase(processedFile)
      onFileSelect(processedFile, url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file")
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [])

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
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const isImage = accept.includes("image")

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {recommendedDimensions && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-800">
            <span className="font-medium">Recommended size:</span>{' '}
            {recommendedDimensions.width} × {recommendedDimensions.height} pixels
            {(autoResize || smartCrop) && (
              <span className="block text-xs mt-1 text-blue-600">
                {smartCrop
                  ? '✓ Images will be automatically cropped to fit perfectly'
                  : '✓ Images will be automatically resized to fit'}
              </span>
            )}
          </div>
        </div>
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
        />

        {preview ? (
          <div className="space-y-4">
            {isImage && preview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <File className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">File selected</p>
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                {isImage ? (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium">{hint}</p>
                  <p className="text-xs text-muted-foreground">
                    {maxSize && `Max size: ${maxSize}MB`}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
