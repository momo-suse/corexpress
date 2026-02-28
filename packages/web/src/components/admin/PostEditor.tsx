import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import ImageUploadDialog from './ImageUploadDialog'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Undo, Redo, Link2, Image as ImageIcon, Heading1, Heading2, Heading3,
} from 'lucide-react'

interface PostEditorProps {
  content: string
  onChange: (html: string) => void
  className?: string
  postId?: number
}

export default function PostEditor({ content, onChange, className, postId }: PostEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Start writing your post…' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  function openLinkDialog() {
    const existing = editor!.getAttributes('link').href ?? ''
    setLinkValue(existing)
    setLinkDialogOpen(true)
  }

  function applyLink() {
    if (linkValue.trim() === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor!.chain().focus().extendMarkRange('link').setLink({ href: linkValue.trim() }).run()
    }
    setLinkDialogOpen(false)
    setLinkValue('')
  }

  function insertImage(url: string) {
    editor!.chain().focus().setImage({ src: url }).run()
  }

  const tb = (active: boolean) =>
    cn('h-8 w-8 p-0', active ? 'bg-primary text-primary-foreground' : '')

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar — stopPropagation prevents the outer Dialog from capturing these clicks */}
      <div
        className="flex flex-wrap gap-1 p-2 border-b bg-muted/30"
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Headings */}
        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        ><Heading1 className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        ><Heading2 className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        ><Heading3 className="h-4 w-4" /></Button>

        <div className="w-px bg-border mx-1" />

        {/* Inline marks */}
        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('bold'))}
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        ><Bold className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('italic'))}
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        ><Italic className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('strike'))}
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        ><Strikethrough className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('code'))}
          title="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
        ><Code className="h-4 w-4" /></Button>

        <div className="w-px bg-border mx-1" />

        {/* Blocks */}
        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('bulletList'))}
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        ><List className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('orderedList'))}
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        ><ListOrdered className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('blockquote'))}
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        ><Quote className="h-4 w-4" /></Button>

        <div className="w-px bg-border mx-1" />

        {/* Link & Image */}
        <Button
          type="button" variant="ghost" size="icon"
          className={tb(editor.isActive('link'))}
          title="Insert / edit link"
          onClick={openLinkDialog}
        ><Link2 className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(false)}
          title="Insert image"
          onClick={() => setImageDialogOpen(true)}
        ><ImageIcon className="h-4 w-4" /></Button>

        <div className="w-px bg-border mx-1" />

        {/* History */}
        <Button
          type="button" variant="ghost" size="icon"
          className={tb(false)}
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        ><Undo className="h-4 w-4" /></Button>

        <Button
          type="button" variant="ghost" size="icon"
          className={tb(false)}
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        ><Redo className="h-4 w-4" /></Button>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="min-h-[300px] p-4 prose prose-sm max-w-none focus-within:outline-none"
      />

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={(v) => !v && setLinkDialogOpen(false)}>
        <DialogContent className="max-w-sm" onKeyDown={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Insert link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://example.com"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') applyLink() }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Leave empty to remove the link.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={applyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image upload dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={insertImage}
        postId={postId}
      />
    </div>
  )
}
