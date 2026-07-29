/**
 * Çekirdek soru setinin 5'li Likert ölçeği (rapor §4).
 *
 * Bu değerler kanonik kaynaktır. scripts/data/axis-model-v2.js aynı ölçeği
 * seed tarafı için tekrar tanımlar; ikisinin ayrışmadığını lib/scoring/likert.test.ts
 * doğrular.
 */

export const LIKERT_MAX = 25

export const LIKERT_SCORES: Record<string, number> = {
  strongly_agree: 25,
  agree: 12,
  neutral: 0,
  disagree: -12,
  strongly_disagree: -25,
}

/**
 * "Fikrim yok" kasıtlı olarak bu tabloda YOKTUR. Puanlama kuralı yazılmadığı
 * için motor bu cevabı hem paydan hem paydadan düşer; "Kararsızım" ise 0 puanlı
 * gerçek bir cevaptır ve paydaya girer (rapor §5.1).
 */
export const NO_OPINION_VALUE = 'no_opinion'

/** 7'li ölçek için simetrik puanlar (rapor §5.3). */
export const LIKERT_7_SCORES: Record<string, number> = {
  strongly_agree: 25,
  agree: 17,
  slightly_agree: 8,
  neutral: 0,
  slightly_disagree: -8,
  disagree: -17,
  strongly_disagree: -25,
}
