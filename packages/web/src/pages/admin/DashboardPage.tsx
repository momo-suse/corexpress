import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import PostEditor from '@/components/admin/PostEditor'
import { usePosts, useMutatePost } from '@/hooks/usePosts'
import { useComments, useMutateComment } from '@/hooks/useComments'
import { useSettings } from '@/hooks/useSettings'
import { uploadImage } from '@/api/images'
import { getComments } from '@/api/comments'
import { toast } from '@/hooks/useToast'
import {
  FileText, MessageCircle, Check, ArrowLeft, Plus, Edit3,
  Trash2, X, Upload, AlertTriangle,
} from 'lucide-react'
import type { Post } from '@/types/api'

// ── Types ────────────────────────────────────────────────────────────────────

type View = 'list' | 'editor'

interface PostForm {
  title: string
  tags: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
  featured_image_id: number | null
  featured_image_url: string | null
  map_embed_url: string
  _imageFile: File | null
  _imagePreview: string | null
}

const EMPTY_FORM: PostForm = {
  title: '', tags: '', excerpt: '', content: '', status: 'draft',
  featured_image_id: null, featured_image_url: null,
  map_embed_url: '',
  _imageFile: null, _imagePreview: null,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()

  // ── Settings / first-run guard ──────────────────────────────────────────────
  const { data: settingsData, isLoading: settingsLoading, isFetching: settingsFetching } = useSettings()

  useEffect(() => {
    if (!settingsLoading && !settingsFetching && settingsData?.data.setup_complete !== '1') {
      navigate('/cx-admin/setup', { replace: true })
    }
  }, [settingsData, settingsLoading, settingsFetching, navigate])

  // ── View state ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('list')
  const [postsPage, setPostsPage] = useState(1)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [form, setForm] = useState<PostForm>(EMPTY_FORM)

  // ── Drawer state ────────────────────────────────────────────────────────────
  const [drawerPostId, setDrawerPostId] = useState<number | null>(null)
  const [drawerPostTitle, setDrawerPostTitle] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // ── Delete confirmation ─────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'post' | 'comment'>('post')
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: postsData, isLoading: postsLoading } = usePosts(postsPage, true)
  const { data: publishedData } = usePosts(1, false)
  const { data: pendingCommentsData } = useComments({ status: 'pending' })

  const { data: drawerCommentsData } = useQuery({
    queryKey: ['comments', { post_id: drawerPostId }],
    queryFn: () => getComments({ post_id: drawerPostId! }),
    enabled: drawerPostId !== null,
  })

  // ── Mutations ───────────────────────────────────────────────────────────────
  const { create, update, remove: removePost } = useMutatePost()
  const { update: updateComment, remove: removeComment } = useMutateComment()
  const qc = useQueryClient()

  const saving = create.isPending || update.isPending

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalPosts = postsData?.meta.total ?? 0
  const publishedPosts = publishedData?.meta.total ?? 0
  const pendingCount = pendingCommentsData?.meta.total ?? 0
  const pendingComments = pendingCommentsData?.data ?? []
  const displayImage = form._imagePreview ?? form.featured_image_url

  // ── Handlers: editor ────────────────────────────────────────────────────────
  function openCreate() {
    setEditingPost(null)
    setForm(EMPTY_FORM)
    setView('editor')
  }

  function openEdit(post: Post) {
    setEditingPost(post)
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
    setView('editor')
  }

  function closeEditor() {
    setView('list')
    setEditingPost(null)
    setForm(EMPTY_FORM)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) =>
        setForm((f) => ({ ...f, _imageFile: file, _imagePreview: ev.target?.result as string }))
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setForm((f) => ({
      ...f,
      featured_image_id: null, featured_image_url: null,
      _imageFile: null, _imagePreview: null,
    }))
  }

  async function handleSave(status: 'draft' | 'published') {
    if (!form.title.trim()) {
      toast({ title: 'Title is required.', variant: 'destructive' })
      return
    }

    let imageId = form.featured_image_id

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
      title: form.title,
      content: form.content,
      excerpt: form.excerpt || null,
      tags: form.tags || null,
      map_embed_url: form.map_embed_url.trim() || null,
      featured_image_id: imageId,
      status,
    }

    try {
      if (editingPost) {
        await update.mutateAsync({ id: editingPost.id, data: payload })
        toast({ title: 'Post updated.' })
      } else {
        await create.mutateAsync(payload)
        toast({ title: 'Post created.' })
      }
      closeEditor()
    } catch {
      toast({ title: 'Failed to save post.', variant: 'destructive' })
    }
  }

  // ── Handlers: drawer ────────────────────────────────────────────────────────
  function openDrawer(postId: number, postTitle: string) {
    setDrawerPostId(postId)
    setDrawerPostTitle(postTitle)
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setTimeout(() => setDrawerPostId(null), 300)
  }

  // ── Handlers: comments ──────────────────────────────────────────────────────
  async function handleApproveComment(id: number) {
    try {
      await updateComment.mutateAsync({ id, status: 'approved' })
      toast({ title: 'Comment approved.' })
    } catch {
      toast({ title: 'Failed to approve comment.', variant: 'destructive' })
    }
  }

  async function handleSpamComment(id: number) {
    try {
      await updateComment.mutateAsync({ id, status: 'spam' })
      toast({ title: 'Comment marked as spam.' })
    } catch {
      toast({ title: 'Failed to update comment.', variant: 'destructive' })
    }
  }

  // ── Handlers: delete ────────────────────────────────────────────────────────
  function askDelete(type: 'post' | 'comment', id: number) {
    setConfirmType(type)
    setConfirmId(id)
    setConfirmOpen(true)
  }

  async function executeDelete() {
    if (confirmId === null) return
    setConfirmOpen(false)
    try {
      if (confirmType === 'post') {
        await removePost.mutateAsync(confirmId)
        toast({ title: 'Post deleted.' })
        qc.invalidateQueries({ queryKey: ['comments'] })
      } else {
        await removeComment.mutateAsync(confirmId)
        toast({ title: 'Comment deleted.' })
      }
    } catch {
      toast({ title: 'Failed to delete.', variant: 'destructive' })
    } finally {
      setConfirmId(null)
    }
  }

  // ── Loading guard ────────────────────────────────────────────────────────────
  if (settingsLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-full flex flex-col">

      {/* ── STICKY HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          {view === 'editor' && (
            <button
              onClick={closeEditor}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {view === 'editor' ? (editingPost ? 'Edit Post' : 'Create New Post') : 'Dashboard'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {view === 'list' && (
            <Button onClick={openCreate} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          )}
          {view === 'editor' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
                Save Draft
              </Button>
              <Button size="sm" onClick={() => handleSave('published')} disabled={saving} className="gap-2">
                <Check className="h-4 w-4" />
                Publish
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────────── */}
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8 pb-12">

        {/* ===== LIST VIEW ===== */}
        {view === 'list' && (
          <>
            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 flex flex-col gap-2 rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Posts</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-3xl font-bold">{totalPosts}</span>
              </div>
              <div className="p-5 flex flex-col gap-2 rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Published</span>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-3xl font-bold">{publishedPosts}</span>
              </div>
              <div className="p-5 flex flex-col gap-2 rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Pending Comments</span>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-3xl font-bold">{pendingCount}</span>
              </div>
            </section>

            {/* Quick Actions: Pending Comments */}
            {pendingComments.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Quick Action: Pending
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingComments.map((comment) => (
                    <div key={comment.id} className="p-4 flex flex-col gap-3 rounded-xl border bg-card shadow-sm">
                      <div>
                        <p className="text-sm font-semibold">{comment.author_name}</p>
                        <p className="text-xs text-muted-foreground">
                          on <span className="font-medium">"{comment.post?.title ?? `Post #${comment.post_id}`}"</span>
                        </p>
                      </div>
                      <p className="text-sm italic border-l-2 border-border pl-3 py-1">
                        "{comment.content}"
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => askDelete('comment', comment.id)}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => handleApproveComment(comment.id)}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Posts Table */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Your Posts
              </h2>

              {postsLoading && <LoadingSpinner className="py-12" />}

              {postsData && (
                <>
                  <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="col-span-6">Title</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Comments</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className="flex flex-col">
                      {postsData.data.map((post) => (
                        <div
                          key={post.id}
                          className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* Title + tags */}
                          <div className="col-span-6 flex flex-col gap-1.5 pr-4">
                            <span className="font-medium truncate">{post.title}</span>
                            {post.tags && (
                              <div className="flex flex-wrap gap-1">
                                {post.tags.split(',').map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Status badge */}
                          <div className="col-span-2">
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status === 'published' ? 'Published' : 'Draft'}
                            </Badge>
                          </div>

                          {/* Comments count → opens drawer */}
                          <div className="col-span-2">
                            <button
                              onClick={() => openDrawer(post.id, post.title)}
                              className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="View comments"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">{post.comments_count ?? 0}</span>
                              {(post.comments_pending_count ?? 0) > 0 && (
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                              )}
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(post)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => askDelete('post', post.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {postsData.data.length === 0 && (
                        <div className="p-10 text-center text-sm text-muted-foreground">
                          No posts yet. Start writing!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pagination */}
                  {postsData.meta.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline" size="sm"
                        disabled={postsPage <= 1}
                        onClick={() => setPostsPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center text-sm px-2">
                        {postsPage} / {postsData.meta.last_page}
                      </span>
                      <Button
                        variant="outline" size="sm"
                        disabled={postsPage >= postsData.meta.last_page}
                        onClick={() => setPostsPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* ===== EDITOR VIEW ===== */}
        {view === 'editor' && (
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-3 text-lg font-medium border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Post title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="php, design, tutorial"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Excerpt <span className="normal-case font-normal opacity-70">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Short description shown in post list"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Featured Image <span className="normal-case font-normal opacity-70">(optional — shown as thumbnail in post list)</span>
              </label>
              <div className="p-4 rounded-xl border bg-card shadow-sm">
                {displayImage ? (
                  <div className="relative inline-block">
                    <img src={displayImage} alt="Featured" className="max-h-32 rounded-lg object-cover" />
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
                    className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Click to upload a featured image</span>
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
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Content
              </label>
              <div onKeyDown={(e) => e.stopPropagation()}>
                <PostEditor
                  key={editingPost?.id ?? 'new'}
                  content={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                />
              </div>
            </div>

            {/* Map embed URL */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Map Embed URL <span className="normal-case font-normal opacity-70">(optional)</span>
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="https://www.google.com/maps/embed?pb=..."
                value={form.map_embed_url}
                onChange={(e) => setForm((f) => ({ ...f, map_embed_url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                In Google Maps: Share → Embed a map → copy the <code className="bg-muted px-1 rounded">src</code> URL from the iframe code.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── DRAWER OVERLAY ─────────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* ── COMMENTS DRAWER (slides in from right) ─────────────────────────── */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl bg-card border-l transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="px-6 py-5 flex items-start justify-between border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold">Moderation</h2>
            <p className="text-sm mt-1 text-muted-foreground">
              Viewing: <span className="font-medium">"{drawerPostTitle}"</span>
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!drawerCommentsData ? (
            <LoadingSpinner className="py-8" />
          ) : drawerCommentsData.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No comments on this post yet.</p>
            </div>
          ) : (
            drawerCommentsData.data.map((comment) => (
              <div key={comment.id} className="relative p-4 rounded-xl border bg-card">
                {/* Pending indicator bar */}
                {comment.status === 'pending' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 rounded-t-xl" />
                )}

                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{comment.author_name}</span>
                    {comment.status === 'pending' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                    {comment.status === 'approved' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Approved
                      </span>
                    )}
                    {comment.status === 'spam' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Spam
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm mb-4">{comment.content}</p>

                <div className="flex items-center gap-2 pt-3 border-t">
                  {comment.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1.5"
                      onClick={() => handleApproveComment(comment.id)}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {comment.status !== 'spam' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => handleSpamComment(comment.id)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Spam
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => askDelete('comment', comment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRMATION ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${confirmType === 'post' ? 'Post' : 'Comment'}`}
        description={
          confirmType === 'post'
            ? 'This action cannot be undone. The post and all its comments will be permanently deleted.'
            : 'This comment will be permanently deleted.'
        }
        confirmLabel="Delete"
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmId(null) }}
      />
    </div>
  )
}
