import { useNavigate } from 'react-router-dom'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { CityMarker } from './CityMarker'
import type { CityMapPoint } from '@/types/dashboard'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface WorldMapProps {
  cities: CityMapPoint[]
}

export function WorldMap({ cities }: WorldMapProps) {
  const navigate = useNavigate()

  return (
    <div className="relative w-full bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [62, 28],
          scale: 420,
        }}
        width={960}
        height={500}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup center={[62, 28]} zoom={1} minZoom={1} maxZoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: { rsmKey: string }[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e8ecf1"
                  stroke="#d1d8e0"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#dde3ea' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {cities.map((city) => (
            <Marker
              key={city.id}
              coordinates={city.coordinates}
              onClick={() => navigate(`/city/${city.id}`)}
            >
              <CityMarker city={city} />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
