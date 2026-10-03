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
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function truncate(text: string, max = 160): string {
  if (text.length <= max) {
    return text
  }
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
      .limit(6)

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

export async function LatestNews() {
  const posts = await fetchLatestNews()

  if (posts.length === 0) {
    return null
  }

  return (
    <section className="bg-white py-20">
      <Container>
        <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
          Son Haberler
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="flex flex-col transition-all duration-300 hover:border-border-strong hover:shadow-elevated"
            >
              <a
                href={post.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-badge text-base font-semibold text-ink-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {post.title}
              </a>
              {post.summary && (
                <p className="mt-2 text-sm text-ink-secondary">{truncate(post.summary)}</p>
              )}
              <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-muted">
                <span>{post.source_name}</span>
                {/* Yayın tarihi bir veri etiketi: mono + tabular hizalanır. */}
                <span className="data-figure shrink-0">{formatDate(post.published_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
