import { useState, useEffect, useRef } from 'react'
import {
  ImageIcon,
  User,
  Share2,
  MessageSquare,
  Upload,
  X,
  Briefcase,
  Code2,
  GraduationCap,
  Quote,
  Images,
  Search,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { useBlogPage, useAboutPage, usePostDetailPage } from '@/hooks/useBlogPage'
import { updatePageComponent } from '@/api/pages'
import { uploadImage } from '@/api/images'
import { toast } from '@/hooks/useToast'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PostEditor from '@/components/admin/PostEditor'
import ExperienceEditor, { type ExperienceItem } from '@/components/admin/about/ExperienceEditor'
import SkillsEditor, { type SkillGroup } from '@/components/admin/about/SkillsEditor'
import GalleryEditor, { type GalleryItem } from '@/components/admin/about/GalleryEditor'
import EducationEditor, { type EducationItem } from '@/components/admin/about/EducationEditor'
import CertificationsEditor, { type CertItem } from '@/components/admin/about/CertificationsEditor'
import TestimonialsEditor, { type TestimonialItem } from '@/components/admin/about/TestimonialsEditor'
import type { PageComponent, Settings } from '@/types/api'

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'hero' | 'profile' | 'social' | 'comments' | 'search' | 'tags'

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'hero',     label: 'Hero Banner',    Icon: ImageIcon },
  { id: 'profile',  label: 'Profile & About', Icon: User },
  { id: 'social',   label: 'Social Links',   Icon: Share2 },
  { id: 'comments', label: 'Comments',       Icon: MessageSquare },
  { id: 'search',   label: 'Buscador',       Icon: Search },
  { id: 'tags',     label: 'Tags',           Icon: Tag },
]

function parseJSON<T>(value: string | undefined, fallback: T): T {
  try { return JSON.parse(value ?? '[]') as T } catch { return fallback }
}

// ── SectionCard ────────────────────────────────────────────────────────────────
// Used for main-level components (Hero, Profile, Social, Comments global toggle).
// Content is always shown regardless of switch — switch only controls visibility.

interface SectionCardProps {
  title: string
  description: string
  visible: boolean
  onToggle: (v: boolean) => void
  Icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function SectionCard({ title, description, visible, onToggle, Icon, children }: SectionCardProps) {
  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all duration-200',
      visible ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border',
    )}>
      <div className={cn(
        'flex items-center gap-4 px-6 py-4 transition-colors',
        visible ? 'bg-primary/5' : 'bg-card',
      )}>
        <div className={cn(
          'p-2.5 rounded-xl shrink-0 transition-colors',
          visible ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', visible ? 'text-foreground' : 'text-muted-foreground')}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={visible} onCheckedChange={onToggle} />
      </div>
      <div className="px-6 py-5 border-t border-border/60">
        {children}
      </div>
    </div>
  )
}

// ── SubSection ─────────────────────────────────────────────────────────────────
// Used for about page sub-components.
// Collapsed when is_visible=false, expanded when is_visible=true.

