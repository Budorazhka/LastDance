import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Partner, City, Permission } from '@/types/dashboard'
import { cities as initialCities } from '@/data/mock'

interface DashboardState {
  cities: City[]
}

type Action =
  | { type: 'UPDATE_PERMISSIONS'; partnerId: string; cityId: string; permissions: Permission[] }
  | { type: 'ADD_PARTNER'; cityId: string; partner: Partner }

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        cities: state.cities.map(city =>
          city.id === action.cityId
            ? {
                ...city,
                partners: city.partners.map(p =>
                  p.id === action.partnerId
                    ? { ...p, permissions: action.permissions }
                    : p
                ),
              }
            : city
        ),
      }
    case 'ADD_PARTNER':
      return {
        ...state,
        cities: state.cities.map(city =>
          city.id === action.cityId
            ? { ...city, partners: [...city.partners, action.partner] }
            : city
        ),
      }
    default:
      return state
  }
}

const DashboardContext = createContext<{
  state: DashboardState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { cities: initialCities })

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
