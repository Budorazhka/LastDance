import type {
  DistributionRule,
  Lead,
  LeadManager,
  LeadPartnerByEmail,
  LeadStage,
  LeadStageId,
  PortalUser,
} from '@/types/leads'

/**
 * Полные стадии воронки продаж (из шаблона sales в analytics-network).
 * Сгруппированы по колонкам: rejection → in_progress → success.
 */
export const LEAD_STAGES: LeadStage[] = [
  // --- rejection ---
  { id: 'defective',   name: 'Бракованный лид',     order: 1 },
  { id: 'refused',     name: 'Отказ',               order: 2 },
  { id: 'no_answer_3', name: 'Недозвонился 3',      order: 3 },
  { id: 'no_answer_2', name: 'Недозвонился 2',      order: 4 },
  { id: 'no_answer_1', name: 'Недозвонился 1',      order: 5 },
  // --- in_progress ---
  { id: 'new',              name: 'Новый лид',                    order: 6 },
  { id: 'callback',         name: 'Попросил связаться позже',     order: 7 },
  { id: 'presented',        name: 'Презентовали компанию',        order: 8 },
  { id: 'country_discussed', name: 'Обсудили ситуацию в стране', order: 9 },
  { id: 'need_identified',  name: 'Выявлена потребность',         order: 10 },
  { id: 'need_adjusted',    name: 'Потребность скорректирована',  order: 11 },
  { id: 'kp_sent',          name: 'Отправлено КП',                order: 12 },
  { id: 'objections',       name: 'Отработка возражений',         order: 13 },
  { id: 'deferred',         name: 'Отложенный спрос',             order: 14 },
  { id: 'warmup',           name: 'Прогрев',                      order: 15 },
  { id: 'showing',          name: 'Показ',                        order: 16 },
  { id: 'deposit',          name: 'Задаток получен',              order: 17 },
  { id: 'deal',             name: 'Заключен договор',             order: 18 },
  // --- success (Золотой фонд) ---
  { id: 'golden',     name: 'Золотой фонд',                          order: 19 },
  { id: 'check_in',   name: 'Узнал как дела',                        order: 20 },
  { id: 'referral',   name: 'Взять рекомендацию',                    order: 21 },
  { id: 'new_deals',  name: 'Выявление потребности о новых сделках', order: 22 },
]

export type FunnelColumnId = 'rejection' | 'in_progress' | 'success'

export const LEAD_STAGE_COLUMN: Record<string, FunnelColumnId> = {
  defective:          'rejection',
  refused:            'rejection',
  no_answer_3:        'rejection',
  no_answer_2:        'rejection',
  no_answer_1:        'rejection',
  new:                'in_progress',
  callback:           'in_progress',
  presented:          'in_progress',
  country_discussed:  'in_progress',
  need_identified:    'in_progress',
  need_adjusted:      'in_progress',
  kp_sent:            'in_progress',
  objections:         'in_progress',
  deferred:           'in_progress',
  warmup:             'in_progress',
  showing:            'in_progress',
  deposit:            'in_progress',
  deal:               'in_progress',
  golden:             'success',
  check_in:           'success',
  referral:           'success',
  new_deals:          'success',
}

export const LEAD_STAGE_ORDER: readonly LeadStageId[] =
  LEAD_STAGES.map((s) => s.id)

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

export const CURRENT_PORTAL_USER_ID = 'user-director'

export const INITIAL_LEAD_MANAGERS: LeadManager[] = [
  { id: 'lm-1', login: 'manager.primary@test.com', name: 'Анна Первичкина', sourceTypes: ['primary'] },
  { id: 'lm-2', login: 'manager.secondary@test.com', name: 'Борис Вторичкин', sourceTypes: ['secondary'] },
  { id: 'lm-3', login: 'manager.rent@test.com', name: 'Виктор Арендов', sourceTypes: ['rent'] },
  { id: 'lm-4', login: 'manager.ads@test.com', name: 'Галина Рекламова', sourceTypes: ['ad_campaigns'] },
  { id: 'lm-5', login: 'manager.multi@test.com', name: 'Дмитрий Универсалов', sourceTypes: ['primary', 'secondary'] },
]

