import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import PostEditor from '@/components/admin/PostEditor'
import { usePosts, useMutatePost } from '@/hooks/usePosts'
import { useComments, useMutateComment } from '@/hooks/useComments'
import { useSettings } from '@/hooks/useSettings'
import { useTags } from '@/hooks/useTags'
import ChipInput from '@/components/admin/about/ChipInput'
import { getPost, createTranslation, updateTranslation, deleteTranslation } from '@/api/posts'
import { uploadImage } from '@/api/images'
import { getComments } from '@/api/comments'
import { toast } from '@/hooks/useToast'
import {
  FileText, MessageCircle, Check, ArrowLeft, Plus, Edit3,
  Trash2, X, Upload, AlertTriangle, Languages,
} from 'lucide-react'
import type { Post } from '@/types/api'

// ── Types ────────────────────────────────────────────────────────────────────

type View = 'list' | 'editor'

interface PostForm {
  tags: string
  reading_time: string
  status: 'draft' | 'published'
  featured_image_id: number | null
  featured_image_url: string | null
  map_embed_url: string
  _imageFile: File | null
  _imagePreview: string | null
}

interface LangEntry {
  title: string
  content: string
  excerpt: string
}

const EMPTY_FORM: PostForm = {
  tags: '', reading_time: '', status: 'draft',
  featured_image_id: null, featured_image_url: null,
  map_embed_url: '',
  _imageFile: null, _imagePreview: null,
}

const EMPTY_LANG: LangEntry = { title: '', content: '', excerpt: '' }

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
] as const

