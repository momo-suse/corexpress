import { applyComponentStyles } from '@/lib/utils'

interface HeroSectionProps {
  styles: Record<string, string>
}

export default function HeroSection({ styles }: HeroSectionProps) {
  return (
    <section
      className="py-20 px-6 text-center"
      style={applyComponentStyles(styles)}
    >
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Welcome to my blog
      </h1>
      <p className="mt-4 text-lg opacity-80">
        Thoughts, stories and ideas.
      </p>
    </section>
  )
}
