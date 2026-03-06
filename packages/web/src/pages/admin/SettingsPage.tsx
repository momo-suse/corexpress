import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ExperienceEditor, { type ExperienceItem } from '@/components/admin/about/ExperienceEditor'
import SkillsEditor, { type SkillGroup } from '@/components/admin/about/SkillsEditor'
import GalleryEditor, { type GalleryItem } from '@/components/admin/about/GalleryEditor'
import EducationEditor, { type EducationItem } from '@/components/admin/about/EducationEditor'
import CertificationsEditor, { type CertItem } from '@/components/admin/about/CertificationsEditor'
import TestimonialsEditor, { type TestimonialItem } from '@/components/admin/about/TestimonialsEditor'
import { Switch } from '@/components/ui/switch'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PostEditor from '@/components/admin/PostEditor'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { useBlogPage, useAboutPage } from '@/hooks/useBlogPage'
import { updatePageComponent } from '@/api/pages'
import { uploadImage } from '@/api/images'
import { toast } from '@/hooks/useToast'
import { Upload, X, Globe } from 'lucide-react'
import type { PageComponent, Settings } from '@/types/api'

const COMPONENT_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  profile: 'Profile / About',
  'post-list': 'Post List',
  'social-links': 'Social Links',
  'about-gallery': 'Gallery',
  'about-experience': 'Experience',
  'about-skills': 'Skills',
  'about-education': 'Education',
  'about-testimonials': 'Testimonials',
}

const ALWAYS_ON = new Set(['post-list'])

function parseJSON<T>(value: string | undefined, fallback: T): T {
  try { return JSON.parse(value ?? '[]') as T } catch { return fallback }
}

