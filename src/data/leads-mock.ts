import type {
  DistributionRule,
  Lead,
  LeadManager,
  LeadPartnerByEmail,
  LeadStage,
  PortalUser,
} from '@/types/leads'

/** Стадии воронки продаж для лидов (совпадают с sales funnel в аналитике) */
export const LEAD_STAGES: LeadStage[] = [
  { id: 'new', name: 'Новый лид', order: 1 },
  { id: 'presented', name: 'Презентовали компанию', order: 2 },
  { id: 'showing', name: 'Показ', order: 3 },
  { id: 'deal', name: 'Заключен договор', order: 4 },
]

/** Пользователи портала с доступом к админке лидов (мок) */
export const PORTAL_USERS: PortalUser[] = [
  {
    id: 'user-director',
    email: 'director@portal.test',
    displayName: 'Иван Директоров',
    leadAdminRole: 'director',
  },
  {
    id: 'user-rop',
    email: 'rop@portal.test',
    displayName: 'Пётр Ропов',
    leadAdminRole: 'rop',
  },
]

/** Текущий пользователь портала (мок — для проверки доступа) */
export const CURRENT_PORTAL_USER_ID = 'user-director'

/** Менеджеры по лидам — кому можно распределять */
export const INITIAL_LEAD_MANAGERS: LeadManager[] = [
  { id: 'lm-1', login: 'manager.primary@test.com', name: 'Анна Первичкина', sourceTypes: ['primary'] },
  { id: 'lm-2', login: 'manager.secondary@test.com', name: 'Борис Вторичкин', sourceTypes: ['secondary'] },
  { id: 'lm-3', login: 'manager.rent@test.com', name: 'Виктор Арендов', sourceTypes: ['rent'] },
  { id: 'lm-4', login: 'manager.ads@test.com', name: 'Галина Рекламова', sourceTypes: ['ad_campaigns'] },
  { id: 'lm-5', login: 'manager.multi@test.com', name: 'Дмитрий Универсалов', sourceTypes: ['primary', 'secondary'] },
]

/** Пользователи с доступом к разделу «Контроль лидов» (по email ЛК) */
export const INITIAL_LEAD_PARTNERS: LeadPartnerByEmail[] = [
  { id: 'lp-1', email: 'partner1@lk.test', sourceType: 'primary', cityId: 'batumi' },
  { id: 'lp-2', email: 'partner2@lk.test', sourceType: 'secondary', cityId: 'batumi' },
]

/** Начальное правило раздачи */
export const DEFAULT_DISTRIBUTION_RULE: DistributionRule = {
  type: 'round_robin',
  params: {},
}

/** Начальный рукопашной распределитель (null = не назначен) */
export const DEFAULT_MANUAL_DISTRIBUTOR_ID: string | null = 'lm-5'

/** Генерируем мок-лидов для облака (много, чтобы проверять списки по источникам) */
function createMockLeads(): Lead[] {
  const now = new Date()
  const leads: Lead[] = []
  const sources: Lead['source'][] = ['primary', 'secondary', 'rent', 'ad_campaigns']
  const stages = ['new', 'presented', 'showing', 'deal']
  const managers = ['lm-1', 'lm-2', 'lm-3', 'lm-4', 'lm-5', null]
  const channels: NonNullable<Lead['channel']>[] = ['form', 'ad', 'partner', 'other']

  for (let i = 0; i < 120; i++) {
    const d = new Date(now)
    d.setHours(d.getHours() - (i % 48))
    d.setDate(d.getDate() - Math.floor(i / 48))
    const source = sources[i % 4]
    const stageId = stages[i % 4]
    const managerId = managers[i % 6]
    leads.push({
      id: `lead-${i + 1}`,
      source,
      stageId,
      managerId,
      createdAt: d.toISOString(),
      channel: channels[i % 4],
    })
  }
  return leads
}

export const INITIAL_LEAD_POOL: Lead[] = createMockLeads()
