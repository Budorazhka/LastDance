import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type {
  DistributionRule,
  Lead,
  LeadManager,
  LeadPartnerByEmail,
  LeadSource,
} from '@/types/leads'

/** Для round_robin: следующий менеджер по кругу для данной очереди */
function getNextManagerIdRoundRobin(
  leadPool: Lead[],
  leadManagers: LeadManager[],
  source: LeadSource
): string | null {
  const managers = leadManagers
    .filter((m) => m.sourceTypes.includes(source))
    .sort((a, b) => a.id.localeCompare(b.id))
  if (managers.length === 0) return null
  const leadsInSource = leadPool.filter((l) => l.source === source)
  const index = leadsInSource.length % managers.length
  return managers[index].id
}

/** Для by_load: менеджер с наименьшей загрузкой по этой очереди */
function getNextManagerIdByLoad(
  leadPool: Lead[],
  leadManagers: LeadManager[],
  source: LeadSource
): string | null {
  const managers = leadManagers.filter((m) => m.sourceTypes.includes(source))
  if (managers.length === 0) return null
  const countByManager: Record<string, number> = {}
  managers.forEach((m) => { countByManager[m.id] = 0 })
  leadPool.filter((l) => l.source === source).forEach((l) => {
    if (l.managerId && countByManager[l.managerId] !== undefined) {
      countByManager[l.managerId]++
    }
  })
  let minId = managers[0].id
  let minCount = countByManager[minId] ?? 0
  managers.forEach((m) => {
    const c = countByManager[m.id] ?? 0
    if (c < minCount) {
      minCount = c
      minId = m.id
    }
  })
  return minId
}
import {
  DEFAULT_DISTRIBUTION_RULE,
  DEFAULT_MANUAL_DISTRIBUTOR_ID,
  INITIAL_LEAD_MANAGERS,
  INITIAL_LEAD_PARTNERS,
  INITIAL_LEAD_POOL,
} from '@/data/leads-mock'

export interface LeadsState {
  leadPool: Lead[]
  distributionRule: DistributionRule
  manualDistributorId: string | null
  leadManagers: LeadManager[]
  leadPartners: LeadPartnerByEmail[]
}

export type LeadsAction =
  | { type: 'ADD_LEAD'; lead: Lead }
  | { type: 'ASSIGN_LEAD'; leadId: string; managerId: string }
  | { type: 'UNASSIGN_LEAD'; leadId: string }
  | { type: 'UPDATE_LEAD_STAGE'; leadId: string; stageId: string }
  | { type: 'SET_DISTRIBUTION_RULE'; rule: DistributionRule }
  | { type: 'SET_MANUAL_DISTRIBUTOR'; managerId: string | null }
  | { type: 'ADD_LEAD_MANAGER'; manager: LeadManager }
  | { type: 'REMOVE_LEAD_MANAGER'; managerId: string }
  | { type: 'UPDATE_LEAD_MANAGER'; managerId: string; patch: Partial<LeadManager> }
  | { type: 'ADD_LEAD_PARTNER'; partner: LeadPartnerByEmail }
  | { type: 'REMOVE_LEAD_PARTNER'; partnerId: string }
  | { type: 'UPDATE_LEAD_PARTNER'; partnerId: string; patch: Partial<LeadPartnerByEmail> }

function leadsReducer(state: LeadsState, action: LeadsAction): LeadsState {
  switch (action.type) {
    case 'ADD_LEAD': {
      const lead = action.lead
      let managerId: string | null = lead.managerId ?? null
      const rule = state.distributionRule.type
      const noManualDistributor = state.manualDistributorId == null
      if (noManualDistributor && rule === 'round_robin') {
        managerId = getNextManagerIdRoundRobin(state.leadPool, state.leadManagers, lead.source)
      } else if (noManualDistributor && rule === 'by_load') {
        managerId = getNextManagerIdByLoad(state.leadPool, state.leadManagers, lead.source)
      }
      const newLead: Lead = { ...lead, managerId }
      return { ...state, leadPool: [newLead, ...state.leadPool] }
    }
    case 'ASSIGN_LEAD':
      return {
        ...state,
        leadPool: state.leadPool.map((l) =>
          l.id === action.leadId ? { ...l, managerId: action.managerId } : l
        ),
      }
    case 'UNASSIGN_LEAD':
      return {
        ...state,
        leadPool: state.leadPool.map((l) =>
          l.id === action.leadId ? { ...l, managerId: null } : l
        ),
      }
    case 'UPDATE_LEAD_STAGE':
      return {
        ...state,
        leadPool: state.leadPool.map((l) =>
          l.id === action.leadId ? { ...l, stageId: action.stageId } : l
        ),
      }
    case 'SET_DISTRIBUTION_RULE':
      return { ...state, distributionRule: action.rule }
    case 'SET_MANUAL_DISTRIBUTOR':
      return { ...state, manualDistributorId: action.managerId }
    case 'ADD_LEAD_MANAGER':
      return { ...state, leadManagers: [...state.leadManagers, action.manager] }
    case 'REMOVE_LEAD_MANAGER':
      return {
        ...state,
        leadManagers: state.leadManagers.filter((m) => m.id !== action.managerId),
        manualDistributorId:
          state.manualDistributorId === action.managerId ? null : state.manualDistributorId,
      }
    case 'UPDATE_LEAD_MANAGER':
      return {
        ...state,
        leadManagers: state.leadManagers.map((m) =>
          m.id === action.managerId ? { ...m, ...action.patch } : m
        ),
      }
    case 'ADD_LEAD_PARTNER':
      return { ...state, leadPartners: [...state.leadPartners, action.partner] }
    case 'REMOVE_LEAD_PARTNER':
      return {
        ...state,
        leadPartners: state.leadPartners.filter((p) => p.id !== action.partnerId),
      }
    case 'UPDATE_LEAD_PARTNER':
      return {
        ...state,
        leadPartners: state.leadPartners.map((p) =>
          p.id === action.partnerId ? { ...p, ...action.patch } : p
        ),
      }
    default:
      return state
  }
}

const initialState: LeadsState = {
  leadPool: INITIAL_LEAD_POOL,
  distributionRule: DEFAULT_DISTRIBUTION_RULE,
  manualDistributorId: DEFAULT_MANUAL_DISTRIBUTOR_ID,
  leadManagers: INITIAL_LEAD_MANAGERS,
  leadPartners: INITIAL_LEAD_PARTNERS,
}

type LeadsContextValue = {
  state: LeadsState
  dispatch: React.Dispatch<LeadsAction>
  /** Лиды по источнику (очереди) */
  leadsBySource: (source: LeadSource) => Lead[]
  /** Идёт автоназначение (по кругу / по загрузке) без ручного распределителя */
  isAutoDistribution: boolean
}

const LeadsContext = createContext<LeadsContextValue | null>(null)

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(leadsReducer, initialState)

  const leadsBySource = (source: LeadSource) =>
    state.leadPool.filter((l) => l.source === source)

  const isAutoDistribution =
    state.distributionRule.type !== 'manual' && state.manualDistributorId == null

  const value: LeadsContextValue = {
    state,
    dispatch,
    leadsBySource,
    isAutoDistribution,
  }

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
}

export function useLeads() {
  const ctx = useContext(LeadsContext)
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider')
  return ctx
}
