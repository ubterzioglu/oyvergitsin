'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  totalSessions: number
  completedSessions: number
  totalQuestions: number
  totalParties: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    completedSessions: 0,
    totalQuestions: 0,
    totalParties: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [sessionsRes, questionsRes, partiesRes] = await Promise.all([
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('parties').select('*', { count: 'exact', head: true })
      ])

      const { count: completedCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null)

      setStats({
        totalSessions: sessionsRes.count || 0,
        completedSessions: completedCount || 0,
        totalQuestions: questionsRes.count || 0,
        totalParties: partiesRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {loading ? (
        <div className="text-gray-600">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.totalSessions}</div>
            <div className="text-gray-600">Toplam Oturum</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">{stats.completedSessions}</div>
            <div className="text-gray-600">Tamamlanan Oturum</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.totalQuestions}</div>
            <div className="text-gray-600">Toplam Soru</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">{stats.totalParties}</div>
            <div className="text-gray-600">Toplam Parti</div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/axes"
            className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
          >
            <h3 className="font-semibold text-blue-900">Eksenleri Yönet</h3>
            <p className="text-sm text-blue-700">İdeolojik eksenleri düzenle</p>
          </a>
          <a
            href="/admin/questions"
            className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
          >
            <h3 className="font-semibold text-green-900">Soruları Yönet</h3>
            <p className="text-sm text-green-700">Anket sorularını düzenle</p>
          </a>
          <a
            href="/admin/parties"
            className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
          >
            <h3 className="font-semibold text-purple-900">Partileri Yönet</h3>
            <p className="text-sm text-purple-700">Parti bilgilerini düzenle</p>
          </a>
        </div>
      </div>
    </div>
  )
}
