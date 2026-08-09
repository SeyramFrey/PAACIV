const BUCKET = 'patrimoine'

export function imageUrl(chemin: string): string {
  if (/^https?:\/\//i.test(chemin)) return chemin
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/${BUCKET}/${chemin}`
}
