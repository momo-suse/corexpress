import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Globe, Palette, ShieldCheck } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { uploadImage } from '@/api/images'
import { changePassword } from '@/api/auth'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { ApiError } from '@/api/client'
import type { Settings } from '@/types/api'

const THEME_CLASSES = ['theme-default', 'theme-minimal', 'theme-dark'] as const

export default function SettingsPage() {
  const { data, isLoading } = useSettings()
  const { mutateAsync: save, isPending: saving } = useMutateSettings()

  const [form, setForm] = useState<Partial<Settings>>({})

  // Change-password state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [newPwdConfirm, setNewPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  // Live theme preview — mirror AdminLayout's logic when user selects a different theme.
  // document.body also carries the theme class, so we skip it by scoping the search
  // inside #root (the React mount point), which gives us the AdminLayout wrapper div.
  useEffect(() => {
    const theme = (form.blog_theme as string) ?? 'default'
    const root = document.getElementById('root')
    const outer = root?.querySelector('[class*="theme-"]') as HTMLElement | null
    if (outer) {
      THEME_CLASSES.forEach(c => outer.classList.remove(c))
      outer.classList.add(`theme-${theme}`)
    }
    document.body.classList.remove(...THEME_CLASSES)
    document.body.classList.add(`theme-${theme}`)
  }, [form.blog_theme])

  function set(key: keyof Settings, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    if (file) {
      const r = new FileReader()
      r.onload = (ev) => setLogoPreview(ev.target?.result as string)
      r.readAsDataURL(file)
    } else setLogoPreview(null)
    e.target.value = ''
  }

  async function handleSave() {
    try {
      const payload = { ...form }
      if (logoFile) {
        const result = await uploadImage(logoFile)
        payload.blog_logo_id = String(result.data.id)
        setLogoFile(null)
        setLogoPreview(null)
      }
      await save(payload as never)
      toast({ title: 'Settings saved.' })
    } catch {
      toast({ title: 'Failed to save settings.', variant: 'destructive' })
    }
  }

  async function handlePasswordChange() {
    if (newPwd.length < 8) {
      toast({ title: 'La contraseña debe tener al menos 8 caracteres.', variant: 'destructive' })
      return
    }
    if (newPwd !== newPwdConfirm) {
      toast({ title: 'Las contraseñas nuevas no coinciden.', variant: 'destructive' })
      return
    }
    setPwdSaving(true)
    try {
      await changePassword(currentPwd, newPwd, newPwdConfirm)
      toast({ title: 'Contraseña actualizada.' })
      setCurrentPwd(''); setNewPwd(''); setNewPwdConfirm('')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al cambiar la contraseña.'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setPwdSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  return (
    <div className="relative min-h-full flex flex-col">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">General configuration for your blog and dashboard.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </header>

      {/* Content */}
      <div className="p-8 max-w-3xl mx-auto w-full space-y-6">

        {/* General */}
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">General</p>
              <p className="text-xs text-muted-foreground">Blog identity and logo</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="blog-name">Blog name</Label>
              <Input
                id="blog-name"
                value={form.blog_name ?? ''}
                onChange={(e) => set('blog_name', e.target.value)}
                placeholder="My Blog"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-desc">Description</Label>
              <Input
                id="blog-desc"
                value={form.blog_description ?? ''}
                onChange={(e) => set('blog_description', e.target.value)}
                placeholder="A short description of your blog"
              />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Blog logo
                <span className="text-xs text-muted-foreground font-normal">(square — 128 × 128 px recommended)</span>
              </Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative shrink-0">
                    <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : form.blog_logo_url ? (
                  <div
                    className="relative shrink-0 cursor-pointer group"
                    onClick={() => logoFileRef.current?.click()}
                  >
                    <img src={form.blog_logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0 gap-1"
                    onClick={() => logoFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-[9px] leading-none">Logo</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Shown in the blog header and browser tab. Use a square PNG or WebP for best results.
                </p>
              </div>
              <input
                ref={logoFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </div>

        {/* Admin theme */}
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin theme</p>
              <p className="text-xs text-muted-foreground">Visual style of the dashboard (does not affect the public blog)</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex p-1 rounded-xl border bg-muted gap-1">
              {(['default', 'minimal', 'dark'] as const).map((tk) => (
                <button
                  key={tk}
                  type="button"
                  onClick={() => set('blog_theme', tk)}
                  className={cn(
                    'flex-1 py-2.5 text-sm font-medium capitalize transition-colors rounded-lg',
                    (form.blog_theme ?? 'default') === tk
                      ? 'bg-card text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Seguridad</p>
              <p className="text-xs text-muted-foreground">Cambia la contraseña de tu cuenta</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-pwd">Contraseña actual</Label>
              <Input
                id="current-pwd"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">Nueva contraseña</Label>
              <Input
                id="new-pwd"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd-confirm">Confirmar nueva contraseña</Label>
              <Input
                id="new-pwd-confirm"
                type="password"
                value={newPwdConfirm}
                onChange={(e) => setNewPwdConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={pwdSaving || !currentPwd || !newPwd || !newPwdConfirm}>
              {pwdSaving ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
