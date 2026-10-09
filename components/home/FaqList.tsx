interface FaqItem {
  question: string
  answer: string
  icon: string
}

// Cevaplar <details> içinde ama DOM'da duruyor: arama motorları ve FAQPage
// JSON-LD ile görünür metin birebir aynı kalıyor.
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border-2 border-ink-primary bg-white shadow-[4px_4px_0_0_#191C1E] open:bg-accent-tint"
        >
          <summary className="flex cursor-pointer list-none items-center gap-4 rounded-2xl px-5 py-4 text-left font-bold text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="text-2xl">
              {item.icon}
            </span>
            <span className="flex-1">{item.question}</span>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink-primary bg-white text-lg leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <p className="px-5 pb-5 pl-[4.25rem] text-ink-secondary">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