const LANG_LABELS: Record<string, string> = { en: 'English', es: 'Español', ja: '日本語' }
const SUPPORTED_LOCALES = ['en', 'es', 'ja']

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

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

  // ── Language content state ────────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState<string>('en')
  const [langContent, setLangContent] = useState<Record<string, LangEntry>>({})

  // ── Drawer state ────────────────────────────────────────────────────────────
  const [editLoading, setEditLoading] = useState(false)
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
  const { data: popularTagsData } = useTags(6)
  const popularTags = popularTagsData?.data ?? []

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalPosts = postsData?.meta.total ?? 0
  const publishedPosts = publishedData?.meta.total ?? 0
  const pendingCount = pendingCommentsData?.meta.total ?? 0
  const pendingComments = pendingCommentsData?.data ?? []
  const displayImage = form._imagePreview ?? form.featured_image_url
  const commentsEnabled = (settingsData?.data.comments_enabled ?? '1') === '1'
  const baseLocale = editingPost?.base_locale
    ?? (settingsData?.data as Record<string, string> | undefined)?.app_locale
    ?? 'en'

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function updateLangField(locale: string, field: keyof LangEntry, value: string) {
    setLangContent((prev) => ({
      ...prev,
      [locale]: { ...prev[locale] ?? EMPTY_LANG, [field]: value },
    }))
  }

  // ── Handlers: editor ────────────────────────────────────────────────────────
  function openCreate() {
    const locale = (settingsData?.data as Record<string, string> | undefined)?.app_locale ?? 'en'
    setEditingPost(null)
    setForm(EMPTY_FORM)
    setLangContent({ [locale]: { ...EMPTY_LANG } })
    setActiveLocale(locale)
    setView('editor')
  }

  async function openEdit(post: Post) {
    setEditLoading(true)
    try {
      const result = await getPost(post.slug)
      const full = result.data
      const appLocale = (settingsData?.data as Record<string, string> | undefined)?.app_locale ?? 'en'
      const postBaseLocale = full.base_locale ?? appLocale
      setEditingPost(full)
      setForm({
        tags: full.tags ?? '',
        reading_time: full.reading_time ?? '',
        status: full.status,
        featured_image_id: full.featured_image_id,
        featured_image_url: full.featured_image_url,
        map_embed_url: full.map_embed_url ?? '',
        _imageFile: null,
        _imagePreview: null,
      })
      const lc: Record<string, LangEntry> = {}
      lc[postBaseLocale] = { title: full.title, content: full.content, excerpt: full.excerpt ?? '' }
      for (const tr of full.translations ?? []) {
        lc[tr.locale] = { title: tr.title, content: tr.content, excerpt: tr.excerpt ?? '' }
      }
      setLangContent(lc)
      setActiveLocale(appLocale)
      setView('editor')
    } catch {
      toast({ title: t('admin.dashboard.failedToLoad'), variant: 'destructive' })
    } finally {
      setEditLoading(false)
    }
  }

  function closeEditor() {
    setView('list')
    setEditingPost(null)
    setForm(EMPTY_FORM)
    setLangContent({})
    setActiveLocale('en')
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
    const locale = editingPost?.base_locale
      ?? (settingsData?.data as Record<string, string> | undefined)?.app_locale
      ?? 'en'
    const baseLang = langContent[locale] ?? EMPTY_LANG

    if (!baseLang.title.trim()) {
      toast({ title: t('admin.dashboard.titleRequired'), variant: 'destructive' })
      return
    }

    let imageId = form.featured_image_id

    if (form._imageFile) {
      try {
        const result = await uploadImage(form._imageFile)
        imageId = result.data.id
      } catch {
        toast({ title: t('admin.dashboard.imageUploadFailed'), variant: 'destructive' })
        return
      }
    }

    const payload = {
      title: baseLang.title,
      content: baseLang.content,
      excerpt: baseLang.excerpt || null,
      tags: form.tags || null,
      reading_time: form.reading_time.trim() || null,
      map_embed_url: form.map_embed_url.trim() || null,
      featured_image_id: imageId,
      status,
    }

    try {
      let postId: number
      if (editingPost) {
        await update.mutateAsync({ id: editingPost.id, data: payload })
        postId = editingPost.id
        toast({ title: t('admin.dashboard.postUpdated') })
      } else {
        const result = await create.mutateAsync(payload)
        postId = result.data.id
        toast({ title: t('admin.dashboard.postCreated') })
      }

      // Save / delete non-base locale translations
      for (const loc of SUPPORTED_LOCALES) {
        if (loc === locale) continue
        const tr = langContent[loc]
        const existingTr = editingPost?.translations?.find((x) => x.locale === loc)
        const hasContent = !!(tr?.title?.trim() && tr?.content?.trim())

        if (hasContent) {
          if (existingTr) {
            await updateTranslation(postId, loc, { title: tr.title, content: tr.content, excerpt: tr.excerpt || null })
          } else {
            await createTranslation(postId, { locale: loc, title: tr.title, content: tr.content, excerpt: tr.excerpt || null })
          }
        } else if (existingTr) {
          await deleteTranslation(postId, loc)
        }
      }

      closeEditor()
    } catch {
      toast({ title: t('admin.dashboard.failedToSave'), variant: 'destructive' })
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
      toast({ title: t('admin.dashboard.commentApproved') })
    } catch {
      toast({ title: t('admin.dashboard.failedToApprove'), variant: 'destructive' })
    }
  }

  async function handleSpamComment(id: number) {
    try {
      await updateComment.mutateAsync({ id, status: 'spam' })
      toast({ title: t('admin.dashboard.commentSpam') })
    } catch {
      toast({ title: t('admin.dashboard.failedToUpdate'), variant: 'destructive' })
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
        toast({ title: t('admin.dashboard.postDeleted') })
        qc.invalidateQueries({ queryKey: ['comments'] })
      } else {
        await removeComment.mutateAsync(confirmId)
        toast({ title: t('admin.dashboard.commentDeleted') })
      }
    } catch {
      toast({ title: t('admin.dashboard.failedToDelete'), variant: 'destructive' })
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
              title={t('admin.dashboard.backToDashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {view === 'editor' ? (editingPost ? t('admin.dashboard.editPost') : t('admin.dashboard.createPost')) : t('admin.dashboard.title')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {view === 'list' && (
            <Button onClick={openCreate} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.dashboard.newPost')}
            </Button>
          )}
          {view === 'editor' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
                {t('admin.dashboard.saveDraft')}
              </Button>
              <Button size="sm" onClick={() => handleSave('published')} disabled={saving} className="gap-2">
                <Check className="h-4 w-4" />
                {t('admin.dashboard.publish')}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 pb-12">

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 flex flex-col gap-2 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('admin.dashboard.totalPosts')}</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-3xl font-bold">{totalPosts}</span>
            </div>
            <div className="p-5 flex flex-col gap-2 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('admin.dashboard.published')}</span>
                <Check className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-3xl font-bold">{publishedPosts}</span>
            </div>
            <div className="p-5 flex flex-col gap-2 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('admin.dashboard.pendingComments')}</span>
                <MessageCircle className={`h-4 w-4 ${commentsEnabled ? 'text-muted-foreground' : 'text-amber-500'}`} />
              </div>
              <span className="text-3xl font-bold">{pendingCount}</span>
              {!commentsEnabled && (
                <a
                  href="/cx-admin/settings"
                  className="text-xs text-amber-500 hover:text-amber-600 transition-colors -mt-1"
                >
                  {t('admin.dashboard.disabledEnableSettings')}
                </a>
              )}
            </div>
          </section>

          {/* Quick Actions: Pending Comments */}
          {commentsEnabled && pendingComments.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                {t('admin.dashboard.quickActionPending')}
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
                        <X className="h-3.5 w-3.5" /> {t('admin.dashboard.reject')}
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => handleApproveComment(comment.id)}
                      >
                        <Check className="h-3.5 w-3.5" /> {t('admin.dashboard.approve')}
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
              {t('admin.dashboard.yourPosts')}
            </h2>

            {postsLoading && <LoadingSpinner className="py-12" />}

            {postsData && (
              <>
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-4 p-4 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-6">{t('admin.dashboard.titleCol')}</div>
                    <div className="col-span-2">{t('admin.dashboard.statusCol')}</div>
                    <div className="col-span-2">{t('admin.dashboard.commentsCol')}</div>
                    <div className="col-span-2 text-right">{t('admin.dashboard.actionsCol')}</div>
                  </div>

                  <div className="flex flex-col">
                    {postsData.data.map((post) => (
                      <div
                        key={post.id}
                        className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        {/* Thumbnail + Title + tags */}
                        <div className="col-span-6 flex items-center gap-3 pr-4">
                          {post.featured_image_url ? (
                            <img
                              src={post.featured_image_url}
                              alt=""
                              className="w-10 h-10 rounded-md object-cover shrink-0 border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="font-medium truncate">{post.title}</span>
                            <div className="flex flex-wrap gap-1">
                              {post.tags && post.tags.split(',').map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                  {tag.trim()}
                                </Badge>
                              ))}
                              {(post.translation_locales ?? []).map((loc) => (
                                <span
                                  key={loc}
                                  className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                >
                                  {loc}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="col-span-2">
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status === 'published' ? t('admin.dashboard.statusPublished') : t('admin.dashboard.statusDraft')}
                          </Badge>
                        </div>

                        {/* Comments count → opens drawer */}
                        <div className="col-span-2">
                          <button
                            onClick={() => openDrawer(post.id, post.title)}
                            className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={t('admin.dashboard.viewComments')}
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
                            disabled={editLoading}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                            title={t('common.edit')}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => askDelete('post', post.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {postsData.data.length === 0 && (
                      <div className="p-10 text-center text-sm text-muted-foreground">
                        {t('admin.dashboard.noPostsYet')}
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
                      {t('common.previous')}
                    </Button>
                    <span className="flex items-center text-sm px-2">
                      {postsPage} / {postsData.meta.last_page}
                    </span>
                    <Button
                      variant="outline" size="sm"
                      disabled={postsPage >= postsData.meta.last_page}
                      onClick={() => setPostsPage((p) => p + 1)}
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* ── EDITOR VIEW (two-column) ────────────────────────────────────────── */}
      {view === 'editor' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] lg:divide-x divide-border">

          {/* Left: editor panel */}
          <section className="p-8 lg:p-12 pb-24 space-y-8 overflow-y-auto">

            {/* Language tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setActiveLocale(code)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeLocale === code
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Languages size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Large title */}
            <div>
              <input
                type="text"
                placeholder={`${t('admin.dashboard.titlePlaceholder')} (${activeLocale.toUpperCase()})…`}
                value={langContent[activeLocale]?.title ?? ''}
                onChange={(e) => updateLangField(activeLocale, 'title', e.target.value)}
                className="w-full text-3xl lg:text-4xl font-bold border-none focus:ring-0 p-0 mb-4 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/30"
              />
              <div className="h-0.5 w-12 bg-border" />
            </div>

            {/* Content editor */}
            <div>
              <div onKeyDown={(e) => e.stopPropagation()}>
                <PostEditor
                  key={`${editingPost?.id ?? 'new'}-${activeLocale}`}
                  content={langContent[activeLocale]?.content ?? ''}
                  onChange={(html) => updateLangField(activeLocale, 'content', html)}
                />
              </div>
            </div>
          </section>

          {/* Right: metadata sidebar */}
          <aside className="p-6 space-y-6 border-t lg:border-t-0 overflow-y-auto">

            {/* Featured image */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t('admin.dashboard.featuredImage')} <span className="normal-case font-normal opacity-70">({t('admin.dashboard.featuredImageHint')})</span>
              </label>
              <div className="rounded-xl border bg-card">
                {displayImage ? (
                  <div className="relative p-3">
                    <img src={displayImage} alt="Featured" className="w-full aspect-video rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">{t('admin.dashboard.uploadFeaturedImage')}</span>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                {displayImage && (
                  <div
                    className="px-3 pb-3 pt-1 text-xs text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {t('common.change')}
                  </div>
                )}
              </div>
            </div>

            {/* Excerpt — per language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t('admin.dashboard.excerpt')} <span className="normal-case font-normal opacity-70">({t('common.optional')})</span>
              </label>
              <textarea
                rows={3}
                placeholder={t('admin.dashboard.excerptPlaceholder')}
                value={langContent[activeLocale]?.excerpt ?? ''}
                onChange={(e) => updateLangField(activeLocale, 'excerpt', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Tags — shared */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t('admin.dashboard.tags')}
              </label>
              <ChipInput
                value={form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)}
                onChange={(chips) => setForm((f) => ({ ...f, tags: chips.join(', ') }))}
                placeholder={t('admin.dashboard.tagsPlaceholder')}
              />
              {(() => {
                const currentChips = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
                const available = popularTags.filter(({ tag }) => !currentChips.includes(tag))
                if (available.length === 0) return null
                return (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-muted-foreground">{t('admin.dashboard.popularTags')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {available.map(({ tag }) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            tags: [...currentChips, tag].join(', '),
                          }))}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Reading time — shared */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t('admin.dashboard.readingTime')} <span className="normal-case font-normal opacity-70">({t('admin.dashboard.readingTimeHint')})</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="5 min"
                value={form.reading_time}
                onChange={(e) => setForm((f) => ({ ...f, reading_time: e.target.value }))}
              />
            </div>

            {/* Map embed URL — shared */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t('admin.dashboard.mapEmbedUrl')} <span className="normal-case font-normal opacity-70">({t('common.optional')})</span>
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="https://www.google.com/maps/embed?pb=…"
                value={form.map_embed_url}
                onChange={(e) => setForm((f) => ({ ...f, map_embed_url: e.target.value }))}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground italic">
                {t('admin.dashboard.mapEmbedUrlHint')}
              </p>
            </div>

            {/* Language progress panel */}
            <div className="p-4 bg-muted/40 rounded-xl border border-border">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <Languages size={14} /> {t('admin.dashboard.translations')}
              </h4>
              <div className="space-y-2">
                {LOCALES.map(({ code, label }) => {
                  const isBase = code === baseLocale
                  const hasSavedContent = isBase
                    ? !!editingPost
                    : !!editingPost?.translations?.find((tr) => tr.locale === code)
                  return (
                    <div key={code} className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground font-medium">
                        {label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        hasSavedContent
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {hasSavedContent ? t('common.ready') : t('common.empty')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </aside>
        </div>
      )}

      {/* ── EDITOR FOOTER ──────────────────────────────────────────────────── */}
      {view === 'editor' && (
        <footer className="sticky bottom-0 z-10 bg-card border-t px-6 py-2 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest shrink-0">
          <span>{t('admin.dashboard.editing')}: {LANG_LABELS[activeLocale] ?? activeLocale}</span>
          <span>
            {(langContent[activeLocale]?.content ?? '').replace(/<[^>]+>/g, '').length}{' '}
            {t('admin.dashboard.characters')}
          </span>
        </footer>
      )}

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
            <h2 className="text-lg font-bold">{t('admin.dashboard.moderation')}</h2>
            <p className="text-sm mt-1 text-muted-foreground">
              {t('admin.dashboard.viewingPost')} <span className="font-medium">"{drawerPostTitle}"</span>
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
              <p>{t('admin.dashboard.noCommentsOnPost')}</p>
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
                        {t('admin.dashboard.statusPending')}
                      </span>
                    )}
                    {comment.status === 'approved' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {t('admin.dashboard.statusApproved')}
                      </span>
                    )}
                    {comment.status === 'spam' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {t('admin.dashboard.statusSpam')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{comment.content}</p>

                <div className="flex items-center gap-2 justify-end">
                  {comment.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleApproveComment(comment.id)}
                    >
                      <Check className="h-3.5 w-3.5" /> {t('admin.dashboard.approve')}
                    </Button>
                  )}
                  {comment.status !== 'spam' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 text-amber-600 border-amber-300/50 hover:bg-amber-50"
                      onClick={() => handleSpamComment(comment.id)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> {t('admin.dashboard.spam')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => askDelete('comment', comment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CONFIRM DIALOG ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmType === 'post' ? t('admin.dashboard.deletePostTitle') : t('admin.dashboard.deleteCommentTitle')}
        description={confirmType === 'post' ? t('admin.dashboard.deletePostDescription') : t('admin.dashboard.deleteCommentDescription')}
        confirmLabel={t('common.delete')}
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
      />

    </div>
  )
}