interface SubSectionProps {
  title: string
  description: string
  visible: boolean
  onToggle: (v: boolean) => void
  Icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function SubSection({ title, description, visible, onToggle, Icon, children }: SubSectionProps) {
  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all duration-200',
      visible ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border',
    )}>
      <div className={cn(
        'flex items-center gap-4 px-6 py-4 transition-colors cursor-default',
        visible ? 'bg-primary/5' : 'bg-muted/40',
      )}>
        <div className={cn(
          'p-2 rounded-xl shrink-0 transition-colors',
          visible ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', visible ? 'text-foreground' : 'text-muted-foreground')}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={visible} onCheckedChange={onToggle} />
      </div>

      {visible && (
        <div className="px-6 py-5 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Image upload helper ────────────────────────────────────────────────────────

interface ImageUploadProps {
  label: string
  hint?: string
  preview: string | null
  currentUrl: string
  fileRef: React.RefObject<HTMLInputElement | null>
  onClear: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  rounded?: boolean
  maxHeight?: string
}

function ImageUpload({ label, hint, preview, currentUrl, fileRef, onClear, onChange, rounded, maxHeight = 'max-h-32' }: ImageUploadProps) {
  const roundedClass = rounded ? 'rounded-full' : 'rounded-xl'
  return (
    <div className="space-y-2">
      <Label className="text-xs">
        {label}
        {hint && <span className="text-muted-foreground font-normal ml-1">{hint}</span>}
      </Label>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className={cn('object-cover', roundedClass, maxHeight, rounded ? 'w-20 h-20' : 'w-full')} />
          <button type="button" onClick={onClear}
            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : currentUrl ? (
        <div
          className={cn('relative inline-block cursor-pointer group', rounded ? '' : 'w-full')}
          onClick={() => fileRef.current?.click()}
        >
          <img src={currentUrl} alt="" className={cn('object-cover', roundedClass, maxHeight, rounded ? 'w-20 h-20' : 'w-full')} />
          <div className={cn('absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity', roundedClass)}>
            <span className="text-white text-xs font-medium flex items-center gap-1">
              <Upload className="h-3 w-3" /> Change
            </span>
          </div>
        </div>
      ) : (
        <div
          className={cn('border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer gap-1.5', roundedClass, rounded ? 'w-20 h-20' : 'p-6')}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-5 w-5" />
          {!rounded && <p className="text-sm">Click to upload</p>}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif" className="hidden" onChange={onChange} />
    </div>
  )
}

// ── BlogPage ───────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hero')
  const [saving, setSaving] = useState(false)

  const qc = useQueryClient()
  const { data: settingsData, isLoading: settingsLoading } = useSettings()
  const { mutateAsync: saveSettings } = useMutateSettings()
  const { data: homeData,       isLoading: homeLoading }   = useBlogPage()
  const { data: aboutData,      isLoading: aboutLoading }  = useAboutPage()
  const { isLoading: postLoading }   = usePostDetailPage()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<Partial<Settings>>({})
  const [homeVis,  setHomeVis]  = useState<Record<number, boolean>>({})
  const [aboutVis, setAboutVis] = useState<Record<number, boolean>>({})
  // Image files
  const heroFileRef        = useRef<HTMLInputElement>(null)
  const profileFileRef     = useRef<HTMLInputElement>(null)
  const profileCoverRef    = useRef<HTMLInputElement>(null)
  const [heroFile,    setHeroFile]    = useState<File | null>(null)
  const [heroPrev,    setHeroPrev]    = useState<string | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePrev, setProfilePrev] = useState<string | null>(null)
  const [coverFile,   setCoverFile]   = useState<File | null>(null)
  const [coverPrev,   setCoverPrev]   = useState<string | null>(null)

  // About editors
  const [expItems,  setExpItems]  = useState<ExperienceItem[]>([])
  const [skillItems, setSkillItems] = useState<SkillGroup[]>([])
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [eduItems,  setEduItems]  = useState<EducationItem[]>([])
  const [certItems, setCertItems] = useState<CertItem[]>([])
  const [testiItems, setTestiItems] = useState<TestimonialItem[]>([])

  useEffect(() => {
    if (!settingsData?.data) return
    const s = settingsData.data
    setForm(s)
    setExpItems(parseJSON(s.profile_experience, []))
    setSkillItems(parseJSON(s.profile_skills, []))
    setGalleryItems(parseJSON(s.profile_gallery, []))
    setEduItems(parseJSON(s.profile_education, []))
    setCertItems(parseJSON(s.profile_certifications, []))
    setTestiItems(parseJSON(s.profile_testimonials, []))
  }, [settingsData])

  // ── Visibility helpers ──────────────────────────────────────────────────────

  function comp(data: typeof homeData, name: string): PageComponent | undefined {
    return data?.data.components.find(c => c.name === name)
  }

  function homeVisible(name: string): boolean {
    const c = comp(homeData, name)
    if (!c) return false
    return homeVis[c.id] !== undefined ? homeVis[c.id] : c.is_visible
  }
  function aboutVisible(name: string): boolean {
    const c = comp(aboutData, name)
    if (!c) return false  // fallback: disabled by default if not in DB
    return aboutVis[c.id] !== undefined ? aboutVis[c.id] : c.is_visible
  }
  function toggleHome(name: string, val: boolean) {
    const c = comp(homeData, name); if (c) setHomeVis(p => ({ ...p, [c.id]: val }))
  }
  function toggleAbout(name: string, val: boolean) {
    const c = comp(aboutData, name); if (c) setAboutVis(p => ({ ...p, [c.id]: val }))
  }

  function setField(key: keyof Settings, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPrev: (p: string | null) => void,
  ) {
    const file = e.target.files?.[0] ?? null
    setFile(file)
    if (file) {
      const r = new FileReader()
      r.onload = (ev) => setPrev(ev.target?.result as string)
      r.readAsDataURL(file)
    } else setPrev(null)
    e.target.value = ''
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    // Fix 3: validate hero text when hero is active
    if (homeVisible('hero') && !(form.hero_text ?? '').trim()) {
      toast({ title: 'Banner text is required when Hero Banner is active.', variant: 'destructive' })
      setActiveTab('hero')
      setSaving(false)
      return
    }
    try {
      // Visibility updates
      for (const c of homeData?.data.components ?? []) {
        const vis = homeVis[c.id] !== undefined ? homeVis[c.id] : c.is_visible
        if (vis !== c.is_visible) await updatePageComponent(c.id, { is_visible: vis })
      }
      for (const c of aboutData?.data.components ?? []) {
        const vis = aboutVis[c.id] !== undefined ? aboutVis[c.id] : c.is_visible
        if (vis !== c.is_visible) await updatePageComponent(c.id, { is_visible: vis })
      }
      const payload = { ...form }

      // Image uploads
      if (heroFile) {
        const r = await uploadImage(heroFile)
        payload.hero_image_id = String(r.data.id)
        setHeroFile(null); setHeroPrev(null)
      }
      if (profileFile) {
        const r = await uploadImage(profileFile)
        payload.profile_image_id = String(r.data.id)
        setProfileFile(null); setProfilePrev(null)
      }
      if (coverFile) {
        const r = await uploadImage(coverFile)
        payload.profile_cover_id = String(r.data.id)
        setCoverFile(null); setCoverPrev(null)
      }

      // Gallery images
      const resolvedGallery: Omit<GalleryItem, 'pendingFile' | 'previewUrl'>[] = []
      for (const item of galleryItems) {
        let url = item.url
        if (item.pendingFile) { const r = await uploadImage(item.pendingFile); url = r.data.url }
        resolvedGallery.push({ url, title: item.title, description: item.description })
      }
      setGalleryItems(resolvedGallery)

      // Testimonial avatars
      const resolvedTestis: Omit<TestimonialItem, 'pendingAvatar' | 'previewAvatar'>[] = []
      for (const item of testiItems) {
        let avatar = item.avatar
        if (item.pendingAvatar) { const r = await uploadImage(item.pendingAvatar); avatar = r.data.url }
        resolvedTestis.push({ name: item.name, role: item.role, text: item.text, avatar, linkedin: item.linkedin })
      }
      setTestiItems(resolvedTestis)

      // Serialize editors
      payload.profile_experience     = JSON.stringify(expItems)
      payload.profile_skills         = JSON.stringify(skillItems)
      payload.profile_gallery        = JSON.stringify(resolvedGallery)
      payload.profile_education      = JSON.stringify(eduItems)
      payload.profile_certifications = JSON.stringify(certItems)
      payload.profile_testimonials   = JSON.stringify(resolvedTestis)

      await saveSettings(payload as never)
      // Invalidate page queries so visibility changes reflect immediately on return
      await qc.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Blog settings saved.' })
    } catch {
      toast({ title: 'Failed to save.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (settingsLoading || homeLoading || aboutLoading || postLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-full flex flex-col">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure the public blog sections and content.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </header>

      {/* Tab bar */}
      <div className="px-8 border-b bg-card/60 flex gap-0 shrink-0">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto w-full flex-1 space-y-6">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        {activeTab === 'hero' && (
          <>
            <p className="text-sm text-muted-foreground">
              The hero banner is the first thing visitors see at the top of the home page.
            </p>

            <SectionCard
              title="Hero Banner"
              description="Show or hide the banner on the home page"
              visible={homeVisible('hero')}
              onToggle={(v) => toggleHome('hero', v)}
              Icon={ImageIcon}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                  label="Banner image"
                  hint="(1200 × 630 px recommended)"
                  preview={heroPrev}
                  currentUrl={form.hero_image_url ?? ''}
                  fileRef={heroFileRef}
                  onClear={() => { setHeroFile(null); setHeroPrev(null) }}
                  onChange={(e) => handleFile(e, setHeroFile, setHeroPrev)}
                />
                <div className="space-y-2">
                  <Label className="text-xs">Banner text</Label>
                  <Input
                    value={form.hero_text ?? ''}
                    onChange={(e) => setField('hero_text' as keyof Settings, e.target.value)}
                    placeholder="Welcome to my blog"
                  />
                  <p className="text-xs text-muted-foreground">Overlay text displayed on the banner image.</p>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── Profile & About ──────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <>
            <p className="text-sm text-muted-foreground">
              Configure your profile card (shown on home) and the content of each About page section.
            </p>

            {/* Profile card */}
            <SectionCard
              title="Profile card"
              description="The profile widget shown on the home page"
              visible={homeVisible('profile')}
              onToggle={(v) => toggleHome('profile', v)}
              Icon={User}
            >
              <div className="space-y-5">
                {/* Row: photo + fields */}
                <div className="flex gap-5 items-start">
                  <div className="shrink-0">
                    <ImageUpload
                      label="Photo"
                      hint="(1:1)"
                      preview={profilePrev}
                      currentUrl={form.profile_image_url ?? ''}
                      fileRef={profileFileRef}
                      onClear={() => { setProfileFile(null); setProfilePrev(null) }}
                      onChange={(e) => handleFile(e, setProfileFile, setProfilePrev)}
                      rounded
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Name</Label>
                        <Input value={form.profile_name ?? ''} onChange={(e) => setField('profile_name' as keyof Settings, e.target.value)} placeholder="Your name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Professional title</Label>
                        <Input value={form.profile_title ?? ''} onChange={(e) => setField('profile_title' as keyof Settings, e.target.value)} placeholder="Full-stack Developer" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Summary</Label>
                      <Input value={form.profile_summary ?? ''} onChange={(e) => setField('profile_summary' as keyof Settings, e.target.value)} placeholder="A short bio or tagline" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <Label className="text-xs font-medium" htmlFor="avail-sw">Show availability badge</Label>
                        <p className="text-xs text-muted-foreground">Green "Disponible" badge on profile</p>
                      </div>
                      <Switch id="avail-sw" checked={(form.profile_available ?? '0') === '1'} onCheckedChange={(v) => setField('profile_available' as keyof Settings, v ? '1' : '0')} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Extended description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div onKeyDown={(e) => e.stopPropagation()}>
                    <PostEditor key="profile-desc" content={form.profile_description ?? ''} onChange={(html) => setField('profile_description' as keyof Settings, html)} />
                  </div>
                </div>

                {/* Cover image */}
                <div className="pt-3 border-t">
                  <ImageUpload
                    label="Cover image"
                    hint="(About page banner — 1500 × 500 px)"
                    preview={coverPrev}
                    currentUrl={form.profile_cover_url ?? ''}
                    fileRef={profileCoverRef}
                    onClear={() => { setCoverFile(null); setCoverPrev(null) }}
                    onChange={(e) => handleFile(e, setCoverFile, setCoverPrev)}
                    maxHeight="max-h-20"
                  />
                </div>
              </div>
            </SectionCard>

            {/* About page sections — wrapped for overlay when profile is deactivated */}
            <div className={cn('relative space-y-6', !homeVisible('profile') && 'pointer-events-none')}>
              {!homeVisible('profile') && (
                <div className="absolute inset-0 bg-background/70 z-10 flex items-end justify-center pb-6 rounded-2xl">
                  <p className="text-xs text-muted-foreground bg-card border rounded-lg px-3 py-1.5 shadow-sm">
                    Activate the Profile card to edit About page sections
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">About page sections</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Sub-component accordions */}
              <SubSection
                title="Gallery"
                description="Project or photo carousel shown on /about"
                visible={aboutVisible('about-gallery')}
                onToggle={(v) => toggleAbout('about-gallery', v)}
                Icon={Images}
              >
                <GalleryEditor items={galleryItems} onChange={setGalleryItems} />
              </SubSection>

              <SubSection
                title="Experience"
                description="Professional roles, companies, and tech tags"
                visible={aboutVisible('about-experience')}
                onToggle={(v) => toggleAbout('about-experience', v)}
                Icon={Briefcase}
              >
                <ExperienceEditor items={expItems} onChange={setExpItems} />
              </SubSection>

              <SubSection
                title="Skills"
                description="Technical skills grouped by category"
                visible={aboutVisible('about-skills')}
                onToggle={(v) => toggleAbout('about-skills', v)}
                Icon={Code2}
              >
                <SkillsEditor items={skillItems} onChange={setSkillItems} />
              </SubSection>

              <SubSection
                title="Education & Certifications"
                description="Academic background and professional certifications"
                visible={aboutVisible('about-education')}
                onToggle={(v) => toggleAbout('about-education', v)}
                Icon={GraduationCap}
              >
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Education</p>
                    <EducationEditor items={eduItems} onChange={setEduItems} />
                  </div>
                  <div className="border-t pt-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Certifications</p>
                    <CertificationsEditor items={certItems} onChange={setCertItems} />
                  </div>
                </div>
              </SubSection>

              <SubSection
                title="Testimonials"
                description="Recommendations from colleagues and clients"
                visible={aboutVisible('about-testimonials')}
                onToggle={(v) => toggleAbout('about-testimonials', v)}
                Icon={Quote}
              >
                <TestimonialsEditor items={testiItems} onChange={setTestiItems} />
              </SubSection>

              <SubSection
                title="Social Links"
                description="Social network icons shown at the bottom of /about"
                visible={homeVisible('social-links')}
                onToggle={(v) => { toggleHome('social-links', v); toggleAbout('social-links', v) }}
                Icon={Share2}
              >
                <p className="text-sm text-muted-foreground">
                  To edit the social link URLs, go to the <strong>Social Links</strong> tab.
                </p>
              </SubSection>
            </div>
          </>
        )}

        {/* ── Social Links ─────────────────────────────────────────────────── */}
        {activeTab === 'social' && (
          <>
            <p className="text-sm text-muted-foreground">
              Social network links displayed on the blog. Toggle to show or hide the section.
            </p>

            <SectionCard
              title="Social Links"
              description="Show or hide the social links section on the home page"
              visible={homeVisible('social-links')}
              onToggle={(v) => toggleHome('social-links', v)}
              Icon={Share2}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: 'social_linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/...' },
                  { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                  { key: 'social_youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@...' },
                  { key: 'social_facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/...' },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    <Input type="url" value={form[key] ?? ''} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ── Comments ─────────────────────────────────────────────────────── */}
        {activeTab === 'comments' && (
          <>
            <p className="text-sm text-muted-foreground">
              Control whether comments appear on individual post pages.
            </p>

            {/* Global master switch */}
            <div className={cn(
              'rounded-2xl border-2 overflow-hidden transition-all duration-200',
              (form.comments_enabled ?? '1') === '1' ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border',
            )}>
              <div className={cn(
                'flex items-center gap-4 px-6 py-4',
                (form.comments_enabled ?? '1') === '1' ? 'bg-primary/5' : 'bg-card',
              )}>
                <div className={cn(
                  'p-2.5 rounded-xl shrink-0',
                  (form.comments_enabled ?? '1') === '1' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-semibold', (form.comments_enabled ?? '1') === '1' ? 'text-foreground' : 'text-muted-foreground')}>
                    Comments globally enabled
                  </p>
                  <p className="text-xs text-muted-foreground">Master switch — disabling hides all comment sections</p>
                </div>
                <Switch
                  checked={(form.comments_enabled ?? '1') === '1'}
                  onCheckedChange={(v) => setField('comments_enabled' as keyof Settings, v ? '1' : '0')}
                />
              </div>
            </div>

          </>
        )}

        {activeTab === 'search' && (
          <SectionCard
            title="Buscador"
            description="Muestra un campo de búsqueda que filtra publicaciones por título, resumen, contenido o tags."
            visible={homeVisible('search')}
            onToggle={(v) => toggleHome('search', v)}
            Icon={Search}
          >
            <p className="text-sm text-muted-foreground">
              La búsqueda filtra las publicaciones directamente en el servidor. Actívalo para que los visitantes puedan buscar en tu blog.
            </p>
          </SectionCard>
        )}

        {activeTab === 'tags' && (
          <SectionCard
            title="Tag Cloud"
            description="Muestra los tags más utilizados del blog para filtrar publicaciones."
            visible={homeVisible('tag-cloud')}
            onToggle={(v) => toggleHome('tag-cloud', v)}
            Icon={Tag}
          >
            <div className="space-y-3">
              <Label htmlFor="tags-max-count">Número de tags a mostrar</Label>
              <Input
                id="tags-max-count"
                type="number"
                min={1}
                max={20}
                value={form.tags_max_count ?? '6'}
                onChange={(e) => setField('tags_max_count' as keyof Settings, e.target.value)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">Mínimo 1, máximo 20. Ordenados por popularidad.</p>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  )
}
