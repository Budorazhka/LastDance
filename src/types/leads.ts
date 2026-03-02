/**
 * Типы для подразделения «Контроль лидов»:
 * портальный пользователь (Директор/РОП), лид, облако, правило раздачи, менеджеры и пользователи с доступом к разделу (по email ЛК).
 */

/** Роль доступа к админке лидов */
export type LeadAdminRole = 'director' | 'rop'

/** Пользователь портала с доступом к разделу лидов */
export interface PortalUser {
  id: string
  email: string
  displayName: string
  /** Роль в админке лидов: директор (полный доступ) или РОП (ограниченный) */
  leadAdminRole: LeadAdminRole
}

/** Четыре типа аккаунтов/очередей для обработки лидов */
export type LeadSource =
  | 'primary'   // Первичка
  | 'secondary' // Вторичка
  | 'rent'      // Аренда
  | 'ad_campaigns' // Лиды с рекламными компаниями

/** Стадия лида в воронке (совместимо с FunnelStage) */
export type LeadStageId = string

export interface LeadStage {
  id: LeadStageId
  name: string
  order: number
}

/** Один лид в облаке */
export interface Lead {
  id: string
  source: LeadSource
  stageId: LeadStageId
  /** ID менеджера, которому назначен лид (если уже распределён) */
  managerId: string | null
  /** Дата поступления в облако (ISO) */
  createdAt: string
  /** Произвольный источник поступления: форма, реклама, партнёр */
  channel?: 'form' | 'ad' | 'partner' | 'other'
}

/** Единое облако лидов — пул по всем типам */
export type LeadPool = Lead[]

/** Тип правила раздачи */
export type DistributionRuleType = 'round_robin' | 'by_load' | 'manual'

export interface DistributionRule {
  type: DistributionRuleType
  /** Для round_robin: порядок менеджеров по source (опционально). Для by_load: порог загрузки. */
  params?: Record<string, unknown>
}

/** ID пользователя-менеджера, который в рукопашном режиме распределяет лиды */
export type ManualDistributorId = string | null

/** Менеджер по лидам (аккаунт для обработки лидов) */
export interface LeadManager {
  id: string
  login: string
  name: string
  /** К каким очередям привязан (первичка, вторичка, аренда, рекламные кампании) */
  sourceTypes: LeadSource[]
}

/** Пользователь с доступом к разделу «Контроль лидов» — задаётся по email личного кабинета */
export interface LeadPartnerByEmail {
  id: string
  email: string
  /** К какой очереди привязан */
  sourceType: LeadSource
  /** Опционально город */
  cityId?: string
}
