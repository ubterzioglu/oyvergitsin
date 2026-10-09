import { getPublicServerClient } from '@/lib/supabase/route'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'

interface NewsPost {
  id: string
  title: string
  summary: string | null
  source_name: string
  original_url: string
  published_at: string | null
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

async function fetchLatestNews(): Promise<NewsPost[]> {
  try {
    const supabase = getPublicServerClient()
    const { data, error } = await supabase
      .from('news_posts')
      .select('id, title, summary, source_name, original_url, published_at')
      .eq('status', 'active')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('Error fetching latest news:', error)
      return []
    }
    return (data as NewsPost[]) || []
  } catch (error) {
    console.error('Error fetching latest news:', error)
    return []
  }
}

export async function NewsRadarSlideshow() {
  const posts = await fetchLatestNews()

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="w-full border-y-2 border-ink-primary bg-white py-10">
      <Container>
        <div className="flex items-center gap-4 mb-4 pl-2">
          <div className="h-3 w-3 rounded-full border-2 border-ink-primary bg-accent motion-safe:animate-pulse"></div>
          <h2 className="font-heading text-xl font-extrabold text-ink-primary">
            Siyaset radarı: son haberler
          </h2>
        </div>
        
        {/* CSS Scrolling Container */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 hide-scrollbar">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="flex-shrink-0 w-80 sm:w-96 snap-start flex flex-col justify-between !rounded-2xl border-2 !border-ink-primary !bg-surface !p-6 shadow-[4px_4px_0_0_#191C1E] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none"
            >
              <div className="mb-4">
                <a
                  href={post.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-heading text-base font-semibold text-ink-primary hover:text-accent focus-visible:outline-none"
                >
                  {post.title}
                </a>
                {post.summary && (
                  <p className="mt-2 text-sm text-ink-secondary">{truncate(post.summary)}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                <span className="font-medium text-accent">{post.source_name}</span>
                <span className="data-figure shrink-0">{formatDate(post.published_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
