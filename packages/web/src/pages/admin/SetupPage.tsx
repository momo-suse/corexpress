import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useBlogPage } from '@/hooks/useBlogPage'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { getStyleCollections } from '@/api/styleCollections'
import { updatePageComponent } from '@/api/pages'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/useToast'
import type { PageComponent } from '@/types/api'

export default function SetupPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: pageData, isLoading: pageLoading } = useBlogPage()
  const { data: settingsData, isLoading: settingsLoading } = useSettings()
  const { data: collectionsData } = useQuery({
    queryKey: ['style-collections'],
    queryFn: getStyleCollections,
  })
  const { mutateAsync: saveSettings } = useMutateSettings()

  const [saving, setSaving] = useState(false)
  const [activeCollection, setActiveCollection] = useState<string>('')
  const [componentVisibility, setComponentVisibility] = useState<Record<number, boolean>>({})

  const isLoading = pageLoading || settingsLoading

  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  const components: PageComponent[] = pageData?.data.components ?? []
  const collections = collectionsData?.data ?? []
  const currentCollection = activeCollection || settingsData?.data.active_style_collection || ''

  function getVisible(c: PageComponent) {
    return componentVisibility[c.id] !== undefined ? componentVisibility[c.id] : c.is_visible
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Save component visibility
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
      await saveSettings({
        active_style_collection: currentCollection,
        setup_complete: '1',
      })

      qc.invalidateQueries({ queryKey: ['pages', 'home'] })
      toast({ title: 'Setup saved.' })
      navigate('/cx-admin', { replace: true })
    } catch {
      toast({ title: 'Failed to save setup.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const COMPONENT_LABELS: Record<string, string> = {
    hero: 'Hero Banner',
    profile: 'Profile / About',
    'post-list': 'Post List',
    'social-links': 'Social Links',
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blog Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which sections appear on your blog and select a style.
        </p>
      </div>

      {/* Components */}
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

      {/* Style collection */}
      {collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Blog Style</CardTitle>
            <CardDescription>Select the visual style for your blog.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={currentCollection} onValueChange={setActiveCollection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.name}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save & go to dashboard'}
      </Button>
    </div>
  )
}
