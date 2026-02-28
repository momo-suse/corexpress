import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PostEditor from '@/components/admin/PostEditor'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { usePosts, useMutatePost } from '@/hooks/usePosts'
import { toast } from '@/hooks/useToast'
import { Pencil, Trash2, Plus } from 'lucide-react'
import type { Post } from '@/types/api'

interface PostForm {
  title: string
  tags: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
}

const EMPTY_FORM: PostForm = { title: '', tags: '', excerpt: '', content: '', status: 'draft' }

export default function PostsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePosts(page, true)
  const { create, update, remove } = useMutatePost()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [form, setForm] = useState<PostForm>(EMPTY_FORM)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

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
    })
    setOpen(true)
  }

  async function handleSave() {
    const payload = { ...form, excerpt: form.excerpt || null, tags: form.tags || null }
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
                <Label htmlFor="post-tags">Tags</Label>
                <Input
                  id="post-tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="php, design, tutorial"
                />
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
