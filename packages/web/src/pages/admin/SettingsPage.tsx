import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Upload, X, Globe, Paintbrush, ShieldCheck, Languages, Palette, RefreshCw, Bot, Users, CheckCircle2 } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { uploadImage } from '@/api/images'
import { changePassword } from '@/api/auth'
import { downloadBackupArchive, inspectBackupArchive, restoreBackupArchive } from '@/api/backup'
import { checkUpdate, applyUpdate } from '@/api/update'
import { deleteCredentials } from '@/api/settings'
import type { BackupBlock, BackupInspectResult } from '@/api/backup'
import type { UpdateCheckResult } from '@/api/update'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { ApiError } from '@/api/client'
import { useTranslation } from 'react-i18next'
import type { Settings } from '@/types/api'

const THEME_CLASSES = ['theme-default', 'theme-minimal', 'theme-dark'] as const
const BACKUP_BLOCKS: BackupBlock[] = ['appearance', 'content', 'subscribers', 'activity', 'media']

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

type Tab = 'general' | 'style' | 'security' | 'updates' | 'backup' | 'subscribers' | 'recaptcha'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { data, isLoading, refetch } = useSettings()
  const { mutateAsync: save, isPending: saving } = useMutateSettings()

  const [form, setForm] = useState<Partial<Settings>>({})
  const [savedCreds, setSavedCreds] = useState({ google_client_id: '', recaptcha_site_key: '' })
  const [localSubscribersOn, setLocalSubscribersOn] = useState(false)
  const [localRecaptchaOn, setLocalRecaptchaOn] = useState(false)
  const [confirmResetSubscribers, setConfirmResetSubscribers] = useState(false)
  const [confirmResetRecaptcha, setConfirmResetRecaptcha] = useState(false)
  const [, setResetting] = useState(false)

  // Update state
  const [updateInfo, setUpdateInfo]       = useState<UpdateCheckResult | null>(null)
  const [checking, setChecking]           = useState(false)
  const [applying, setApplying]           = useState(false)
  const [updateDone, setUpdateDone]       = useState(false)

  // Backup state
  const [exportBlocks, setExportBlocks] = useState<BackupBlock[]>(['appearance', 'content', 'subscribers'])
  const [includeMediaFiles, setIncludeMediaFiles] = useState(false)
  const [exportingBackup, setExportingBackup] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [inspectInfo, setInspectInfo] = useState<BackupInspectResult | null>(null)
  const [restoreBlocks, setRestoreBlocks] = useState<BackupBlock[]>([])
  const [inspectingBackup, setInspectingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)

  // Change-password state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [newPwdConfirm, setNewPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (data?.data) {
      const d = data.data as Record<string, string>
      setForm(data.data)
      setSavedCreds({
        google_client_id: d.google_client_id ?? '',
        recaptcha_site_key: d.recaptcha_site_key ?? '',
      })
      setLocalSubscribersOn(false)
      setLocalRecaptchaOn(false)
    }
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

  // Live language preview — apply immediately when user selects a different locale.
  useEffect(() => {
    const locale = (form.app_locale as string) ?? 'en'
    if (locale !== i18n.language) {
      i18n.changeLanguage(locale)
    }
  }, [form.app_locale]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!exportBlocks.includes('media') && includeMediaFiles) {
      setIncludeMediaFiles(false)
    }
  }, [exportBlocks, includeMediaFiles])

  function set(key: keyof Settings, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleBackupBlock(block: BackupBlock, setSelected: React.Dispatch<React.SetStateAction<BackupBlock[]>>) {
    setSelected((current) => {
      const next = current.includes(block)
        ? current.filter((item) => item !== block)
        : [...current, block]

      return BACKUP_BLOCKS.filter((item) => next.includes(item))
    })
  }

  function formatBackupDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  function handleBackupFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setBackupFile(file)
    setInspectInfo(null)
    setRestoreBlocks([])
    e.target.value = ''
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

  async function handleCheckUpdate() {
    setChecking(true)
    setUpdateInfo(null)
    setUpdateDone(false)
    try {
      const result = await checkUpdate()
      setUpdateInfo(result)
    } catch {
      toast({ title: t('admin.settings.updates.checkFailed'), variant: 'destructive' })
    } finally {
      setChecking(false)
    }
  }

  async function handleApplyUpdate() {
    setApplying(true)
    try {
      const result = await applyUpdate()
      if (result.success) {
        setUpdateDone(true)
        setUpdateInfo(null)
        toast({ title: t('admin.settings.updates.success', { version: result.new_version }) })
      } else {
        toast({ title: result.error ?? t('admin.settings.updates.applyFailed'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('admin.settings.updates.applyFailed'), variant: 'destructive' })
    } finally {
      setApplying(false)
    }
  }

  async function handleExportBackup() {
    if (exportBlocks.length === 0) {
      toast({ title: t('admin.settings.backup.export.chooseBlocks'), variant: 'destructive' })
      return
    }

    setExportingBackup(true)
    try {
      await downloadBackupArchive(exportBlocks, includeMediaFiles)
      toast({ title: t('admin.settings.backup.export.success') })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('admin.settings.backup.export.error')
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setExportingBackup(false)
    }
  }

  async function handleInspectBackup() {
    if (!backupFile) {
      toast({ title: t('admin.settings.backup.restore.chooseFile'), variant: 'destructive' })
      return
    }

    setInspectingBackup(true)
    try {
      const result = await inspectBackupArchive(backupFile)
      setInspectInfo(result)
      setRestoreBlocks(result.available_blocks)
      toast({ title: t('admin.settings.backup.restore.inspectSuccess') })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('admin.settings.backup.restore.inspectError')
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setInspectingBackup(false)
    }
  }

  async function handleRestoreBackup() {
    if (!backupFile || !inspectInfo) {
      toast({ title: t('admin.settings.backup.restore.inspectFirst'), variant: 'destructive' })
      return
    }

    if (restoreBlocks.length === 0) {
      toast({ title: t('admin.settings.backup.restore.chooseBlocks'), variant: 'destructive' })
      return
    }

    setRestoringBackup(true)
    try {
      const result = await restoreBackupArchive(backupFile, restoreBlocks)
      if (result.warnings.length > 0) {
        toast({ title: result.warnings[0] })
      }
      toast({ title: t('admin.settings.backup.restore.success') })
      setBackupFile(null)
      setInspectInfo(null)
      setRestoreBlocks([])
      await refetch()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('admin.settings.backup.restore.error')
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setRestoringBackup(false)
    }
  }

  async function handleSave() {
    const f = form as Record<string, string>
    const hasGoogleCreds  = !!savedCreds.google_client_id
    const hasRecaptchaCreds = !!savedCreds.recaptcha_site_key

    if (localSubscribersOn && !hasGoogleCreds) {
      const id = f.google_client_id ?? ''
      const secret = f.google_client_secret ?? ''
      if ((id && !secret) || (!id && secret)) {
        toast({ title: t('admin.settings.subscribers.bothRequired'), variant: 'destructive' })
        return
      }
    }

    if (localRecaptchaOn && !hasRecaptchaCreds) {
      const site = f.recaptcha_site_key ?? ''
      const secret = f.recaptcha_secret_key ?? ''
      if ((site && !secret) || (!site && secret)) {
        toast({ title: t('admin.settings.recaptcha.bothRequired'), variant: 'destructive' })
        return
      }
    }

    try {
      const payload = { ...form } as Record<string, unknown>

      if (hasGoogleCreds) {
        delete payload.google_client_id
        delete payload.google_client_secret
      } else if (localSubscribersOn) {
        const id = f.google_client_id ?? ''
        const secret = f.google_client_secret ?? ''
        if (id && secret) {
          payload.subscribers_enabled = '1'
        } else {
          delete payload.google_client_id
          delete payload.google_client_secret
          delete payload.subscribers_enabled
        }
      } else {
        delete payload.google_client_id
        delete payload.google_client_secret
        delete payload.subscribers_enabled
      }

      if (hasRecaptchaCreds) {
        delete payload.recaptcha_site_key
        delete payload.recaptcha_secret_key
      } else if (localRecaptchaOn) {
        const site = f.recaptcha_site_key ?? ''
        const secret = f.recaptcha_secret_key ?? ''
        if (site && secret) {
          payload.recaptcha_enabled = '1'
        } else {
          delete payload.recaptcha_site_key
          delete payload.recaptcha_secret_key
          delete payload.recaptcha_enabled
        }
      } else {
        delete payload.recaptcha_site_key
        delete payload.recaptcha_secret_key
        delete payload.recaptcha_enabled
      }

      if (logoFile) {
        const result = await uploadImage(logoFile)
        payload.blog_logo_id = String(result.data.id)
        setLogoFile(null)
        setLogoPreview(null)
      }
      await save(payload as never)
      if (form.app_locale && form.app_locale !== i18n.language) {
        i18n.changeLanguage(form.app_locale)
      }
      toast({ title: t('admin.settings.saved') })
    } catch {
      toast({ title: t('admin.settings.saveFailed'), variant: 'destructive' })
    }
  }

  async function handlePasswordChange() {
    if (newPwd.length < 8) {
      toast({ title: t('admin.settings.security.tooShort'), variant: 'destructive' })
      return
    }
    if (newPwd !== newPwdConfirm) {
      toast({ title: t('admin.settings.security.noMatch'), variant: 'destructive' })
      return
    }
    setPwdSaving(true)
    try {
      await changePassword(currentPwd, newPwd, newPwdConfirm)
      toast({ title: t('admin.settings.security.changed') })
      setCurrentPwd(''); setNewPwd(''); setNewPwdConfirm('')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('admin.settings.security.error')
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setPwdSaving(false)
    }
  }

  async function handleDeleteCredentials(type: 'google' | 'recaptcha') {
    setResetting(true)
    try {
      await deleteCredentials(type)
      await refetch()
      if (type === 'google') {
        setConfirmResetSubscribers(false)
        setLocalSubscribersOn(false)
      } else {
        setConfirmResetRecaptcha(false)
        setLocalRecaptchaOn(false)
      }
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' })
    } finally {
      setResetting(false)
    }
  }

  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  return (
    <div className="relative min-h-full flex flex-col">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('admin.settings.title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('admin.settings.subtitle')}</p>
        </div>
        {activeTab !== 'updates' && activeTab !== 'backup' && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('admin.settings.saveChanges')}
          </Button>
        )}
      </header>

      {/* Tab bar */}
      <div className="px-8 border-b bg-card/60 flex gap-0 shrink-0">
        {([
          { id: 'general'     as Tab, label: t('admin.settings.tabs.general'),     Icon: Globe },
          { id: 'style'       as Tab, label: t('admin.settings.tabs.style'),       Icon: Paintbrush },
          { id: 'security'    as Tab, label: t('admin.settings.tabs.security'),    Icon: ShieldCheck },
          { id: 'subscribers' as Tab, label: t('admin.settings.tabs.subscribers'), Icon: Users },
          { id: 'recaptcha'   as Tab, label: t('admin.settings.tabs.recaptcha'),   Icon: Bot },
          { id: 'backup'      as Tab, label: t('admin.settings.tabs.backup'),      Icon: Upload },
          { id: 'updates'     as Tab, label: t('admin.settings.tabs.updates'),     Icon: RefreshCw },
        ]).map(({ id, label, Icon }) => (
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
      <div className="p-8 max-w-3xl mx-auto w-full space-y-6">

        {/* General */}
        {activeTab === 'general' && <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('admin.settings.general.title')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.settings.general.subtitle')}</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="blog-name">{t('admin.settings.general.blogName')}</Label>
              <Input
                id="blog-name"
                value={form.blog_name ?? ''}
                onChange={(e) => set('blog_name', e.target.value)}
                placeholder={t('admin.settings.general.blogNamePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-desc">{t('admin.settings.general.description')}</Label>
              <Input
                id="blog-desc"
                value={form.blog_description ?? ''}
                onChange={(e) => set('blog_description', e.target.value)}
                placeholder={t('admin.settings.general.descriptionPlaceholder')}
              />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                {t('admin.settings.general.logo')}
                <span className="text-xs text-muted-foreground font-normal">{t('admin.settings.general.logoHint')}</span>
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
                  {t('admin.settings.general.logoInfo')}
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
        </div>}

        {/* Style & Language */}
        {activeTab === 'style' && <>
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('admin.settings.theme.title')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.settings.theme.subtitle')}</p>
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

        {/* Language (same tab as Style) */}
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('admin.settings.locale.title')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.settings.locale.subtitle')}</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex p-1 rounded-xl border bg-muted gap-1">
              {(['en', 'es', 'ja'] as const).map((lk) => (
                <button
                  key={lk}
                  type="button"
                  onClick={() => set('app_locale' as keyof typeof form, lk)}
                  className={cn(
                    'flex-1 py-2.5 text-sm font-medium transition-colors rounded-lg',
                    (form.app_locale ?? 'en') === lk
                      ? 'bg-card text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {lk === 'en' ? 'English' : lk === 'es' ? 'Español' : '日本語'}
                </button>
              ))}
            </div>
          </div>
        </div>
        </>}

        {/* Updates */}
        {activeTab === 'updates' && <>
          <div className="rounded-2xl border-2 border-border overflow-hidden">
            <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('admin.settings.updates.title')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.settings.updates.subtitle')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">

              {updateDone && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <span>✓</span>
                  <span>{t('admin.settings.updates.upToDate')}</span>
                </div>
              )}

              {!updateDone && (
                <Button onClick={handleCheckUpdate} disabled={checking} variant="outline">
                  {checking ? t('admin.settings.updates.checking') : t('admin.settings.updates.checkButton')}
                </Button>
              )}

              {updateInfo && !updateDone && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {t('admin.settings.updates.currentVersion')}: <span className="font-mono font-medium text-foreground">{updateInfo.current}</span>
                  </div>

                  {updateInfo.error && (
                    <p className="text-sm text-destructive">{updateInfo.error}</p>
                  )}

                  {!updateInfo.error && !updateInfo.has_update && (
                    <p className="text-sm text-muted-foreground">{t('admin.settings.updates.alreadyLatest')}</p>
                  )}

                  {!updateInfo.error && updateInfo.has_update && (
                    <div className="space-y-3">
                      <p className="text-sm">
                        {t('admin.settings.updates.available')}: <span className="font-mono font-medium text-primary">{updateInfo.latest}</span>
                      </p>
                      <Button onClick={handleApplyUpdate} disabled={applying}>
                        {applying ? t('admin.settings.updates.applying') : t('admin.settings.updates.applyButton')}
                      </Button>
                      {applying && (
                        <p className="text-xs text-muted-foreground">{t('admin.settings.updates.applyingHint')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </>}

        {/* Backup */}
        {activeTab === 'backup' && <>
          <div className="rounded-2xl border-2 border-border overflow-hidden">
            <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('admin.settings.backup.export.title')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.settings.backup.export.subtitle')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('admin.settings.backup.blocksTitle')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BACKUP_BLOCKS.map((block) => {
                    const active = exportBlocks.includes(block)
                    return (
                      <button
                        key={`export-${block}`}
                        type="button"
                        onClick={() => toggleBackupBlock(block, setExportBlocks)}
                        className={cn(
                          'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                          active ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span className="text-sm font-medium">{t(`admin.settings.backup.blocks.${block}`)}</span>
                        {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('admin.settings.backup.export.includeMedia')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.settings.backup.export.includeMediaHint')}</p>
                  </div>
                  <Switch
                    checked={includeMediaFiles}
                    disabled={!exportBlocks.includes('media')}
                    onCheckedChange={setIncludeMediaFiles}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                {t('admin.settings.backup.export.formatHint')}
              </div>

              <Button onClick={handleExportBackup} disabled={exportingBackup || exportBlocks.length === 0}>
                {exportingBackup ? t('admin.settings.backup.export.exporting') : t('admin.settings.backup.export.button')}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-border overflow-hidden">
            <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('admin.settings.backup.restore.title')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.settings.backup.restore.subtitle')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('admin.settings.backup.restore.step1')}</p>
                <Input type="file" accept=".zip,application/zip" onChange={handleBackupFileChange} />
                <p className="text-xs text-muted-foreground">
                  {backupFile ? backupFile.name : t('admin.settings.backup.restore.noFile')}
                </p>
                <Button onClick={handleInspectBackup} disabled={inspectingBackup || !backupFile} variant="outline">
                  {inspectingBackup ? t('admin.settings.backup.restore.inspecting') : t('admin.settings.backup.restore.inspectButton')}
                </Button>
              </div>

              {inspectInfo && (
                <>
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('admin.settings.backup.restore.step2')}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{t('admin.settings.backup.restore.exportedAt')}: <span className="text-foreground font-medium">{formatBackupDate(inspectInfo.exported_at)}</span></p>
                      <p>{t('admin.settings.backup.restore.appVersion')}: <span className="text-foreground font-medium">{inspectInfo.app_version ?? 'n/a'}</span></p>
                      <p>{t('admin.settings.backup.restore.mediaFiles')}: <span className="text-foreground font-medium">{inspectInfo.has_media_files ? t('common.yes') : t('common.no')}</span></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('admin.settings.backup.restore.step3')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {inspectInfo.available_blocks.map((block) => {
                        const active = restoreBlocks.includes(block)
                        return (
                          <button
                            key={`restore-${block}`}
                            type="button"
                            onClick={() => toggleBackupBlock(block, setRestoreBlocks)}
                            className={cn(
                              'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                              active ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium">{t(`admin.settings.backup.blocks.${block}`)}</p>
                              <p className="text-xs text-muted-foreground">{t('admin.settings.backup.restore.records', { count: inspectInfo.block_counts[block] ?? 0 })}</p>
                            </div>
                            {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {inspectInfo.warnings.length > 0 && (
                    <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 space-y-1">
                      <p className="text-sm font-medium">{t('admin.settings.backup.restore.warnings')}</p>
                      {inspectInfo.warnings.map((warning) => (
                        <p key={warning} className="text-xs text-muted-foreground">{warning}</p>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                    {t('admin.settings.backup.restore.rollbackHint')}
                  </div>

                  <Button onClick={handleRestoreBackup} disabled={restoringBackup || restoreBlocks.length === 0}>
                    {restoringBackup ? t('admin.settings.backup.restore.restoring') : t('admin.settings.backup.restore.button')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </>}

        {/* Security */}
        {activeTab === 'security' && <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 bg-muted/30 border-b">
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('admin.settings.security.title')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.settings.security.subtitle')}</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-pwd">{t('admin.settings.security.currentPwd')}</Label>
              <Input
                id="current-pwd"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">{t('admin.settings.security.newPwd')}</Label>
              <Input
                id="new-pwd"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">{t('admin.settings.security.newPwdHint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd-confirm">{t('admin.settings.security.newPwdConfirm')}</Label>
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
              {pwdSaving ? t('admin.settings.security.changing') : t('admin.settings.security.change')}
            </Button>
          </div>
        </div>}

        {/* Subscribers */}
        {activeTab === 'subscribers' && (() => {
          const f2 = form as Record<string, string>
          const hasGoogleCreds = !!savedCreds.google_client_id
          const switchOn = hasGoogleCreds ? f2.subscribers_enabled === '1' : localSubscribersOn
          return (
            <div className={cn(
              'rounded-2xl border-2 overflow-hidden transition-all duration-200',
              switchOn ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border',
            )}>
              <div className={cn(
                'flex items-center gap-4 px-6 py-4 transition-colors',
                switchOn ? 'bg-primary/5' : 'bg-card',
              )}>
                <div className={cn(
                  'p-2.5 rounded-xl shrink-0 transition-colors',
                  switchOn ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', switchOn ? 'text-foreground' : 'text-muted-foreground')}>
                    {t('admin.settings.subscribers.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('admin.settings.subscribers.subtitle')}</p>
                </div>
                <Switch
                  checked={switchOn}
                  onCheckedChange={(v) => {
                    if (hasGoogleCreds) set('subscribers_enabled' as keyof Settings, v ? '1' : '0')
                    else setLocalSubscribersOn(v)
                  }}
                />
              </div>
              <div className="px-6 py-5 border-t border-border/60 space-y-4">
                {hasGoogleCreds ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                    <div className="p-3 rounded-full bg-primary/15">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{t('admin.settings.subscribers.configured')}</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      onClick={() => setConfirmResetSubscribers(true)}
                    >
                      {t('admin.settings.subscribers.wantToChange')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border bg-muted/30 p-4 flex gap-3">
                      <GoogleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold">{t('admin.settings.subscribers.googleInfo.title')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.settings.subscribers.googleInfo.description')}</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>{t('admin.settings.subscribers.googleInfo.step1')}</li>
                          <li>{t('admin.settings.subscribers.googleInfo.step2')}</li>
                          <li>{t('admin.settings.subscribers.googleInfo.step3')}</li>
                          <li>{t('admin.settings.subscribers.googleInfo.step4')}</li>
                          <li>{t('admin.settings.subscribers.googleInfo.step5')}</li>
                        </ol>
                      </div>
                    </div>
                    {localSubscribersOn ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="google-client-id">{t('admin.settings.google.clientId')}</Label>
                          <Input
                            id="google-client-id"
                            value={(form as Record<string, string>).google_client_id ?? ''}
                            onChange={(e) => set('google_client_id' as keyof Settings, e.target.value)}
                            placeholder="xxxxxxxxx.apps.googleusercontent.com"
                            autoComplete="off"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="google-client-secret">{t('admin.settings.google.clientSecret')}</Label>
                          <Input
                            id="google-client-secret"
                            type="password"
                            value={(form as Record<string, string>).google_client_secret ?? ''}
                            onChange={(e) => set('google_client_secret' as keyof Settings, e.target.value)}
                            placeholder="GOCSPX-..."
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-4 py-3">
                        {t('admin.settings.subscribers.disabledHint')}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* reCAPTCHA */}
        {activeTab === 'recaptcha' && (() => {
          const f2 = form as Record<string, string>
          const hasRecaptchaCreds = !!savedCreds.recaptcha_site_key
          const switchOn = hasRecaptchaCreds ? f2.recaptcha_enabled === '1' : localRecaptchaOn
          return (
            <div className={cn(
              'rounded-2xl border-2 overflow-hidden transition-all duration-200',
              switchOn ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border',
            )}>
              <div className={cn(
                'flex items-center gap-4 px-6 py-4 transition-colors',
                switchOn ? 'bg-primary/5' : 'bg-card',
              )}>
                <div className={cn(
                  'p-2.5 rounded-xl shrink-0 transition-colors',
                  switchOn ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', switchOn ? 'text-foreground' : 'text-muted-foreground')}>
                    reCAPTCHA v3
                  </p>
                  <p className="text-xs text-muted-foreground">{t('admin.settings.recaptcha.subtitle')}</p>
                </div>
                <Switch
                  checked={switchOn}
                  onCheckedChange={(v) => {
                    if (hasRecaptchaCreds) set('recaptcha_enabled' as keyof Settings, v ? '1' : '0')
                    else setLocalRecaptchaOn(v)
                  }}
                />
              </div>
              <div className="px-6 py-5 border-t border-border/60 space-y-4">
                {hasRecaptchaCreds ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                    <div className="p-3 rounded-full bg-primary/15">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{t('admin.settings.recaptcha.configured')}</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      onClick={() => setConfirmResetRecaptcha(true)}
                    >
                      {t('admin.settings.recaptcha.wantToChange')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border bg-muted/30 p-4 flex gap-3">
                      <GoogleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold">{t('admin.settings.recaptcha.googleInfo.title')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.settings.recaptcha.googleInfo.description')}</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>{t('admin.settings.recaptcha.googleInfo.step1')}</li>
                          <li>{t('admin.settings.recaptcha.googleInfo.step2')}</li>
                          <li>{t('admin.settings.recaptcha.googleInfo.step3')}</li>
                          <li>{t('admin.settings.recaptcha.googleInfo.step4')}</li>
                        </ol>
                      </div>
                    </div>
                    {localRecaptchaOn ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="recaptcha-site-key">Site Key</Label>
                      <Input
                        id="recaptcha-site-key"
                        value={(form as Record<string, string>).recaptcha_site_key ?? ''}
                        onChange={(e) => set('recaptcha_site_key' as keyof Settings, e.target.value)}
                        placeholder="6Le..."
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="recaptcha-secret-key">Secret Key</Label>
                      <Input
                        id="recaptcha-secret-key"
                        type="password"
                        value={(form as Record<string, string>).recaptcha_secret_key ?? ''}
                        onChange={(e) => set('recaptcha_secret_key' as keyof Settings, e.target.value)}
                        placeholder="6Le..."
                        autoComplete="off"
                      />
                    </div>
                  </div>
                    ) : (
                      <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-4 py-3">
                        {t('admin.settings.recaptcha.disabledHint')}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })()}

      </div>

      <ConfirmDialog
        open={confirmResetSubscribers}
        title={t('admin.settings.subscribers.resetTitle')}
        description={t('admin.settings.subscribers.resetDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => handleDeleteCredentials('google')}
        onCancel={() => setConfirmResetSubscribers(false)}
      />
      <ConfirmDialog
        open={confirmResetRecaptcha}
        title={t('admin.settings.recaptcha.resetTitle')}
        description={t('admin.settings.recaptcha.resetDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => handleDeleteCredentials('recaptcha')}
        onCancel={() => setConfirmResetRecaptcha(false)}
      />
    </div>
  )
}
