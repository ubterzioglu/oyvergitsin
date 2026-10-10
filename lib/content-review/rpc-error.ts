// publish/verify Postgres fonksiyonlarının hata kodlarını HTTP durumuna çevirir
// (bkz. supabase/migrations/015_content_editing.sql).
const CONFLICT = '40001'
// Aynı parti × eksen için iki ilk oluşturma yarışırsa UNIQUE(party_id, axis_id) ihlali.
const UNIQUE_VIOLATION = '23505'
const INVALID_INPUT = '22023'

export interface RpcErrorLike {
  code?: string | null
  message?: string | null
}

export interface MappedRpcError {
  status: number
  message: string
}

export function mapContentRpcError(error: RpcErrorLike): MappedRpcError {
  if (error.code === CONFLICT) {
    return { status: 409, message: error.message || 'Kayıt siz düzenlerken değişti. Sayfayı yenileyin.' }
  }
  if (error.code === UNIQUE_VIOLATION) {
    return { status: 409, message: 'Bu konum siz düzenlerken başka biri tarafından oluşturuldu. Sayfayı yenileyin.' }
  }
  if (error.code === INVALID_INPUT) {
    return { status: 400, message: error.message || 'Geçersiz istek.' }
  }
  return { status: 500, message: 'İşlem başarısız oldu.' }
}
