import { describe, expect, it } from 'vitest'
import { mapContentRpcError } from './rpc-error'

describe('mapContentRpcError', () => {
  it('çakışmayı 409, geçersiz girdiyi 400 yapar ve veritabanı mesajını taşır', () => {
    expect(mapContentRpcError({ code: '40001', message: 'değişti' })).toEqual({ status: 409, message: 'değişti' })
    expect(mapContentRpcError({ code: '22023', message: 'puan' })).toEqual({ status: 400, message: 'puan' })
  })

  it('eşzamanlı ilk oluşturmadaki UNIQUE ihlalini 409 yapar', () => {
    expect(mapContentRpcError({ code: '23505', message: 'duplicate key' }).status).toBe(409)
  })

  it('bilinmeyen hatalarda iç mesajı sızdırmaz', () => {
    expect(mapContentRpcError({ code: '42501', message: 'permission denied for function' })).toEqual({
      status: 500,
      message: 'İşlem başarısız oldu.',
    })
  })
})
