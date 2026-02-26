import { useMemo, useState } from 'react'
import { Building2, DollarSign, Globe2, MapPin, Users2 } from 'lucide-react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { CityMapPoint } from '@/types/dashboard'

interface GlobeMapProps {
  cities: CityMapPoint[]
}

const GEO_URL =
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

const COUNTRY_CONFIG = [
  {
    id: 'georgia',
    name: 'Грузия',
    englishName: 'Georgia',
    center: [43.5, 42.1] as [number, number],
    zoom: 4.6,
  },
  {
    id: 'thailand',
    name: 'Таиланд',
    englishName: 'Thailand',
    center: [100.8, 15.9] as [number, number],
    zoom: 4.2,
  },
  {
    id: 'turkey',
    name: 'Турция',
    englishName: 'Turkey',
    center: [35.2, 39.0] as [number, number],
    zoom: 4.3,
  },
] as const

type CountryId = (typeof COUNTRY_CONFIG)[number]['id']

const COUNTRY_ID_BY_ENGLISH_NAME: Record<string, CountryId> = {
  Georgia: 'georgia',
  Thailand: 'thailand',
  Turkey: 'turkey',
}

const COUNTRY_PALETTE: Record<
  CountryId,
  { base: string; hover: string; focus: string; stroke: string }
> = {
  georgia: {
    base: '#88f0b7',
    hover: '#5be39c',
    focus: '#22c55e',
    stroke: '#15803d',
  },
  thailand: {
    base: '#ffd86f',
    hover: '#fbbf24',
    focus: '#f59e0b',
    stroke: '#b45309',
  },
  turkey: {
    base: '#fda4af',
    hover: '#fb7185',
    focus: '#f43f5e',
    stroke: '#be123c',
  },
}

function isCountryId(value: string): value is CountryId {
  return COUNTRY_CONFIG.some((country) => country.id === value)
}

