import { useState, useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'
import { useNavigate } from 'react-router-dom'
import type { CityMapPoint } from '@/types/dashboard'

interface GlobeMapProps {
  cities: CityMapPoint[]
}



const countryLabels = [
  { isCountry: true, id: 'georgia', name: 'Грузия', coordinates: [43.5, 42.1] }, // [Lng, Lat]
  { isCountry: true, id: 'thailand', name: 'Таиланд', coordinates: [100.9, 15.8] }, // [Lng, Lat]
  { isCountry: true, id: 'turkey', name: 'Турция', coordinates: [35.2, 39.0] }, // [Lng, Lat]
]

export function GlobeMap({ cities }: GlobeMapProps) {
  const globeEl = useRef<any>(null)
  const navigate = useNavigate()
  const [countries, setCountries] = useState({ features: [] })
  const [capitals, setCapitals] = useState<any[]>([])
  const [zoomLevel, setZoomLevel] = useState<'far' | 'countries' | 'cities'>('far')

  useEffect(() => {
    // Получаем GeoJSON для детальных контуров границ стран
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)

    // Получаем датасет столиц
    fetch('https://raw.githubusercontent.com/steveflorentino/react-world-map/master/src/data/capitals.json')
      .then(res => res.json())
      .then(data => {
        // Преобразуем формат датасета, убираем столицы, которые мы уже выводим как партнерские города (Тбилиси и т.д.)
        const activeCityNames = cities.map(c => c.name.toLowerCase())
        const formattedCapitals = data
          .map((item: any) => ({
            isCapital: true,
            id: `cap-${item.CountryName}`,
            name: item.CapitalName,
            country: item.CountryName,
            coordinates: [parseFloat(item.CapitalLongitude), parseFloat(item.CapitalLatitude)]
          }))
          .filter((item: any) => !isNaN(item.coordinates[0]) && !isNaN(item.coordinates[1]))
          // Исключаем те, что уже есть в наших cities
          .filter((item: any) => !activeCityNames.includes(item.name.toLowerCase()))

        setCapitals(formattedCapitals)
      })
      .catch(err => console.error("Failed to fetch capitals", err))
  }, [])

  useEffect(() => {
    let animationFrameId: number;
    let lastLevel = 'far';

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

  const handleCityClick = (city: CityMapPoint) => {
    navigate(`/city/${city.id}`)
  }

  return (
    <div className={`relative w-full h-full min-h-[600px] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden cursor-move zoom-${zoomLevel}`}>
      <style>{`
        .zoom-far .country-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-far .city-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-far .capital-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        
        .zoom-countries .country-label { opacity: 1; transition: opacity 0.5s ease; }
        .zoom-countries .city-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-countries .capital-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        
        .zoom-cities .country-label { opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .zoom-cities .city-label { opacity: 1; transition: opacity 0.5s ease; }
        .zoom-cities .capital-label { opacity: 1; transition: opacity 0.5s ease; }
      `}</style>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

        // Отрисовка границ стран
        polygonsData={countries.features}
        polygonAltitude={0.005}
        polygonCapColor={(d: any) => {
          const name = d.properties?.NAME || ''
          const isActive = ['Georgia', 'Thailand', 'Turkey'].includes(name)
          if (isActive) return '#ef4444' // Ярко-красный (red-500) для стран, с которыми работаем

          // Политическая раскраска: более светлые и теплые серые тона, чтобы они не сливались с темным океаном
          const colors = ['#334155', '#475569', '#64748b', '#273f5e']
          const idx = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length
          return colors[idx]
        }}
        polygonSideColor={(d: any) => {
          const isActive = ['Georgia', 'Thailand', 'Turkey'].includes(d.properties?.NAME || '')
          return isActive ? '#991b1b' : '#1e293b' // Более светлые боковины
        }}
        polygonStrokeColor={(d: any) => {
          const isActive = ['Georgia', 'Thailand', 'Turkey'].includes(d.properties?.NAME || '')
          return isActive ? '#fca5a5' : '#94a3b8' // Яркая обводка, чтобы страны читались
        }}

        // Точки (наши города и все стоматоличные города)
        pointsData={[...cities, ...capitals]}
        pointLat={(d: any) => d.coordinates[1]}
        pointLng={(d: any) => d.coordinates[0]}
        pointColor={(d: any) => d.isCapital ? '#94a3b8' : '#ef4444'} // Серые для обычных столиц, красные для наших
        pointAltitude={0.005} // Сделали плоскими
        pointRadius={(d: any) => d.isCapital ? 0.1 : (d.partnersCount ? 0.3 : 0.2)} // Меньше для обычных столиц

        // Компактные метки поверх глобуса (HTML)
        htmlElementsData={[...countryLabels, ...cities, ...capitals]}
        htmlLat={(d: any) => d.coordinates[1]}
        htmlLng={(d: any) => d.coordinates[0]}
        htmlAltitude={(d: any) => d.isCapital ? 0.005 : 0.01}
        htmlElement={(d: any) => {
          const el = document.createElement('div')

          if (d.isCountry) {
            el.className = 'country-label font-bold text-slate-300 pointer-events-none drop-shadow-md select-none'
            el.style.transform = 'translate(-50%, -50%)'
            el.style.fontSize = '12px'
            el.style.letterSpacing = '1px'
            el.innerHTML = d.name
          } else if (d.isCapital) {
            el.className = 'capital-label font-medium text-slate-400 pointer-events-none select-none transition-opacity'
            el.style.transform = 'translate(-50%, 100%)' // Ниже точки
            el.style.marginTop = '4px'
            el.style.fontSize = '8px'
            el.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)'
            el.innerHTML = d.name
          } else {
            el.className = 'city-label flex flex-col items-center pointer-events-none'
            el.style.transform = 'translate(-50%, -100%)'
            el.style.marginTop = '-6px'
            el.innerHTML = `
              <div class="bg-slate-800/95 text-white px-1.5 py-0.5 rounded shadow-lg border border-slate-600 backdrop-blur-sm">
                <div class="font-bold text-red-300 text-[10px] leading-tight tracking-wide">${d.name}</div>
                ${d.partnersCount ? `<div class="text-[8px] text-slate-300 leading-tight text-center">${d.partnersCount} парт.</div>` : ''}
              </div>
              <div class="w-1.5 h-1.5 bg-slate-800/95 rotate-45 -mt-1 border-r border-b border-slate-600"></div>
            `
          }

          return el
        }}

        onPointClick={(point: any) => {
          if (!point.isCountry && !point.isCapital) handleCityClick(point)
        }}
      />
    </div>
  )
}
