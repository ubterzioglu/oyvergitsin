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

// Kart başına süre; 8 kartta tam tur ~96 sn (çok yavaş akış)
const SECONDS_PER_CARD = 12

function renderCard(post: NewsPost, isClone: boolean) {
  return (
    <div
      key={isClone ? `${post.id}-clone` : post.id}
      className={`flex-shrink-0 pr-4${isClone ? ' radar-clone' : ''}`}
      aria-hidden={isClone || undefined}
    >
      <Card
        className="flex h-full w-80 sm:w-96 flex-col justify-between !rounded-2xl border-2 !border-ink-primary !bg-surface !p-6 shadow-[4px_4px_0_0_#191C1E] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none"
      >
        <div className="mb-4">
          <a
            href={post.original_url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={isClone ? -1 : undefined}
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
    </div>
  )
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
      </Container>

      {/* Yavaş, kesintisiz sola akan şerit: liste iki kez basılır, -50% kaydırılıp döngüye girer */}
      <div className="radar-marquee overflow-hidden pt-2 pb-6 hide-scrollbar">
        <div
          className="radar-track flex w-max pl-4"
          style={{ animationDuration: `${posts.length * SECONDS_PER_CARD}s` }}
        >
          {posts.map((post) => renderCard(post, false))}
          {posts.map((post) => renderCard(post, true))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes radar-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .radar-track {
          animation-name: radar-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .radar-marquee:hover .radar-track,
        .radar-marquee:focus-within .radar-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .radar-track { animation: none; }
          .radar-marquee { overflow-x: auto; }
          .radar-clone { display: none; }
        }
      `}} />
    </div>
  )
}
