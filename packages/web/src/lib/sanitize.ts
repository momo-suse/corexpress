import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'strong', 'em', 'u', 's', 'mark',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'figure', 'figcaption', 'div', 'span',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'style',
  'target', 'rel', 'width', 'height', 'id',
]

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}
