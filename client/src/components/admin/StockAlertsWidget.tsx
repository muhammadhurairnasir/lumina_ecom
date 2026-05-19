'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface AlertData {
  summary: {
    critical: number
    low: number
    currentSeason: string
  }
  alerts: Array<{
    productName: string
    currentStock: number
    daysOfStockLeft: number
    seasonalMultiplier: number
    recommendedRestockQty: number
    isEvergreen: boolean
    activeSeasonalRules: string[]
  }>
}

export default function StockAlertsWidget() {
  const [alerts, setAlerts] = useState<AlertData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stock/alerts')
      .then(res => setAlerts(res.data.data))
      .catch(() => setAlerts(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!alerts) return null
  if (alerts.summary.critical === 0 && alerts.summary.low === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden">
      {/* Season header */}
      <div className="bg-blue-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-blue-700">
          🌤 Current Season: {alerts.summary.currentSeason}
        </span>
        <Link href="/admin/stock" className="text-sm text-blue-600 hover:underline font-medium">
          View Full Forecast →
        </Link>
      </div>

      {/* Critical bar */}
      {alerts.summary.critical > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2">
          <p className="text-sm font-semibold text-red-700">
            🚨 {alerts.summary.critical} product{alerts.summary.critical > 1 ? 's' : ''} critically low — under 7 days of stock
          </p>
        </div>
      )}

      {/* Low bar */}
      {alerts.summary.low > 0 && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 py-2">
          <p className="text-sm font-semibold text-orange-700">
            ⚠️ {alerts.summary.low} product{alerts.summary.low > 1 ? 's' : ''} running low — under 30 days of stock
          </p>
        </div>
      )}

      {/* Product list */}
      <div className="divide-y divide-gray-200 bg-white">
        {(alerts.alerts || [])
          .filter(p => p.daysOfStockLeft < 30)
          .slice(0, 5)
          .map((p, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {p.productName}
                  {p.isEvergreen && (
                    <span className="ml-2 text-xs text-green-600">
                      🌿 Evergreen
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Stock: {p.currentStock} units
                  {p.activeSeasonalRules.length > 0 && !p.isEvergreen && (
                    <span className="ml-2 text-blue-600">
                      {p.seasonalMultiplier}x {p.activeSeasonalRules[0]}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.daysOfStockLeft < 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                {p.daysOfStockLeft < 7 ? `${p.daysOfStockLeft}d left` : `${p.daysOfStockLeft}d left`}
              </span>
              {p.recommendedRestockQty > 0 && (
                <span className="text-xs text-gray-500">
                  Restock: +{p.recommendedRestockQty}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
