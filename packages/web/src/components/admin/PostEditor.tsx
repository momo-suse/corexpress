import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
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
  Quote, Undo, Redo, Link2, Image as ImageIcon,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter,
} from 'lucide-react'

interface PostEditorProps {
  content: string
  onChange: (html: string) => void
  className?: string
  postId?: number
}

export default function PostEditor({ content, onChange, className, postId }: PostEditorProps) {
  const { t } = useTranslation()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const editor = useEditor({
    // v3: toolbar active-state buttons need re-renders on every transaction
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        // v3 bundles Link by default — disable it so our configured version takes over
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      // v3: Placeholder moved to @tiptap/extensions consolidated package
      Placeholder.configure({ placeholder: t('admin.editor.placeholder') }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
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

  /** Class for a toolbar button — highlighted when active */
  const tb = (active: boolean) =>
    cn('h-8 w-8 p-0', active ? 'bg-primary text-primary-foreground' : '')

  /** Thin vertical separator between toolbar groups */
  const Sep = () => <div className="w-px bg-border self-stretch mx-0.5" />

  return (
    <div className={cn(
      'rounded-md border border-input bg-background overflow-hidden',
      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
      className,
    )}>
      {/* Toolbar — stopPropagation prevents the outer Dialog from capturing keystrokes */}
      <div
        className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-input bg-muted/30"
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Headings */}
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('heading', { level: 1 }))} title={t('admin.editor.heading1')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('heading', { level: 2 }))} title={t('admin.editor.heading2')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('heading', { level: 3 }))} title={t('admin.editor.heading3')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </Button>

        <Sep />

        {/* Inline marks */}
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('bold'))} title={t('admin.editor.bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('italic'))} title={t('admin.editor.italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('strike'))} title={t('admin.editor.strikethrough')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('code'))} title={t('admin.editor.inlineCode')}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('highlight'))} title={t('admin.editor.highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter className="h-4 w-4" />
        </Button>

        <Sep />

        {/* Blocks */}
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('bulletList'))} title={t('admin.editor.bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('orderedList'))} title={t('admin.editor.orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('blockquote'))} title={t('admin.editor.blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Button>

        <Sep />

        {/* Text alignment */}
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive({ textAlign: 'left' }))} title={t('admin.editor.alignLeft')}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive({ textAlign: 'center' }))} title={t('admin.editor.alignCenter')}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive({ textAlign: 'right' }))} title={t('admin.editor.alignRight')}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive({ textAlign: 'justify' }))} title={t('admin.editor.justify')}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Sep />

        {/* Link & Image */}
        <Button type="button" variant="ghost" size="icon" className={tb(editor.isActive('link'))} title={t('admin.editor.insertLink')}
          onClick={openLinkDialog}>
          <Link2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(false)} title={t('admin.editor.insertImage')}
          onClick={() => setImageDialogOpen(true)}>
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Sep />

        {/* History */}
        <Button type="button" variant="ghost" size="icon" className={tb(false)} title={t('admin.editor.undo')}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tb(false)} title={t('admin.editor.redo')}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor area — clicking anywhere (including padding) focuses the editor */}
      <div
        className="cursor-text min-h-[300px]"
        onClick={(e) => {
          // Only force-focus if the click landed on the wrapper, not on ProseMirror text
          if (!(e.target as Element).closest('.ProseMirror')) {
            editor.commands.focus('end')
          }
        }}
      >
        <EditorContent
          editor={editor}
          className="p-4 prose prose-sm max-w-none"
        />
      </div>

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={(v) => !v && setLinkDialogOpen(false)}>
        <DialogContent className="max-w-sm" onKeyDown={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {t('admin.editor.insertLinkTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">{t('admin.editor.linkUrl')}</Label>
            <Input
              id="link-url"
              type="url"
              placeholder={t('admin.editor.linkPlaceholder')}
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') applyLink() }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{t('admin.editor.linkHint')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={applyLink}>{t('admin.editor.apply')}</Button>
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
