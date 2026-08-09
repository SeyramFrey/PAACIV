import sanitizeHtml from 'sanitize-html'

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Force la sécurité des liens sortants (fusionne avec les attributs existants).
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener nofollow', target: '_blank' }),
  },
}

/** Assainit du HTML riche (double barrière : enregistrement + rendu). */
export function assainirHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtml(html, OPTIONS)
}
