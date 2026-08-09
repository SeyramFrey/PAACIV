import { assainirHtml } from '@/lib/richtext'

const STYLES =
  'max-w-none text-encre/90 ' +
  '[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-brun ' +
  '[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-brun ' +
  '[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_li]:mb-1 [&_a]:text-brun [&_a]:underline ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-or [&_blockquote]:pl-4 [&_blockquote]:italic'

/** Rendu public de HTML riche : ré-assaini avant injection (défense en profondeur). */
export function TexteRiche({ html, className }: { html: string | null | undefined; className?: string }) {
  const propre = assainirHtml(html)
  if (!propre) return null
  return (
    <div
      className={className ? `${className} ${STYLES}` : STYLES}
      dangerouslySetInnerHTML={{ __html: propre }}
    />
  )
}
