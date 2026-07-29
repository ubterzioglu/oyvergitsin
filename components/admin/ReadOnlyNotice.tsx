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
    <div className="mb-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">Bu sayfa salt okunurdur.</p>
      <p className="mt-1 text-sm text-amber-800">
        İçerik koddan yönetilir: <code className="rounded bg-amber-100 px-1">{source}</code>
        {command && (
          <>
            {' '}
            — değişiklik sonrası <code className="rounded bg-amber-100 px-1">{command}</code>
          </>
        )}
        . Elle düzenleme, puanlama kuralları ile parti kanıt kayıtlarını birbirinden ayırıp
        sonuçları sessizce bozabileceği için kapatıldı.{' '}
        <Link href="/admin" className="underline">
          Ayrıntı
        </Link>
      </p>
    </div>
  )
}
