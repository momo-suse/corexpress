import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PostEditor from '@/components/admin/PostEditor'
import { useBlogPage } from '@/hooks/useBlogPage'
import { useMutateSettings } from '@/hooks/useSettings'
import { refreshCsrfToken, checkSession } from '@/api/client'
import { updatePageComponent } from '@/api/pages'
import { uploadImage } from '@/api/images'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/useToast'
import { Upload, ImageIcon, User, List, Share2, Sparkles, Globe } from 'lucide-react'
import type { PageComponent } from '@/types/api'

interface HeroData {
  text: string
  imageFile: File | null
  imagePreview: string | null
}

interface ProfileData {
  name: string
  summary: string
  description: string
  imageFile: File | null
  imagePreview: string | null
}

interface SocialData {
  linkedin: string
  instagram: string
  youtube: string
  facebook: string
}

export default function SetupPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: pageData, isLoading: pageLoading } = useBlogPage()
  const { mutateAsync: saveSettings } = useMutateSettings()

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [heroEnabled, setHeroEnabled] = useState(false)
  const [profileEnabled, setProfileEnabled] = useState(false)
  const [socialEnabled, setSocialEnabled] = useState(false)

  const [hero, setHero] = useState<HeroData>({ text: '', imageFile: null, imagePreview: null })
  const [profile, setProfile] = useState<ProfileData>({
    name: '', summary: '', description: '', imageFile: null, imagePreview: null,
  })
  const [social, setSocial] = useState<SocialData>({
    linkedin: '', instagram: '', youtube: '', facebook: '',
  })

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)

  const heroFileRef = useRef<HTMLInputElement>(null)
  const profileFileRef = useRef<HTMLInputElement>(null)

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const components: PageComponent[] = pageData?.data.components ?? []

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (fn: (prev: any) => any) => void,
  ) {
    const file = e.target.files?.[0] ?? null
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setter((prev: any) => ({
        ...prev,
        imageFile: file,
        imagePreview: ev.target?.result as string,
      }))
      reader.readAsDataURL(file)
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (heroEnabled && !hero.text.trim()) {
      errs.hero_text = 'Hero text is required.'
    }

    if (profileEnabled) {
      if (!profile.name.trim()) errs.profile_name = 'Name is required.'
      if (!profile.summary.trim()) errs.profile_summary = 'Summary is required.'
    }

    if (socialEnabled) {
      const hasAny = social.linkedin || social.instagram || social.youtube || social.facebook
      if (!hasAny) errs.social = 'At least one social link is required.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    try {
      // 0. Validate session and pre-warm CSRF token before any mutation
      //    This prevents mid-save 403/401 surprises from a stale token or expired session.
      const sessionOk = await checkSession()
      if (!sessionOk) {
        toast({
          title: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      const freshToken = await refreshCsrfToken()
      if (!freshToken) {
        toast({
          title: 'No se pudo verificar la seguridad de la sesión. Recarga la página.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      // 1. Toggle component visibility — sequential to avoid CSRF race
      const visibilityMap: Record<string, boolean> = {
        'post-list': true,
        hero: heroEnabled,
        profile: profileEnabled,
        'social-links': socialEnabled,
      }

      for (const c of components) {
        const target = visibilityMap[c.name]
        if (target !== undefined && target !== c.is_visible) {
          await updatePageComponent(c.id, { is_visible: target })
        }
      }

      // 2. Upload images — handle each individually so format errors are visible
      let logoImageId: string | undefined
      let heroImageId: string | undefined
      let profileImageId: string | undefined

      if (logoFile) {
        try {
          const result = await uploadImage(logoFile)
          logoImageId = String(result.data.id)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Logo upload failed'
          toast({ title: msg, variant: 'destructive' })
          setSaving(false)
          return
        }
      }

      if (heroEnabled && hero.imageFile) {
        try {
          const result = await uploadImage(hero.imageFile)
          heroImageId = String(result.data.id)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Hero banner image upload failed'
          toast({ title: msg, variant: 'destructive' })
          setSaving(false)
          return
        }
      }

      if (profileEnabled && profile.imageFile) {
        try {
          const result = await uploadImage(profile.imageFile)
          profileImageId = String(result.data.id)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Profile image upload failed'
          toast({ title: msg, variant: 'destructive' })
          setSaving(false)
          return
        }
      }

      const settingsPayload: Record<string, string> = { setup_complete: '1' }
      if (logoImageId) settingsPayload.blog_logo_id = logoImageId

      if (heroEnabled) {
        settingsPayload.hero_text = hero.text.trim()
        if (heroImageId) settingsPayload.hero_image_id = heroImageId
      }

      if (profileEnabled) {
        settingsPayload.profile_name = profile.name.trim()
        settingsPayload.profile_summary = profile.summary.trim()
        if (profile.description.trim()) {
          settingsPayload.profile_description = profile.description.trim()
        }
        if (profileImageId) settingsPayload.profile_image_id = profileImageId
      }

      if (socialEnabled) {
        if (social.linkedin) settingsPayload.social_linkedin = social.linkedin.trim()
        if (social.instagram) settingsPayload.social_instagram = social.instagram.trim()
        if (social.youtube) settingsPayload.social_youtube = social.youtube.trim()
        if (social.facebook) settingsPayload.social_facebook = social.facebook.trim()
      }

      await saveSettings(settingsPayload)

      await qc.invalidateQueries({ queryKey: ['settings'] })
      qc.invalidateQueries({ queryKey: ['pages', 'home'] })
      toast({ title: '¡Configuración guardada!' })
      navigate('/cx-admin', { replace: true })
    } catch (err) {
      // Show the actual error (includes session expiry messages from client.ts)
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración.'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Set up your blog</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Configure which sections appear on your homepage and fill in the details.
          </p>
        </div>

        {/* Blog Logo */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Blog Logo</CardTitle>
                <CardDescription>Shown at the top of your blog and used as favicon.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 border-t pt-4">
            <Label>Logo image <span className="text-xs text-muted-foreground">(square recommended, e.g. 128 × 128 px)</span></Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => logoFileRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-16 w-16 mx-auto rounded-full object-cover" />
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto" />
                  <p className="text-sm">Click to upload your logo</p>
                  <p className="text-xs">JPEG, PNG, GIF, WebP — max 10 MB</p>
                </div>
              )}
            </div>
            <input
              ref={logoFileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setLogoFile(file)
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Post List — always on */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <List className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Post List</CardTitle>
                  <CardDescription>Your blog posts will always be displayed.</CardDescription>
                </div>
              </div>
              <Switch checked disabled className="opacity-50" />
            </div>
          </CardHeader>
        </Card>

        {/* Hero Banner */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Hero Banner</CardTitle>
                  <CardDescription>A large banner image with text overlay.</CardDescription>
                </div>
              </div>
              <Switch checked={heroEnabled} onCheckedChange={setHeroEnabled} />
            </div>
          </CardHeader>
          {heroEnabled && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Banner image <span className="text-xs text-muted-foreground">(1200 × 630 px recommended)</span></Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => heroFileRef.current?.click()}
                >
                  {hero.imagePreview ? (
                    <img src={hero.imagePreview} alt="Hero preview" className="max-h-40 mx-auto rounded object-cover" />
                  ) : (
                    <div className="space-y-2 text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto" />
                      <p className="text-sm">Click to upload a banner image</p>
                      <p className="text-xs">JPEG, PNG, GIF, WebP — max 10 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={heroFileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setHero)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-text">Display text</Label>
                <Input
                  id="hero-text"
                  value={hero.text}
                  onChange={(e) => setHero((h) => ({ ...h, text: e.target.value }))}
                  placeholder="Welcome to my blog"
                />
                {errors.hero_text && <p className="text-sm text-destructive">{errors.hero_text}</p>}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Profile / About */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Profile / About</CardTitle>
                  <CardDescription>Show your profile information on the blog.</CardDescription>
                </div>
              </div>
              <Switch checked={profileEnabled} onCheckedChange={setProfileEnabled} />
            </div>
          </CardHeader>
          {profileEnabled && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Profile image <span className="text-xs text-muted-foreground">(1080 × 1080 px recommended)</span></Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => profileFileRef.current?.click()}
                >
                  {profile.imagePreview ? (
                    <img src={profile.imagePreview} alt="Profile preview" className="max-h-32 mx-auto rounded-full object-cover" />
                  ) : (
                    <div className="space-y-2 text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto" />
                      <p className="text-sm">Click to upload a profile image</p>
                      <p className="text-xs">JPEG, PNG, GIF, WebP — max 10 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={profileFileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setProfile)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                />
                {errors.profile_name && <p className="text-sm text-destructive">{errors.profile_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-summary">Summary</Label>
                <Input
                  id="profile-summary"
                  value={profile.summary}
                  onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="A short bio or tagline"
                />
                {errors.profile_summary && <p className="text-sm text-destructive">{errors.profile_summary}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <div onKeyDown={(e) => e.stopPropagation()}>
                  <PostEditor
                    content={profile.description}
                    onChange={(html) => setProfile((p) => ({ ...p, description: html }))}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Social Links</CardTitle>
                  <CardDescription>Display your social media profiles on the blog.</CardDescription>
                </div>
              </div>
              <Switch checked={socialEnabled} onCheckedChange={setSocialEnabled} />
            </div>
          </CardHeader>
          {socialEnabled && (
            <CardContent className="space-y-4 border-t pt-4">
              {errors.social && <p className="text-sm text-destructive">{errors.social}</p>}
              {([
                { key: 'linkedin' as const, label: 'LinkedIn URL' },
                { key: 'instagram' as const, label: 'Instagram URL' },
                { key: 'youtube' as const, label: 'YouTube URL' },
                { key: 'facebook' as const, label: 'Facebook URL' },
              ]).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`social-${key}`}>{label}</Label>
                  <Input
                    id={`social-${key}`}
                    type="url"
                    value={social[key]}
                    onChange={(e) => setSocial((s) => ({ ...s, [key]: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        <div className="flex justify-center pb-8">
          <Button size="lg" onClick={handleSave} disabled={saving} className="px-8">
            {saving ? 'Saving…' : 'Save & go to dashboard'}
          </Button>
        </div>
      </div>
    </div>
  )
}
