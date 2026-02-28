import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useBlogPage } from '@/hooks/useBlogPage'
import { useMutateSettings } from '@/hooks/useSettings'
import { updatePageComponent } from '@/api/pages'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/useToast'
import type { PageComponent } from '@/types/api'

const COMPONENT_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  profile: 'Profile / About',
  'post-list': 'Post List',
  'social-links': 'Social Links',
}

export default function SetupPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: pageData, isLoading: pageLoading } = useBlogPage()
  const { mutateAsync: saveSettings } = useMutateSettings()

  const [saving, setSaving] = useState(false)
  const [componentVisibility, setComponentVisibility] = useState<Record<number, boolean>>({})

  if (pageLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  const components: PageComponent[] = pageData?.data.components ?? []

  function getVisible(c: PageComponent) {
    return componentVisibility[c.id] !== undefined ? componentVisibility[c.id] : c.is_visible
  }

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all(
        components.map((c) => {
          const visible = getVisible(c)
          if (visible !== c.is_visible) {
            return updatePageComponent(c.id, { is_visible: visible })
          }
          return Promise.resolve()
        })
      )

      // Only mark setup as complete — do not override active_style_collection
      await saveSettings({ setup_complete: '1' })

      qc.invalidateQueries({ queryKey: ['pages', 'home'] })
      toast({ title: 'Setup saved.' })
      navigate('/cx-admin', { replace: true })
    } catch {
      toast({ title: 'Failed to save setup.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blog Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which sections appear on your blog homepage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Sections</CardTitle>
          <CardDescription>Toggle which sections are visible on your blog homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {components.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <Label htmlFor={`comp-${c.id}`} className="font-normal cursor-pointer">
                {COMPONENT_LABELS[c.name] ?? c.name}
              </Label>
              <Switch
                id={`comp-${c.id}`}
                checked={getVisible(c)}
                onCheckedChange={(checked) =>
                  setComponentVisibility((prev) => ({ ...prev, [c.id]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save & go to dashboard'}
      </Button>
    </div>
  )
}
