import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Breadcrumb, Country } from '@/types/dashboard'
import georgiaFlag from '@/assets/flags/georgia.svg'
import thailandFlag from '@/assets/flags/thailand.svg'
import turkeyFlag from '@/assets/flags/turkey.svg'

const countryFlags: Record<string, string> = {
  georgia: georgiaFlag,
  thailand: thailandFlag,
  turkey: turkeyFlag,
}

interface HeaderProps {
  title: string
  breadcrumbs: Breadcrumb[]
  countries?: Country[]
  activeCityId?: string
}

export function Header({ title, breadcrumbs, countries, activeCityId }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6">
      <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5" />}
            {crumb.href ? (
              <button
                type="button"
                onClick={() => navigate(crumb.href!)}
                className="transition-colors hover:text-foreground"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      {countries && countries.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {countries.map((country) => {
            const isActive = country.cities.includes(activeCityId ?? '')

            return (
              <button
                key={country.id}
                type="button"
                onClick={() => navigate(`/city/${country.cities[0]}`)}
                className={
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ' +
                  (isActive
                    ? 'border-slate-300 bg-slate-100 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
                }
              >
                {countryFlags[country.id] ? (
                  <img
                    src={countryFlags[country.id]}
                    alt={`Флаг ${country.name}`}
                    className="h-3.5 w-5 rounded-sm border border-slate-200/80 object-cover"
                  />
                ) : (
                  <span>{country.flag}</span>
                )}
                <span>{country.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
