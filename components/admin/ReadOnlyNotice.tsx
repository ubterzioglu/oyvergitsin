import Link from 'next/link'

interface ReadOnlyNoticeProps {
  /** Bu içeriğin hangi dosyadan yönetildiği. */
  source: string
  /** İçeriği yeniden yazan komut, varsa. */
  command?: string
}

/**
 * Anket içeriği (eksenler, sorular, puanlama kuralları, parti konumları) artık
 * panelden düzenlenmez.
 *
 * Gerekçe: bu dört tablo birbirine bağlı. Elle yapılan bir düzenleme —
 * bir eksenin kutbunu ters çevirmek, bir maddenin puanını değiştirmek, bir
 * parti skorunu güncellemek — kanıt kayıtlarını ve türetme gerekçelerini
 * sessizce tutarsız hale getirir; sonuçlar bozulur ama hiçbir yerde hata
 * görünmez. İçerik kodda tutulur, sürüm geçmişi git'te kalır ve değişiklikler
 * testlerden geçer.
 */
export function ReadOnlyNotice({ source, command }: ReadOnlyNoticeProps) {
  return (
    <div className="mb-6 rounded-card border-l-4 border-border-strong bg-surface-muted p-4">
      <p className="text-sm font-medium text-ink-primary">Bu sayfa salt okunurdur.</p>
      <p className="mt-1 text-sm text-ink-secondary">
        İçerik koddan yönetilir: <code className="data-figure rounded-badge bg-border px-1 text-ink-primary">{source}</code>
        {command && (
          <>
            {' '}
            — değişiklik sonrası <code className="data-figure rounded-badge bg-border px-1 text-ink-primary">{command}</code>
          </>
        )}
        . Elle düzenleme, puanlama kuralları ile parti kanıt kayıtlarını birbirinden ayırıp
        sonuçları sessizce bozabileceği için kapatıldı.{' '}
        <Link
          href="/admin"
          className="rounded-sm text-accent underline underline-offset-4 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Ayrıntı
        </Link>
      </p>
    </div>
  )
}
