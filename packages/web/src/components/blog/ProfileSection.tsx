import { applyComponentStyles } from '@/lib/utils'

interface ProfileSectionProps {
  styles: Record<string, string>
}

export default function ProfileSection({ styles }: ProfileSectionProps) {
  return (
    <section
      className="py-12 px-6 max-w-2xl mx-auto text-center"
      style={applyComponentStyles(styles)}
    >
      <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
          P
        </div>
      </div>
      <h2 className="text-xl font-semibold">About me</h2>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
        A short biography goes here. Edit this in the admin settings.
      </p>
    </section>
  )
}
