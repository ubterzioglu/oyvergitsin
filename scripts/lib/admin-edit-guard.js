// Panelden yapılmış içerik düzenlemelerini script'lerin ezmesini engeller.
//
// Parti konumları artık admin panelinden kanıtıyla yayınlanıyor (migration 015,
// content_change_logs). Seed/türetme script'leri konumları ve kanıtları dosyadan
// yeniden yazar; panelden yapılmış bir yayın varsa bu, o düzenlemeyi sessizce siler.
// Bu yüzden script, panel kaydı varken açık bir bayrak olmadan yazmaz.

const FORCE_FLAG = '--force-overwrite-admin-edits'

/**
 * Saf karar: devam edilsin mi?
 * @param {{ adminEditCount: number, force: boolean }} input
 * @returns {{ proceed: boolean, logSeed: boolean, message: string | null }}
 */
function decideAdminEditGuard({ adminEditCount, force }) {
  if (adminEditCount === 0) {
    return { proceed: true, logSeed: false, message: null }
  }
  if (force) {
    return {
      proceed: true,
      logSeed: true,
      message: `UYARI: Panelden yapılmış ${adminEditCount} düzenleme ${FORCE_FLAG} ile eziliyor.`,
    }
  }
  return {
    proceed: false,
    logSeed: false,
    message:
      `Panelden yapılmış ${adminEditCount} içerik düzenlemesi var; bu script onları ezer.\n` +
      'Doğruluk kaynağı artık veritabanı (admin paneli). Konumları panelden güncelleyin.\n' +
      `Yine de dosyadan yeniden yazmak istiyorsanız: ${FORCE_FLAG}`,
  }
}

/**
 * Panel düzenlemesi varsa ve zorlanmadıysa süreci durdurur.
 * Tablo yoksa (migration 015 uygulanmamış) panel düzenlemesi de olamaz; devam edilir.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ script: string, argv?: string[] }} options
 */
async function assertNoAdminEdits(supabase, { script, argv = process.argv }) {
  const { count, error } = await supabase
    .from('content_change_logs')
    .select('id', { count: 'exact', head: true })
    .eq('subject_table', 'party_positions')
    .in('action', ['publish', 'verify'])

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { logSeed: false }
    }
    throw new Error(`content_change_logs okunamadı: ${error.message}`)
  }

  const decision = decideAdminEditGuard({ adminEditCount: count ?? 0, force: argv.includes(FORCE_FLAG) })
  if (decision.message) {
    console.error(decision.message)
  }
  if (!decision.proceed) {
    process.exit(1)
  }
  if (decision.logSeed) {
    console.warn(`${script}: zorla yeniden yazma günlüğe kaydedilecek.`)
  }
  return { logSeed: decision.logSeed }
}

module.exports = { FORCE_FLAG, decideAdminEditGuard, assertNoAdminEdits }
