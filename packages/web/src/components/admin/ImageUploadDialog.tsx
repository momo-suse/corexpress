import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { uploadImage } from '@/api/images'
import { Upload, Link2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadDialogProps {
  open: boolean
  onClose: () => void
  /** Called with the final image URL to insert into the editor */
  onInsert: (url: string) => void
  postId?: number
}

type Mode = 'upload' | 'url'

export default function ImageUploadDialog({ open, onClose, onInsert, postId }: ImageUploadDialogProps) {
  const [mode, setMode] = useState<Mode>('upload')
  const [urlValue, setUrlValue] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setMode('upload')
    setUrlValue('')
    setSelectedFile(null)
    setPreview(null)
    setUploading(false)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setError(null)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(selectedFile, postId)
      onInsert(result.data.url)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleInsertUrl() {
    const url = urlValue.trim()
    if (!url) return
    onInsert(url)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md" onKeyDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Insert image
          </DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-md">
          <button
            type="button"
            onClick={() => { setMode('upload'); setError(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 text-sm px-3 py-1.5 rounded transition-colors',
              mode === 'upload'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Upload className="h-4 w-4" />
            Upload file
          </button>
          <button
            type="button"
            onClick={() => { setMode('url'); setError(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 text-sm px-3 py-1.5 rounded transition-colors',
              mode === 'url'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Link2 className="h-4 w-4" />
            From URL
          </button>
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto" />
                  <p className="text-sm">Click to select an image</p>
                  <p className="text-xs">JPEG, PNG, GIF, WebP — max 10 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground truncate">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        )}

        {/* URL mode */}
        {mode === 'url' && (
          <div className="space-y-2">
            <Label htmlFor="img-url">Image URL</Label>
            <Input
              id="img-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInsertUrl() }}
              autoFocus
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {mode === 'upload' ? (
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? 'Uploading…' : 'Upload & insert'}
            </Button>
          ) : (
            <Button onClick={handleInsertUrl} disabled={!urlValue.trim()}>
              Insert
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
