/**
 * Minimal HTML sanitizer for feed summaries. Feeds are untrusted input, so we
 * strip dangerous elements, event handlers, and all remaining tags, leaving
 * plain text. This is not a general-purpose sanitizer — it produces text only.
 */

const BASIC_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
}

export function sanitizeSummary(input: string, maxLength = 600): string {
  let text = input

  // Remove script/style/iframe blocks entirely, including their content.
  text = text.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, ' ')

  // Remove any lingering event-handler attributes defensively (before tag strip).
  text = text.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')

  // Strip all remaining tags.
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode a small set of common entities.
  text = text.replace(/&[a-z#0-9]+;/gi, (match) => BASIC_ENTITIES[match.toLowerCase()] ?? match)

  // Collapse whitespace.
  text = text.replace(/\s+/g, ' ').trim()

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).trimEnd()
  }

  return text
}
