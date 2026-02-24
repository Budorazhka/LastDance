import { useState, useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'
import { useNavigate } from 'react-router-dom'
import type { CityMapPoint } from '@/types/dashboard'

interface GlobeMapProps {
  cities: CityMapPoint[]
}

const countryLabels = [
  { isCountry: true, id: 'georgia', name: 'Грузия', coordinates: [43.5, 42.1] as [number, number] },
  { isCountry: true, id: 'thailand', name: 'Таиланд', coordinates: [100.9, 15.8] as [number, number] },
  { isCountry: true, id: 'turkey', name: 'Турция', coordinates: [35.2, 39.0] as [number, number] },
]

const ZOOM_TARGETS: Record<string, { lat: number; lng: number; altitude: number }> = {
  georgia: { lat: 42.3, lng: 43.5, altitude: 1.2 },
  thailand: { lat: 13.7, lng: 100.5, altitude: 1.2 },
  turkey: { lat: 39.0, lng: 35.2, altitude: 1.2 },
}

export function GlobeMap({ cities }: GlobeMapProps) {
  const globeEl = useRef<any>(null)
  const navigate = useNavigate()
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] })
  const [zoomLevel, setZoomLevel] = useState<'far' | 'countries' | 'cities'>('far')

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
  }, [])

  useEffect(() => {
    let animationFrameId: number
    let lastLevel = 'far'

    const checkZoom = () => {
      if (globeEl.current) {
        const pov = globeEl.current.pointOfView()
        if (pov && typeof pov.altitude !== 'undefined') {
          const alt = pov.altitude
          let newLevel: 'far' | 'countries' | 'cities' = 'far'
          if (alt <= 0.8) newLevel = 'cities'
          else if (alt <= 1.8) newLevel = 'countries'
          else newLevel = 'far'
          if (newLevel !== lastLevel) {
            lastLevel = newLevel
            setZoomLevel(newLevel)
          }
        }
      }
      animationFrameId = requestAnimationFrame(checkZoom)
    }
    const timer = setTimeout(() => {
      animationFrameId = requestAnimationFrame(checkZoom)
    }, 1000)
    return () => {
      clearTimeout(timer)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const flyTo = (key: string) => {
    const target = ZOOM_TARGETS[key]
    if (globeEl.current && target) {
      globeEl.current.pointOfView(
        { lat: target.lat, lng: target.lng, altitude: target.altitude },
        800
      )
    }
  }

  const handleCityClick = (city: CityMapPoint) => {
    navigate(`/city/${city.id}`)
  }

  return (
    <div className={`relative w-full h-full min-h-[600px] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden cursor-move zoom-${zoomLevel}`}>
      <style>{`
        .zoom-far .country-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-far .city-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-countries .country-label { opacity: 1; transition: opacity 0.5s ease; }
        .zoom-countries .city-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-cities .country-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-cities .city-label { opacity: 1; transition: opacity 0.5s ease; }
      `}</style>

      {/* Кнопки быстрого зума */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
        {(['georgia', 'thailand', 'turkey'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => flyTo(key)}
            className="rounded-md border border-slate-600 bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-200 shadow hover:bg-slate-700 hover:text-white"
          >
            {countryLabels.find(c => c.id === key)?.name ?? key}
          </button>
        ))}
      </div>

      {/* Легенда */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-md border border-slate-600 bg-slate-800/90 px-2.5 py-1.5 text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" /> Наши города
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500 opacity-60" /> Наши страны
        </span>
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries.features}
        polygonAltitude={0.005}
        polygonCapColor={(d: any) => {
          const name = d.properties?.NAME || ''
          const isActive = ['Georgia', 'Thailand', 'Turkey'].includes(name)
          if (isActive) return '#ef4444'
          const colors = ['#334155', '#475569', '#64748b', '#273f5e']
          const idx = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length
          return colors[idx]
        }}
        polygonSideColor={(d: any) => {
          const isActive = ['Georgia', 'Thailand', 'Turkey'].includes(d.properties?.NAME || '')
          return isActive ? '#991b1b' : '#1e293b'
        }}
        polygonStrokeColor={(d: any) => {
          const isActive = ['Georgia', 'Thailand', 'Turkey'].includes(d.properties?.NAME || '')
          return isActive ? '#fca5a5' : '#94a3b8'
        }}
        pointsData={cities}
        pointLat={(d: any) => d.coordinates[1]}
        pointLng={(d: any) => d.coordinates[0]}
        pointColor={() => '#ef4444'}
        pointAltitude={0.005}
        pointRadius={(d: any) => (d.partnersCount ? 0.3 : 0.2)}
        htmlElementsData={[...countryLabels, ...cities]}
        htmlLat={(d: any) => d.coordinates[1]}
        htmlLng={(d: any) => d.coordinates[0]}
        htmlAltitude={(d: any) => 0.01}
        htmlElement={(d: any) => {
          const el = document.createElement('div')
          if (d.isCountry) {
            el.className = 'country-label font-bold text-slate-300 pointer-events-none drop-shadow-md select-none'
            el.style.transform = 'translate(-50%, -50%)'
            el.style.fontSize = '12px'
            el.style.letterSpacing = '1px'
            el.innerHTML = d.name
          } else {
            el.className = 'city-label flex flex-col items-center pointer-events-none'
            el.style.transform = 'translate(-50%, -100%)'
            el.style.marginTop = '-6px'
            const title = [d.name, d.partnersCount != null && `${d.partnersCount} парт.`, d.totalRevenue != null && d.totalRevenue > 0 && `$${d.totalRevenue.toLocaleString('ru-RU')}`].filter(Boolean).join(' · ')
            el.title = title
            el.innerHTML = `
              <div class="bg-slate-800/95 text-white px-1.5 py-0.5 rounded shadow-lg border border-slate-600 backdrop-blur-sm cursor-pointer">
                <div class="font-bold text-red-300 text-[10px] leading-tight tracking-wide">${d.name}</div>
                ${d.partnersCount != null ? `<div class="text-[8px] text-slate-300 leading-tight text-center">${d.partnersCount} парт.</div>` : ''}
                ${d.totalRevenue != null && d.totalRevenue > 0 ? `<div class="text-[8px] text-slate-400 leading-tight text-center">$${d.totalRevenue.toLocaleString('ru-RU')}</div>` : ''}
              </div>
              <div class="w-1.5 h-1.5 bg-slate-800/95 rotate-45 -mt-1 border-r border-b border-slate-600"></div>
            `
          }
          return el
        }}
        onPointClick={(point: any) => {
          if (!point.isCountry) handleCityClick(point)
        }}
      />
    </div>
  )
}
