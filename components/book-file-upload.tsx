"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload } from "lucide-react"

interface BookFileUploadProps {
  bookId: string
  bookTitle: string
  language?: "english" | "spanish"  // Optional language prop
  onFileUploaded?: () => void
}

export default function BookFileUpload({ bookId, bookTitle, language, onFileUploaded }: BookFileUploadProps) {
  const [open, setOpen] = useState(false)
  const [englishFile, setEnglishFile] = useState<File | null>(null)
  const [spanishFile, setSpanishFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpload = async () => {
    // If language is specified, only check that file
    if (language === "english" && !englishFile) {
      toast.error("Please select an English file to upload")
      return
    }
    if (language === "spanish" && !spanishFile) {
      toast.error("Please select a Spanish file to upload")
      return
    }
    if (!language && !englishFile && !spanishFile) {
      toast.error("Please select at least one file to upload")
      return
    }

    setIsLoading(true)

    try {
      // Process English file if available and requested
      if (englishFile && (!language || language === "english")) {
        await uploadFile(englishFile, "english")
      }

      // Process Spanish file if available and requested
      if (spanishFile && (!language || language === "spanish")) {
        await uploadFile(spanishFile, "spanish")
      }

      toast.success("Files uploaded successfully!")
      setOpen(false)
      resetForm()
      
      // Call the callback if provided
      if (onFileUploaded) {
        onFileUploaded()
      }
    } catch (error: any) {
      console.error("Error uploading files:", error)
      toast.error(error.message || "Failed to upload files")
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFile = async (file: File, language: string) => {
    // Step 1: Get presigned URL
    const presignResponse = await fetch('/api/books/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type
      })
    })
    
    if (!presignResponse.ok) {
      throw new Error(`Failed to get upload URL for ${language} file`)
    }
    
    const { signedUrl, path } = await presignResponse.json()
    
    // Step 2: Upload the file
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${language} file`)
    }
    
    // Step 3: Associate file with book in database
    const fileData = {
      bookId,
      storageKey: path,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      language
    }
    
    const associateResponse = await fetch('/api/books/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData)
    })
    
    if (!associateResponse.ok) {
      throw new Error(`Failed to associate ${language} file with book`)
    }
    
    return await associateResponse.json()
  }

  const resetForm = () => {
    setEnglishFile(null)
    setSpanishFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={language ? "outline" : "outline"} 
          size="sm" 
          className={`flex gap-2 ${language ? "rounded-full border-none text-xs py-1 px-2 h-8 text-secondary-light/40 bg-secondary/10 hover:bg-secondary/20" : ""}`}
        >
          not available (upload file)
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload E-book Files</DialogTitle>
          <DialogDescription>
            Add e-book {language ? `(${language})` : "files"} for "{bookTitle}". Supported format: .epub
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {(!language || language === "english") && (
            <div className="grid gap-2">
              <Label htmlFor="english-file" className="font-medium">English Version</Label>
              <Input
                id="english-file"
                type="file"
                accept=".epub"
                onChange={e => setEnglishFile(e.target.files?.[0] || null)}
              />
              {englishFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {englishFile.name} ({(englishFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {(!language || language === "spanish") && (
            <div className="grid gap-2">
              <Label htmlFor="spanish-file" className="font-medium">Spanish Version</Label>
              <Input
                id="spanish-file"
                type="file"
                accept=".epub"
                onChange={e => setSpanishFile(e.target.files?.[0] || null)}
              />
              {spanishFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {spanishFile.name} ({(spanishFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={isLoading || 
              (language === "english" && !englishFile) || 
              (language === "spanish" && !spanishFile) || 
              (!language && !englishFile && !spanishFile)}
          >
            {isLoading ? "Uploading..." : "Upload Files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 