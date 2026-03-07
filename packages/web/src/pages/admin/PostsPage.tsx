import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PostEditor from '@/components/admin/PostEditor'
import ChipInput from '@/components/admin/about/ChipInput'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { usePosts, useMutatePost } from '@/hooks/usePosts'
import { useTags } from '@/hooks/useTags'
import { uploadImage } from '@/api/images'
import { toast } from '@/hooks/useToast'
import { Pencil, Trash2, Plus, Upload, X } from 'lucide-react'
import type { Post } from '@/types/api'

interface PostForm {
  title: string
  tags: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
  featured_image_id: number | null
  featured_image_url: string | null
  map_embed_url: string
  /** Local preview for a newly selected file */
  _imageFile: File | null
  _imagePreview: string | null
}

const EMPTY_FORM: PostForm = {
  title: '', tags: '', excerpt: '', content: '', status: 'draft',
  featured_image_id: null, featured_image_url: null,
  map_embed_url: '',
  _imageFile: null, _imagePreview: null,
}

export default function PostsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePosts(page, true)
  const { create, update, remove } = useMutatePost()
  const { data: tagsData } = useTags(6)
  const popularTags = tagsData?.data ?? []

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [form, setForm] = useState<PostForm>(EMPTY_FORM)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(post: Post) {
    setEditing(post)
    setForm({
      title: post.title,
      tags: post.tags ?? '',
      excerpt: post.excerpt ?? '',
      content: post.content,
      status: post.status,
      featured_image_id: post.featured_image_id,
      featured_image_url: post.featured_image_url,
      map_embed_url: post.map_embed_url ?? '',
      _imageFile: null,
      _imagePreview: null,
    })
    setOpen(true)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) =>
        setForm((f) => ({
          ...f,
          _imageFile: file,
          _imagePreview: ev.target?.result as string,
        }))
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setForm((f) => ({
      ...f,
      featured_image_id: null,
      featured_image_url: null,
      _imageFile: null,
      _imagePreview: null,
    }))
  }

  async function handleSave() {
    let imageId = form.featured_image_id

    // Upload new image if selected
    if (form._imageFile) {
      try {
        const result = await uploadImage(form._imageFile)
        imageId = result.data.id
      } catch {
        toast({ title: 'Failed to upload image.', variant: 'destructive' })
        return
      }
    }

    const payload = {
      ...form,
      excerpt: form.excerpt || null,
      tags: form.tags || null,
      map_embed_url: form.map_embed_url.trim() || null,
      featured_image_id: imageId,
    }
    // Remove internal fields
    delete (payload as any)._imageFile
    delete (payload as any)._imagePreview
    delete (payload as any).featured_image_url

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload })
        toast({ title: 'Post updated.' })
      } else {
        await create.mutateAsync(payload)
        toast({ title: 'Post created.' })
      }
      setOpen(false)
    } catch {
      toast({ title: 'Failed to save post.', variant: 'destructive' })
    }
  }

  function askDelete(id: number) {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (deletingId === null) return
    setConfirmOpen(false)
    try {
      await remove.mutateAsync(deletingId)
      toast({ title: 'Post deleted.' })
    } catch {
      toast({ title: 'Failed to delete post.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const saving = create.isPending || update.isPending

  // Current image to display (new upload preview takes priority)
  const displayImage = form._imagePreview ?? form.featured_image_url

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New post
        </Button>
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Title</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Upload className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.tags
                      ? post.tags.split(',').map((t) => (
                        <Badge key={t} variant="outline" className="mr-1 text-xs">{t.trim()}</Badge>
                      ))
                      : <span className="text-muted-foreground/50">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => askDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No posts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-sm px-2">
                {page} / {data.meta.last_page}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit post' : 'New post'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Post title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as PostForm['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <ChipInput
                  value={form.tags.split(',').map((t) => t.trim()).filter(Boolean)}
                  onChange={(chips) => setForm((f) => ({ ...f, tags: chips.join(', ') }))}
                  placeholder="php, design, tutorial"
                />
                {popularTags.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Tags populares</p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.map(({ tag }) => {
                        const currentChips = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
                        const isAdded = currentChips.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (!isAdded) {
                                setForm((f) => ({
                                  ...f,
                                  tags: [...currentChips, tag].join(', '),
                                }))
                              }
                            }}
                            className={`text-xs px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                              isAdded
                                ? 'bg-primary/10 text-primary cursor-default'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Excerpt (optional)</Label>
              <Input
                id="post-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Short description shown in post list"
              />
            </div>

            {/* Featured image upload */}
            <div className="space-y-2">
              <Label>Featured image <span className="text-xs text-muted-foreground">(optional — shown as thumbnail in post list)</span></Label>
              {displayImage ? (
                <div className="relative inline-block">
                  <img src={displayImage} alt="Featured" className="max-h-32 rounded object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <div className="space-y-1 text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto" />
                    <p className="text-sm">Click to upload a featured image</p>
                  </div>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              {/* key forces Tiptap to remount with fresh content when switching posts */}
              <div onKeyDown={(e) => e.stopPropagation()}>
                <PostEditor
                  key={editing?.id ?? 'new'}
                  content={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                />
              </div>
            </div>

            {/* Map embed URL */}
            <div className="space-y-2">
              <Label htmlFor="post-map">
                Map embed URL{' '}
                <span className="text-xs text-muted-foreground">(optional — paste the embed URL from Google Maps or OpenStreetMap)</span>
              </Label>
              <Input
                id="post-map"
                type="url"
                value={form.map_embed_url}
                onChange={(e) => setForm((f) => ({ ...f, map_embed_url: e.target.value }))}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-xs text-muted-foreground">
                In Google Maps: Share → Embed a map → copy the <code className="bg-muted px-1 rounded">src</code> URL from the iframe code.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete post"
        description="This action cannot be undone. The post and all its comments will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />
    </div>
  )
}
