export interface User {
  id: number
  email: string
  created_at: string
}

export interface PostTranslation {
  id: number
  post_id: number
  locale: string
  title: string
  content: string
  excerpt: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  tags: string | null
  featured_image_id: number | null
  featured_image_url: string | null
  map_embed_url: string | null
  reading_time: string | null
  status: 'draft' | 'published' | 'hidden'
  notified_at: string | null
  author_id: number
  created_at: string
  updated_at: string
  likes_count: number
  comments_count?: number
  comments_pending_count?: number
  /** Locales that have a translation (e.g. ['es', 'ja']). Present in list() response. */
  translation_locales?: string[]
  /** Available locales (base + translated). Only present in show() response. */
  available_locales?: string[]
  /** Admin's app_locale at time of fetch. Only present in show() response. */
  base_locale?: string
  /** Full translation objects — only present in show() for admins. */
  translations?: PostTranslation[]
}

export interface Comment {
  id: number
  post_id: number
  author_name: string
  content: string
  status: 'pending' | 'approved' | 'spam'
  is_subscriber?: boolean
  avatar_url?: string | null
  created_at: string
  post?: { id: number; title: string; slug: string }
}

export interface Subscriber {
  id: number
  name: string
  email: string
  avatar_url: string | null
  subscribed: boolean
  created_at: string
}

export interface Setting {
  key: string
  value: string
}

export interface Settings {
  blog_name: string
  blog_description: string
  /** DB key: blog_theme — set by installer */
  blog_theme: 'default' | 'minimal' | 'dark'
  active_style_collection: string
  /** UI language for blog visitors */
  app_locale: string
  setup_complete: string
  // Blog logo
  blog_logo_id: string
  blog_logo_url: string
  // Hero Banner
  hero_text: string
  hero_image_id: string
  hero_image_url: string
  // Profile / About
  profile_name: string
  profile_summary: string
  profile_description: string
  profile_image_id: string
  profile_image_url: string
  profile_cover_id: string
  profile_cover_url: string
  profile_title: string
  /** JSON array: [{role,company,period,description,tags:[]}] */
  profile_experience: string
  /** JSON array: [{name,skills:[]}] */
  profile_skills: string
  /** JSON array: [{url,title,description}] */
  profile_gallery: string
  /** JSON array: [{degree,institution,period}] */
  profile_education: string
  /** JSON array: [{name,url?}] */
  profile_certifications: string
  /** JSON array: [{name,role,text,linkedin?}] */
  profile_testimonials: string
  // Social links
  social_linkedin: string
  social_instagram: string
  social_youtube: string
  social_facebook: string
  // Features
  /** '1' = enabled (default), '0' = disabled */
  comments_enabled: string
  /** Numeric string — max tags shown in Tag Cloud widget (default "6") */
  tags_max_count: string
  /** Google OAuth client ID (public) */
  google_client_id: string
  /** '1' = subscribers feature enabled, '0' = disabled */
  subscribers_enabled: string
  /** '1' = reCAPTCHA v3 enabled on comment form, '0' = disabled */
  recaptcha_enabled: string
  /** '1' = post likes enabled, '0' = disabled */
  likes_enabled: string
  [key: string]: string
}

export interface ImageUsageRecord {
  kind: 'setting' | 'post_featured' | 'post_content' | 'translation_content'
  setting_key: string | null
  post_id: number | null
  locale: string | null
  titles: string[]
}

export interface ImageAsset {
  id: number
  post_id: number | null
  filename: string
  original_name: string
  mime_type: string
  file_size: number
  url: string
  created_at: string
  usage_count: number
  usage_titles: string[]
  usage_records: ImageUsageRecord[]
}

export interface ComponentDefinition {
  id: number
  name: string
  label: string
  description: string
}

export interface ComponentStyle {
  id: number
  component_definition_id: number
  style_collection_id: number
  styles_config: Record<string, string>
}

export interface StyleCollection {
  id: number
  name: string
  label: string
  is_default: boolean
  component_styles: ComponentStyle[]
}

export interface PageComponent {
  id: number
  page_id: number
  component_definition_id: number
  /** 'component' = top-level section; 'sub-component' = child of parent_id */
  type: 'component' | 'sub-component'
  /** id of the parent component; null for top-level components */
  parent_id: number | null
  /** true if this component has its own dedicated public route (e.g. /post/{slug}) */
  has_own_page: boolean
  is_visible: boolean
  display_order: number
  name: string
  label: string
  styles: Record<string, string>
}

export interface Page {
  id: number
  slug: string
  title: string
  components: PageComponent[]
}

export interface ResourceStats {
  total_resources: number
  total_bytes: number
  unused_resources: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    resource_stats?: ResourceStats
  }
}

export interface ApiResponse<T> {
  data: T
}

export interface TagItem {
  tag: string
  count: number
}

export interface LikeStatus {
  count: number
  liked: boolean
}

export interface AnalyticsSummary {
  /** hour (0–23) → view count for today */
  today: Record<number, number>
  /** 'YYYY-MM-DD' → view count for last 7 days */
  week: Record<string, number>
  /** 'YYYY-MM-DD' → view count for last 30 days */
  month: Record<string, number>
}