function getMarkerSize(partnersCount: number): number {
  if (partnersCount >= 10) return 10.6
  if (partnersCount >= 4) return 9.2
  return 7.8
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString('ru-RU')}`
}

const CITY_FOCUS_ZOOM = 7.4
const MAP_MIN_ZOOM = 2.6
const MAP_MAX_ZOOM = 9.5

export function GlobeMap({ cities }: GlobeMapProps) {
  const navigate = useNavigate()

  const availableCountryIds = useMemo(() => {
    return Array.from(
      new Set(
        cities
          .map((city) => city.countryId)
          .filter((countryId): countryId is CountryId => isCountryId(countryId))
      )
    )
  }, [cities])

  const countryOptions = useMemo(
    () => COUNTRY_CONFIG.filter((country) => availableCountryIds.includes(country.id)),
    [availableCountryIds]
  )

  const [focusedCountryId, setFocusedCountryId] = useState<CountryId>(
    countryOptions[0]?.id ?? COUNTRY_CONFIG[0].id
  )
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null)

  const focusedCountry = useMemo(() => {
    return (
      countryOptions.find((country) => country.id === focusedCountryId) ??
      countryOptions[0] ??
      COUNTRY_CONFIG[0]
    )
  }, [countryOptions, focusedCountryId])

  const focusedCountryCities = useMemo(
    () => cities.filter((city) => city.countryId === focusedCountry.id),
    [cities, focusedCountry.id]
  )

  const selectedCity = useMemo(() => {
    if (!selectedCityId) return null
    return cities.find((city) => city.id === selectedCityId) ?? null
  }, [cities, selectedCityId])

  const hoveredCity = useMemo(() => {
    if (!hoveredCityId) return null
    return cities.find((city) => city.id === hoveredCityId) ?? null
  }, [cities, hoveredCityId])

  const panelCity = selectedCity ?? hoveredCity ?? focusedCountryCities[0] ?? null

  const networkStats = useMemo(() => {
    return {
      cityCount: cities.length,
      referralsCount: cities.reduce((sum, city) => sum + city.partnersCount, 0),
      revenue: cities.reduce((sum, city) => sum + city.totalRevenue, 0),
    }
  }, [cities])

  const focusedCountryStats = useMemo(() => {
    return {
      cityCount: focusedCountryCities.length,
      referralsCount: focusedCountryCities.reduce((sum, city) => sum + city.partnersCount, 0),
      revenue: focusedCountryCities.reduce((sum, city) => sum + city.totalRevenue, 0),
    }
  }, [focusedCountryCities])

  const mapCenter: [number, number] = selectedCity?.coordinates ?? focusedCountry.center
  const mapZoom = selectedCity ? CITY_FOCUS_ZOOM : focusedCountry.zoom
  const activeLabelCityId = hoveredCityId ?? selectedCityId

  const focusCountry = (countryId: CountryId) => {
    setFocusedCountryId(countryId)
    setHoveredCityId(null)
    setSelectedCityId((currentCityId) => {
      if (!currentCityId) return null
      const currentCity = cities.find((city) => city.id === currentCityId)
      return currentCity?.countryId === countryId ? currentCityId : null
    })
  }

  const focusCity = (city: CityMapPoint) => {
    if (isCountryId(city.countryId)) {
      setFocusedCountryId(city.countryId)
    }

    if (selectedCityId === city.id) {
      navigate(`/city/${city.id}`)
      return
    }

    setHoveredCityId(city.id)
    setSelectedCityId(city.id)
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
      <header className="border-b border-slate-800 bg-slate-900 px-5 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold leading-tight">Карта сети MLM</h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
              <p className="text-xs text-slate-300">Городов</p>
              <p className="text-xl font-semibold">{networkStats.cityCount}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
              <p className="text-xs text-slate-300">Рефералов</p>
              <p className="text-xl font-semibold">{networkStats.referralsCount}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
              <p className="text-xs text-slate-300">Выручка</p>
              <p className="text-xl font-semibold">{formatMoney(networkStats.revenue)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {countryOptions.map((country) => {
              const isActive = country.id === focusedCountry.id
              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => focusCountry(country.id)}
                  className={[
                    'rounded-full border px-4 py-2 text-base font-semibold transition',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {country.name}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => {
                setHoveredCityId(null)
                setSelectedCityId(null)
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Сбросить фокус
            </button>
          </div>

          <div className="relative h-[560px] overflow-hidden rounded-2xl border border-slate-300 bg-[radial-gradient(circle_at_18%_20%,#eaf8ff_0%,#9dd8ff_38%,#4ea8f4_68%,#2a84db_100%)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:44px_44px]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.06)_48%,rgba(255,255,255,0)_80%)]" />

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 142 }}
              width={980}
              height={560}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup
                center={mapCenter}
                zoom={mapZoom}
                minZoom={MAP_MIN_ZOOM}
                maxZoom={MAP_MAX_ZOOM}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoName =
                        (geo.properties?.name as string | undefined) ??
                        (geo.properties?.NAME as string | undefined) ??
                        ''
                      const geoCountryId = COUNTRY_ID_BY_ENGLISH_NAME[geoName]
                      const isFocusedCountry = geoCountryId === focusedCountry.id
                      const countryColors = geoCountryId ? COUNTRY_PALETTE[geoCountryId] : null
                      const hasNetworkCity = geoCountryId ? availableCountryIds.includes(geoCountryId) : false

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          stroke={
                            hasNetworkCity && countryColors
                              ? countryColors.stroke
                              : isFocusedCountry
                                ? '#0f172a'
                                : '#64748b'
                          }
                          strokeWidth={isFocusedCountry ? 1.2 : hasNetworkCity ? 0.9 : 0.35}
                          style={{
                            default: {
                              fill:
                                hasNetworkCity && countryColors
                                  ? isFocusedCountry
                                    ? countryColors.focus
                                    : countryColors.base
                                  : '#e2e8f0',
                              outline: 'none',
                            },
                            hover: {
                              fill:
                                hasNetworkCity && countryColors
                                  ? countryColors.hover
                                  : '#cbd5e1',
                              outline: 'none',
                            },
                            pressed: {
                              fill:
                                hasNetworkCity && countryColors
                                  ? countryColors.focus
                                  : '#94a3b8',
                              outline: 'none',
                            },
                          }}
                        />
                      )
                    })
                  }
                </Geographies>

                {cities.map((city) => {
                  const isFocused = city.countryId === focusedCountry.id
                  const isSelected = selectedCity?.id === city.id
                  const isHovered = hoveredCity?.id === city.id
                  const showLabel = activeLabelCityId === city.id
                  const zoomCompensation = 1 / mapZoom
                  const labelOffset = city.labelOffset ?? ([12, -10] as [number, number])
                  const markerSize = getMarkerSize(city.partnersCount) * zoomCompensation
                  const markerColor = isSelected
                    ? '#f97316'
                    : isHovered
                      ? '#0ea5e9'
                      : isFocused
                        ? '#0284c7'
                        : '#475569'

                  return (
                    <Marker key={city.id} coordinates={city.coordinates}>
                      <g
                        transform={`translate(0,${-10 * zoomCompensation})`}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredCityId(city.id)}
                        onMouseLeave={() => {
                          setHoveredCityId((currentCityId) =>
                            currentCityId === city.id ? null : currentCityId
                          )
                        }}
                        onClick={() => focusCity(city)}
                      >
                        {(isSelected || isHovered) && (
                          <circle
                            r={(getMarkerSize(city.partnersCount) + 7) * zoomCompensation}
                            fill={isSelected ? 'rgba(249, 115, 22, 0.24)' : 'rgba(14, 165, 233, 0.22)'}
                          />
                        )}
                        <circle
                          r={markerSize}
                          fill={markerColor}
                          stroke="#ffffff"
                          strokeWidth={1.5 * zoomCompensation}
                        />
                        <circle
                          r={(getMarkerSize(city.partnersCount) - 2.2) * zoomCompensation}
                          fill="rgba(255,255,255,0.35)"
                        />

                        {showLabel && (
                          <g
                            transform={`translate(${labelOffset[0] * zoomCompensation},${labelOffset[1] * zoomCompensation})`}
                          >
                            <rect
                              width={126 * zoomCompensation}
                              height={38 * zoomCompensation}
                              rx={9 * zoomCompensation}
                              fill="rgba(255,255,255,0.95)"
                              stroke="rgba(71,85,105,0.35)"
                              strokeWidth={1 * zoomCompensation}
                            />
                            <text
                              x={9 * zoomCompensation}
                              y={15 * zoomCompensation}
                              style={{
                                fontSize: `${11.5 * zoomCompensation}px`,
                                fontWeight: 700,
                                fill: '#0f172a',
                              }}
                            >
                              {city.name}
                            </text>
                            <text
                              x={9 * zoomCompensation}
                              y={29 * zoomCompensation}
                              style={{
                                fontSize: `${10 * zoomCompensation}px`,
                                fontWeight: 600,
                                fill: '#334155',
                              }}
                            >
                              {city.partnersCount} рефералов
                            </text>
                          </g>
                        )}
                      </g>
                    </Marker>
                  )
                })}
              </ZoomableGroup>
            </ComposableMap>

            <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow">
              Наведите на город для подсветки. Клик выбирает, повторный клик открывает страницу.
            </div>
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-slate-50 p-4 xl:border-l xl:border-t-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Текущий фокус</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{focusedCountry.name}</h3>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1 text-slate-600">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Городов</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {focusedCountryStats.cityCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1 text-slate-600">
                  <Users2 className="h-4 w-4" />
                  <span className="text-xs">Рефералов</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {focusedCountryStats.referralsCount}
                </p>
              </div>
            </div>

            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-1 text-slate-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Выручка страны</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatMoney(focusedCountryStats.revenue)}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {focusedCountryCities.map((city) => {
              const isActive = panelCity?.id === city.id
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => focusCity(city)}
                  className={[
                    'w-full rounded-2xl border px-3 py-3 text-left transition',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white hover:bg-slate-100',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">{city.name}</p>
                      <p
                        className={[
                          'text-sm',
                          isActive ? 'text-slate-300' : 'text-slate-600',
                        ].join(' ')}
                      >
                        {city.partnersCount} рефералов
                      </p>
                    </div>
                    <div
                      className={[
                        'shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold',
                        isActive
                          ? 'border-slate-500 text-slate-200'
                          : 'border-blue-300 bg-blue-50 text-blue-700',
                      ].join(' ')}
                    >
                      {formatMoney(city.totalRevenue)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-600">
              {panelCity ? `Выбран город: ${panelCity.name}` : 'Город не выбран'}
            </p>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4" />
                <span>{panelCity ? `${panelCity.coordinates[1]}, ${panelCity.coordinates[0]}` : '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users2 className="h-4 w-4" />
                <span>{panelCity ? `${panelCity.partnersCount} рефералов` : '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Globe2 className="h-4 w-4" />
                <span>{panelCity ? formatMoney(panelCity.totalRevenue) : '-'}</span>
              </div>
            </div>

            <Button
              className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={!panelCity}
              onClick={() => {
                if (!panelCity) return
                navigate(`/city/${panelCity.id}`)
              }}
            >
              Открыть аналитику города
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
