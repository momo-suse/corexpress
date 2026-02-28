import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { useBlogPage } from '@/hooks/useBlogPage'
import { updatePageComponent } from '@/api/pages'
import { toast } from '@/hooks/useToast'
import type { PageComponent, Settings } from '@/types/api'

const COMPONENT_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  profile: 'Profile / About',
  'post-list': 'Post List',
  'social-links': 'Social Links',
}

export default function SettingsPage() {
  const { data, isLoading } = useSettings()
  const { data: pageData, isLoading: pageLoading } = useBlogPage()
  const { mutateAsync: save, isPending: saving } = useMutateSettings()

  const [form, setForm] = useState<Partial<Settings>>({})
  const [componentVisibility, setComponentVisibility] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  function set(key: keyof Settings, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }


  function getVisible(c: PageComponent) {
    return componentVisibility[c.id] !== undefined ? componentVisibility[c.id] : c.is_visible
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Save component visibility changes
      const components: PageComponent[] = pageData?.data.components ?? []
      await Promise.all(
        components.map((c) => {
          const visible = getVisible(c)
          if (visible !== c.is_visible) {
            return updatePageComponent(c.id, { is_visible: visible })
          }
          return Promise.resolve()
        })
      )

      // Save settings
      await save(form)
      toast({ title: 'Settings saved.' })
    } catch {
      toast({ title: 'Failed to save settings.', variant: 'destructive' })
    }
  }

  if (isLoading || pageLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  const components: PageComponent[] = pageData?.data.components ?? []

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Blog info */}
        <Card>
          <CardHeader><CardTitle>Blog</CardTitle></CardHeader>
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
          </CardContent>
        </Card>

        {/* Blog sections */}
        {components.length > 0 && (
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
                    onCheckedChange={(checked) =>
                      setComponentVisibility((prev) => ({ ...prev, [c.id]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Admin theme */}
        <Card>
          <CardHeader><CardTitle>Admin theme</CardTitle></CardHeader>
          <CardContent>
            <Select
              value={form.blog_theme ?? 'default'}
              onValueChange={(v) => set('blog_theme', v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Social links */}
        <Card>
          <CardHeader><CardTitle>Social links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </form>
    </div>
  )
}