export default function SettingsPage() {
  const { data, isLoading } = useSettings()
  const { data: pageData, isLoading: pageLoading } = useBlogPage()
  const { data: aboutPageData, isLoading: aboutPageLoading } = useAboutPage()
  const { mutateAsync: save, isPending: saving } = useMutateSettings()

  const [form, setForm] = useState<Partial<Settings>>({})
  const [componentVisibility, setComponentVisibility] = useState<Record<number, boolean>>({})

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [profileCoverFile, setProfileCoverFile] = useState<File | null>(null)
  const [profileCoverPreview, setProfileCoverPreview] = useState<string | null>(null)
  const [aboutComponentVisibility, setAboutComponentVisibility] = useState<Record<number, boolean>>({})

  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>([])
  const [skillsItems, setSkillsItems]         = useState<SkillGroup[]>([])
  const [galleryItems, setGalleryItems]       = useState<GalleryItem[]>([])
  const [educationItems, setEducationItems]   = useState<EducationItem[]>([])
  const [certItems, setCertItems]             = useState<CertItem[]>([])
  const [testimonialItems, setTestimonialItems] = useState<TestimonialItem[]>([])

  const heroFileRef = useRef<HTMLInputElement>(null)
  const profileFileRef = useRef<HTMLInputElement>(null)
  const profileCoverFileRef = useRef<HTMLInputElement>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)

  const [socialError, setSocialError] = useState<string | null>(null)

  useEffect(() => {
    if (!data?.data) return
    const s = data.data
    setForm(s)
    setExperienceItems(parseJSON(s.profile_experience, []))
    setSkillsItems(parseJSON(s.profile_skills, []))
    setGalleryItems(parseJSON(s.profile_gallery, []))
    setEducationItems(parseJSON(s.profile_education, []))
    setCertItems(parseJSON(s.profile_certifications, []))
    setTestimonialItems(parseJSON(s.profile_testimonials, []))
  }, [data])

  function set(key: keyof Settings, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function getVisible(c: PageComponent) {
    return componentVisibility[c.id] !== undefined ? componentVisibility[c.id] : c.is_visible
  }

  function isSocialLinksVisible(): boolean {
    const components: PageComponent[] = pageData?.data.components ?? []
    const sc = components.find((c) => c.name === 'social-links')
    if (!sc) return false
    return getVisible(sc)
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void,
  ) {
    const file = e.target.files?.[0] ?? null
    setFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (isSocialLinksVisible()) {
      const hasAny = form.social_linkedin || form.social_instagram || form.social_youtube || form.social_facebook
      if (!hasAny) {
        setSocialError('At least one social link is required when the section is enabled.')
        return
      }
    }
    setSocialError(null)

    try {
      // Sequential to avoid CSRF token race condition
      const components: PageComponent[] = pageData?.data.components ?? []
      for (const c of components) {
        const visible = getVisible(c)
        if (visible !== c.is_visible) {
          await updatePageComponent(c.id, { is_visible: visible })
        }
      }

      const aboutComponents: PageComponent[] = aboutPageData?.data.components ?? []
      for (const c of aboutComponents) {
        const visible = aboutComponentVisibility[c.id] !== undefined ? aboutComponentVisibility[c.id] : c.is_visible
        if (visible !== c.is_visible) {
          await updatePageComponent(c.id, { is_visible: visible })
        }
      }

      const settingsPayload = { ...form }

      if (profileCoverFile) {
        try {
          const result = await uploadImage(profileCoverFile)
          settingsPayload.profile_cover_id = String(result.data.id)
          setProfileCoverFile(null)
          setProfileCoverPreview(null)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Cover image upload failed'
          toast({ title: msg, variant: 'destructive' })
          return
        }
      }

      if (logoFile) {
        try {
          const result = await uploadImage(logoFile)
          settingsPayload.blog_logo_id = String(result.data.id)
          setLogoFile(null)
          setLogoPreview(null)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Logo upload failed'
          toast({ title: msg, variant: 'destructive' })
          return
        }
      }

      if (heroImageFile) {
        try {
          const result = await uploadImage(heroImageFile)
          settingsPayload.hero_image_id = String(result.data.id)
          setHeroImageFile(null)
          setHeroImagePreview(null)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Hero image upload failed'
          toast({ title: msg, variant: 'destructive' })
          return
        }
      }

      if (profileImageFile) {
        try {
          const result = await uploadImage(profileImageFile)
          settingsPayload.profile_image_id = String(result.data.id)
          setProfileImageFile(null)
          setProfileImagePreview(null)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Profile image upload failed'
          toast({ title: msg, variant: 'destructive' })
          return
        }
      }

      // Upload gallery pending images sequentially
      const resolvedGallery: Omit<GalleryItem, 'pendingFile' | 'previewUrl'>[] = []
      for (const item of galleryItems) {
        let url = item.url
        if (item.pendingFile) {
          try {
            const result = await uploadImage(item.pendingFile)
            url = (result.data as { url: string }).url
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Gallery image upload failed'
            toast({ title: msg, variant: 'destructive' })
            return
          }
        }
        resolvedGallery.push({ url, title: item.title, description: item.description })
      }
      setGalleryItems(resolvedGallery)

      // Upload testimonial avatars sequentially
      const resolvedTestimonials: Omit<TestimonialItem, 'pendingAvatar' | 'previewAvatar'>[] = []
      for (const item of testimonialItems) {
        let avatar = item.avatar
        if (item.pendingAvatar) {
          try {
            const result = await uploadImage(item.pendingAvatar)
            avatar = (result.data as { url: string }).url
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Avatar upload failed'
            toast({ title: msg, variant: 'destructive' })
            return
          }
        }
        resolvedTestimonials.push({ name: item.name, role: item.role, text: item.text, avatar, linkedin: item.linkedin })
      }
      setTestimonialItems(resolvedTestimonials)

      // Serialize all editors
      settingsPayload.profile_experience     = JSON.stringify(experienceItems)
      settingsPayload.profile_skills         = JSON.stringify(skillsItems)
      settingsPayload.profile_gallery        = JSON.stringify(resolvedGallery)
      settingsPayload.profile_education      = JSON.stringify(educationItems)
      settingsPayload.profile_certifications = JSON.stringify(certItems)
      settingsPayload.profile_testimonials   = JSON.stringify(resolvedTestimonials)

      await save(settingsPayload)
      toast({ title: 'Settings saved.' })
    } catch {
      toast({ title: 'Failed to save settings.', variant: 'destructive' })
    }
  }

  if (isLoading || pageLoading || aboutPageLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  const components: PageComponent[] = pageData?.data.components ?? []
  const aboutComponents: PageComponent[] = aboutPageData?.data.components ?? []

  function getAboutVisible(c: PageComponent) {
    return aboutComponentVisibility[c.id] !== undefined ? aboutComponentVisibility[c.id] : c.is_visible
  }

  const heroComponent = components.find((c) => c.name === 'hero')
  const profileComponent = components.find((c) => c.name === 'profile')
  const isHeroOn = heroComponent ? getVisible(heroComponent) : false
  const isProfileOn = profileComponent ? getVisible(profileComponent) : false
  const isSocialOn = isSocialLinksVisible()

  return (
    <div className="p-6">
      <form onSubmit={handleSave}>
        {/* Sticky header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Left column (5/12): General + Admin Theme ── */}
          <div className="lg:col-span-5 space-y-6">

            {/* Blog info */}
            <Card>
              <CardHeader><CardTitle>General</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blog-name">Blog name</Label>
                  <Input
                    id="blog-name"
                    value={form.blog_name ?? ''}
                    onChange={(e) => set('blog_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-desc">Description</Label>
                  <Input
                    id="blog-desc"
                    value={form.blog_description ?? ''}
                    onChange={(e) => set('blog_description', e.target.value)}
                  />
                </div>
                {/* Logo upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Blog logo
                    <span className="text-xs text-muted-foreground font-normal">(square, e.g. 128 × 128 px)</span>
                  </Label>
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : form.blog_logo_url ? (
                    <div className="relative inline-block">
                      <img src={form.blog_logo_url} alt="Current logo" className="h-16 w-16 rounded-full object-cover" />
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                        onClick={() => logoFileRef.current?.click()}
                      >
                        <span className="text-white text-xs font-medium">Change</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors w-40"
                      onClick={() => logoFileRef.current?.click()}
                    >
                      <div className="space-y-1 text-muted-foreground">
                        <Upload className="h-5 w-5 mx-auto" />
                        <p className="text-xs">Click to upload</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, setLogoFile, setLogoPreview)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin theme */}
            <Card>
              <CardHeader>
                <CardTitle>Admin theme</CardTitle>
                <CardDescription>Choose the visual style for your dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex p-1 rounded-lg border bg-muted gap-1">
                  {(['default', 'minimal', 'dark'] as const).map((tk) => (
                    <button
                      key={tk}
                      type="button"
                      onClick={() => set('blog_theme', tk)}
                      className={`flex-1 py-2 text-sm font-medium capitalize transition-colors rounded-md ${
                        (form.blog_theme ?? 'default') === tk
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tk}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── Right column (7/12): Blog Sections + conditional configs ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Blog sections toggles */}
            <Card>
              <CardHeader>
                <CardTitle>Blog sections</CardTitle>
                <CardDescription>Toggle which sections appear on your blog homepage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {components.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <Label htmlFor={`sect-${c.id}`} className="font-normal cursor-pointer">
                      {COMPONENT_LABELS[c.name] ?? c.name}
                    </Label>
                    <Switch
                      id={`sect-${c.id}`}
                      checked={getVisible(c)}
                      disabled={ALWAYS_ON.has(c.name)}
                      onCheckedChange={(checked) =>
                        setComponentVisibility((prev) => ({ ...prev, [c.id]: checked }))
                      }
                    />
                  </div>
                ))}

                {/* Comments toggle — global setting, not a page component */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="comments-toggle" className="font-normal cursor-pointer">
                      Comments on posts
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Allow readers to comment on blog posts.
                    </span>
                  </div>
                  <Switch
                    id="comments-toggle"
                    checked={(form.comments_enabled ?? '1') === '1'}
                    onCheckedChange={(checked) => set('comments_enabled', checked ? '1' : '0')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hero Banner config */}
            {isHeroOn && (
              <Card>
                <CardHeader>
                  <CardTitle>Hero Banner</CardTitle>
                  <CardDescription>Configure the hero banner content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Banner image <span className="text-xs text-muted-foreground">(1200 × 630 px recommended)</span></Label>
                    {heroImagePreview ? (
                      <div className="relative inline-block">
                        <img src={heroImagePreview} alt="Hero preview" className="max-h-32 rounded object-cover" />
                        <button
                          type="button"
                          onClick={() => { setHeroImageFile(null); setHeroImagePreview(null) }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : form.hero_image_url ? (
                      <div className="relative inline-block">
                        <img src={form.hero_image_url} alt="Current hero" className="max-h-32 rounded object-cover" />
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded cursor-pointer transition-opacity"
                          onClick={() => heroFileRef.current?.click()}
                        >
                          <span className="text-white text-xs font-medium">Change image</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => heroFileRef.current?.click()}
                      >
                        <div className="space-y-1 text-muted-foreground">
                          <Upload className="h-6 w-6 mx-auto" />
                          <p className="text-sm">Click to upload a banner image</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={heroFileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, setHeroImageFile, setHeroImagePreview)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-text">Display text</Label>
                    <Input
                      id="hero-text"
                      value={form.hero_text ?? ''}
                      onChange={(e) => set('hero_text' as keyof Settings, e.target.value)}
                      placeholder="Welcome to my blog"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile config */}
            {isProfileOn && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile / About</CardTitle>
                  <CardDescription>Configure your profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile image <span className="text-xs text-muted-foreground">(1080 × 1080 px recommended)</span></Label>
                    {profileImagePreview ? (
                      <div className="relative inline-block">
                        <img src={profileImagePreview} alt="Profile preview" className="max-h-24 rounded-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setProfileImageFile(null); setProfileImagePreview(null) }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : form.profile_image_url ? (
                      <div className="relative inline-block">
                        <img src={form.profile_image_url} alt="Current profile" className="max-h-24 rounded-full object-cover" />
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                          onClick={() => profileFileRef.current?.click()}
                        >
                          <span className="text-white text-xs font-medium">Change</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => profileFileRef.current?.click()}
                      >
                        <div className="space-y-1 text-muted-foreground">
                          <Upload className="h-6 w-6 mx-auto" />
                          <p className="text-sm">Click to upload a profile image</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={profileFileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, setProfileImageFile, setProfileImagePreview)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      value={form.profile_name ?? ''}
                      onChange={(e) => set('profile_name' as keyof Settings, e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-summary">Summary</Label>
                    <Input
                      id="profile-summary"
                      value={form.profile_summary ?? ''}
                      onChange={(e) => set('profile_summary' as keyof Settings, e.target.value)}
                      placeholder="A short bio or tagline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <div onKeyDown={(e) => e.stopPropagation()}>
                      <PostEditor
                        key="profile-desc"
                        content={form.profile_description ?? ''}
                        onChange={(html) => set('profile_description' as keyof Settings, html)}
                      />
                    </div>
                  </div>

                  {/* Cover image */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label>Cover image <span className="text-xs text-muted-foreground">(optional, 1500 × 500 px recommended)</span></Label>
                    {profileCoverPreview ? (
                      <div className="relative inline-block">
                        <img src={profileCoverPreview} alt="Cover preview" className="max-h-24 rounded object-cover" />
                        <button
                          type="button"
                          onClick={() => { setProfileCoverFile(null); setProfileCoverPreview(null) }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : form.profile_cover_url ? (
                      <div className="relative inline-block">
                        <img src={form.profile_cover_url} alt="Current cover" className="max-h-24 rounded object-cover" />
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded cursor-pointer transition-opacity"
                          onClick={() => profileCoverFileRef.current?.click()}
                        >
                          <span className="text-white text-xs font-medium">Change image</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => profileCoverFileRef.current?.click()}
                      >
                        <div className="space-y-1 text-muted-foreground">
                          <Upload className="h-6 w-6 mx-auto" />
                          <p className="text-sm">Click to upload a cover image</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={profileCoverFileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, setProfileCoverFile, setProfileCoverPreview)}
                    />
                  </div>

                  {/* Professional title */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-title">Professional title</Label>
                    <Input
                      id="profile-title"
                      value={form.profile_title ?? ''}
                      onChange={(e) => set('profile_title' as keyof Settings, e.target.value)}
                      placeholder="e.g. Full-stack Developer"
                    />
                  </div>

                  {/* Availability badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="profile-available" className="font-normal cursor-pointer">
                        Show availability badge
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        Displays a green "Disponible" badge on your profile.
                      </span>
                    </div>
                    <Switch
                      id="profile-available"
                      checked={(form.profile_available ?? '0') === '1'}
                      onCheckedChange={(checked) => set('profile_available' as keyof Settings, checked ? '1' : '0')}
                    />
                  </div>

                </CardContent>
              </Card>
            )}

            {/* About page data — dynamic editors */}
            {(
              <Card>
                <CardHeader>
                  <CardTitle>About page data</CardTitle>
                  <CardDescription>Fill in the content that appears on your <code className="text-xs">/about</code> page. Sections only show if enabled above.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Experience</p>
                    <ExperienceEditor items={experienceItems} onChange={setExperienceItems} />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Skills</p>
                    <SkillsEditor items={skillsItems} onChange={setSkillsItems} />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Gallery</p>
                    <GalleryEditor items={galleryItems} onChange={setGalleryItems} />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Education</p>
                    <EducationEditor items={educationItems} onChange={setEducationItems} />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Certifications</p>
                    <CertificationsEditor items={certItems} onChange={setCertItems} />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Testimonials</p>
                    <TestimonialsEditor items={testimonialItems} onChange={setTestimonialItems} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* About page sections */}
            {aboutComponents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>About page sections</CardTitle>
                  <CardDescription>Toggle which sections appear on your <code className="text-xs">/about</code> page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aboutComponents.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <Label htmlFor={`about-sect-${c.id}`} className="font-normal cursor-pointer">
                        {COMPONENT_LABELS[c.name] ?? c.name}
                      </Label>
                      <Switch
                        id={`about-sect-${c.id}`}
                        checked={getAboutVisible(c)}
                        onCheckedChange={(checked) =>
                          setAboutComponentVisibility((prev) => ({ ...prev, [c.id]: checked }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Social links */}
            <Card>
              <CardHeader><CardTitle>Social links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isSocialOn && socialError && (
                  <p className="text-sm text-destructive">{socialError}</p>
                )}
                {(
                  [
                    { key: 'social_linkedin', label: 'LinkedIn URL' },
                    { key: 'social_instagram', label: 'Instagram URL' },
                    { key: 'social_youtube', label: 'YouTube URL' },
                    { key: 'social_facebook', label: 'Facebook URL' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="url"
                      value={form[key] ?? ''}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </form>
    </div>
  )
}
