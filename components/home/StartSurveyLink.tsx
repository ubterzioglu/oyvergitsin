import Link from 'next/link'
import { Button } from '@/components/ui/Button'

/**
 * Erişilebilirlik düzeltmesi (devir belgesi §6.2, "Hepsi" maddesi):
 * `<Link>` içine sarılı `<Button>`'da Tab odağı dıştaki `<a>` öğesine gidiyor,
 * oysa odak halkası `<button>` üzerinde tanımlı — klavyeyle gezen kullanıcı
 * odağın nerede olduğunu göremiyordu.
 *
 * Çözüm: halka odağı gerçekten alan `<a>` üzerine taşındı, içteki buton
 * `tabIndex={-1}` ile odak sırasından çıkarıldı. Böylece tek bir durak kalıyor
 * ve halka görünür oluyor. Buton bileşeninin kendisi değiştirilmedi (B11'in
 * sahipliğinde).
 */
export function StartSurveyLink({ label = 'Anketi Başlat' }: { label?: string }) {
  return (
    <Link
      href="/consent"
      className="inline-flex rounded-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <Button variant="primary" tabIndex={-1}>
        {label}
      </Button>
    </Link>
  )
}