export const INITIAL_LEAD_PARTNERS: LeadPartnerByEmail[] = [
  { id: 'lp-1', email: 'partner1@lk.test', sourceType: 'primary', cityId: 'batumi' },
  { id: 'lp-2', email: 'partner2@lk.test', sourceType: 'secondary', cityId: 'batumi' },
]

export const DEFAULT_DISTRIBUTION_RULE: DistributionRule = {
  type: 'round_robin',
  params: {},
}

export const DEFAULT_MANUAL_DISTRIBUTOR_ID: string | null = 'lm-5'

const MOCK_NAMES = [
  'Иван Петров', 'Мария Сидорова', 'Алексей Козлов', 'Елена Новикова', 'Дмитрий Морозов',
  'Ольга Волкова', 'Сергей Соколов', 'Анна Лебедева', 'Николай Кузнецов', 'Татьяна Попова',
  'Андрей Васильев', 'Наталья Павлова', 'Михаил Семёнов', 'Екатерина Голубева', 'Владимир Виноградов',
  'Светлана Орлова', 'Артём Жуков', 'Ирина Белова', 'Роман Крылов', 'Юлия Комарова',
]

function createMockLeads(): Lead[] {
  const now = new Date()
  const leads: Lead[] = []
  const sources: Lead['source'][] = ['primary', 'secondary', 'rent', 'ad_campaigns']
  const allStageIds = LEAD_STAGES.map((s) => s.id)
  const managers = ['lm-1', 'lm-2', 'lm-3', 'lm-4', 'lm-5', null]
  const channels: NonNullable<Lead['channel']>[] = ['form', 'ad', 'partner', 'other']

  for (let i = 0; i < 120; i++) {
    const d = new Date(now)
    d.setHours(d.getHours() - (i % 48))
    d.setDate(d.getDate() - Math.floor(i / 48))
    const source = sources[i % 4]
    const stageId = allStageIds[i % allStageIds.length]
    const managerId = managers[i % 6]
    const createdAt = d.toISOString()
    const updatedAt = i % 5 === 0 ? undefined : new Date(d.getTime() + 60 * 60 * 1000).toISOString()
    const rejectionNoTask =
      LEAD_STAGE_COLUMN[stageId] === 'rejection' &&
      stageId !== 'no_answer_1' &&
      stageId !== 'no_answer_2'
    const hasTask = rejectionNoTask ? false : i % 3 !== 0
    const taskOverdue = hasTask && i % 7 === 0

    const baseCommission =
      500 + (i % 15) * 150 + (source === 'rent' ? 300 : source === 'ad_campaigns' ? 200 : 0)
    const stageMultiplier =
      LEAD_STAGE_COLUMN[stageId] === 'success'
        ? 1.6
        : LEAD_STAGE_COLUMN[stageId] === 'in_progress'
          ? 1
          : 0.4
    const commissionUsd = Math.round(baseCommission * stageMultiplier)

    leads.push({
      id: `lead-${i + 1}`,
      name: `${MOCK_NAMES[i % MOCK_NAMES.length]}`,
      source,
      stageId,
      managerId,
      createdAt,
      updatedAt,
      hasTask,
      taskOverdue,
      commissionUsd,
      channel: channels[i % 4],
    })
  }

  // Добавляем дополнительный пул "Новый лид" без менеджера для ручного распределения.
  const extraDistributionDeckLeads = 14
  for (let j = 0; j < extraDistributionDeckLeads; j++) {
    const d = new Date(now)
    d.setMinutes(d.getMinutes() - j * 9)
    const source = sources[(j + 1) % 4]
    const createdAt = d.toISOString()

    leads.push({
      id: `lead-${leads.length + 1}`,
      name: `${MOCK_NAMES[(j + 5) % MOCK_NAMES.length]}`,
      source,
      stageId: 'new',
      managerId: null,
      createdAt,
      updatedAt: undefined,
      hasTask: false,
      taskOverdue: false,
      commissionUsd: 1800 + j * 650,
      channel: channels[(j + 2) % 4],
    })
  }

  return leads
}

export const INITIAL_LEAD_POOL: Lead[] = createMockLeads()
