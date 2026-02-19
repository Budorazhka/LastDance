import type {
  City,
  CityMapPoint,
  Country,
  GlobalStats,
  Partner,
  Permission,
} from '@/types/dashboard'

export const createPermissions = (overrides: Record<string, boolean> = {}): Permission[] => [
  {
    id: 'view_listings',
    label: 'Просмотр объектов',
    description: 'Доступ к базе объектов недвижимости',
    enabled: overrides['view_listings'] ?? true,
  },
  {
    id: 'edit_listings',
    label: 'Редактирование объектов',
    description: 'Создание и изменение карточек объектов',
    enabled: overrides['edit_listings'] ?? false,
  },
  {
    id: 'view_leads',
    label: 'Просмотр лидов',
    description: 'Доступ к входящим заявкам',
    enabled: overrides['view_leads'] ?? true,
  },
  {
    id: 'manage_leads',
    label: 'Управление лидами',
    description: 'Назначение и изменение статусов лидов',
    enabled: overrides['manage_leads'] ?? false,
  },
  {
    id: 'view_analytics',
    label: 'Аналитика',
    description: 'Доступ к отчетам и дашбордам',
    enabled: overrides['view_analytics'] ?? false,
  },
  {
    id: 'manage_team',
    label: 'Управление командой',
    description: 'Добавление и удаление суб-партнеров',
    enabled: overrides['manage_team'] ?? false,
  },
  {
    id: 'export_data',
    label: 'Экспорт данных',
    description: 'Выгрузка данных в CSV и Excel',
    enabled: overrides['export_data'] ?? false,
  },
  {
    id: 'api_access',
    label: 'Доступ к API',
    description: 'Интеграции с внешними сервисами',
    enabled: overrides['api_access'] ?? false,
  },
]

export const countries: Country[] = [
  { id: 'georgia', name: 'Грузия', flag: '🇬🇪', cities: ['batumi', 'tbilisi'] },
  { id: 'thailand', name: 'Таиланд', flag: '🇹🇭', cities: ['phuket'] },
  { id: 'turkey', name: 'Турция', flag: '🇹🇷', cities: ['antalya'] },
]

const batumiPartners: Partner[] = [
  {
    id: 'bat-m1',
    name: 'Mike Tyson',
    login: 'batumi.master1@testmail.com',
    type: 'master',
    roles: ['Первичка', 'MLS вторичка'],
    permissions: createPermissions({
      edit_listings: true,
      manage_leads: true,
      view_analytics: true,
      manage_team: true,
    }),
    crmMinutes: 14520,
  },
  {
    id: 'bat-s1',
    name: 'Muhammad Ali',
    login: 'batumi.sub1@testmail.com',
    type: 'sub',
    masterId: 'bat-m1',
    roles: ['Первичка', 'MLS аренда'],
    permissions: createPermissions({ view_leads: true }),
    crmMinutes: 8340,
  },
  {
    id: 'bat-s2',
    name: 'Floyd Mayweather',
    login: 'batumi.sub2@testmail.com',
    type: 'sub',
    masterId: 'bat-m1',
    roles: ['MLS вторичка', 'Курсы'],
    permissions: createPermissions({ edit_listings: true }),
    crmMinutes: 5670,
  },
  {
    id: 'bat-s3',
    name: 'Manny Pacquiao',
    login: 'batumi.sub3@testmail.com',
    type: 'sub',
    masterId: 'bat-m1',
    roles: ['Первичка'],
    permissions: createPermissions(),
    crmMinutes: 3120,
  },
]

const phuketPartners: Partner[] = [
  {
    id: 'phk-m1',
    name: 'Canelo Alvarez',
    login: 'phuket.master1@testmail.com',
    type: 'master',
    roles: ['Первичка', 'MLS аренда', 'Курсы'],
    permissions: createPermissions({
      edit_listings: true,
      manage_leads: true,
      view_analytics: true,
      manage_team: true,
      export_data: true,
    }),
    crmMinutes: 21300,
  },
  {
    id: 'phk-s1',
    name: 'Gennadiy Golovkin',
    login: 'phuket.sub1@testmail.com',
    type: 'sub',
    masterId: 'phk-m1',
    roles: ['MLS аренда'],
    permissions: createPermissions({ manage_leads: true }),
    crmMinutes: 9870,
  },
  {
    id: 'phk-s2',
    name: 'Oleksandr Usyk',
    login: 'phuket.sub2@testmail.com',
    type: 'sub',
    masterId: 'phk-m1',
    roles: ['Первичка', 'MLS вторичка'],
    permissions: createPermissions({ edit_listings: true, view_analytics: true }),
    crmMinutes: 7230,
  },
]

const antalyaPartners: Partner[] = [
  {
    id: 'ant-m1',
    name: 'Tyson Fury',
    login: 'antalya.master1@testmail.com',
    type: 'master',
    roles: ['Первичка', 'MLS вторичка', 'MLS аренда'],
    permissions: createPermissions({
      edit_listings: true,
      manage_leads: true,
      view_analytics: true,
      manage_team: true,
      export_data: true,
      api_access: true,
    }),
    crmMinutes: 18900,
  },
  {
    id: 'ant-s1',
    name: 'Vasyl Lomachenko',
    login: 'antalya.sub1@testmail.com',
    type: 'sub',
    masterId: 'ant-m1',
    roles: ['Первичка', 'Курсы'],
    permissions: createPermissions({ manage_leads: true }),
    crmMinutes: 11200,
  },
  {
    id: 'ant-s2',
    name: 'Naoya Inoue',
    login: 'antalya.sub2@testmail.com',
    type: 'sub',
    masterId: 'ant-m1',
    roles: ['MLS вторичка', 'MLS аренда'],
    permissions: createPermissions({ edit_listings: true, view_leads: true }),
    crmMinutes: 6450,
  },
]

export const cities: City[] = [
  { id: 'batumi', name: 'Батуми', countryId: 'georgia', partners: batumiPartners },
  { id: 'tbilisi', name: 'Тбилиси', countryId: 'georgia', partners: [] },
  { id: 'phuket', name: 'Пхукет', countryId: 'thailand', partners: phuketPartners },
  { id: 'antalya', name: 'Анталья', countryId: 'turkey', partners: antalyaPartners },
]

export const cityMapPoints: CityMapPoint[] = [
  {
    id: 'batumi',
    name: 'Батуми',
    countryId: 'georgia',
    coordinates: [41.64, 41.64],
    labelOffset: [-28, -22],
    partnersCount: 4,
    totalRevenue: 127500,
  },
  {
    id: 'tbilisi',
    name: 'Тбилиси',
    countryId: 'georgia',
    coordinates: [44.79, 41.69],
    labelOffset: [28, -6],
    partnersCount: 0,
    totalRevenue: 0,
  },
  {
    id: 'phuket',
    name: 'Пхукет',
    countryId: 'thailand',
    coordinates: [98.39, 7.88],
    labelOffset: [0, -18],
    partnersCount: 3,
    totalRevenue: 234000,
  },
  {
    id: 'antalya',
    name: 'Анталья',
    countryId: 'turkey',
    coordinates: [30.71, 36.9],
    labelOffset: [0, -18],
    partnersCount: 3,
    totalRevenue: 189000,
  },
]

export const globalStats: GlobalStats = {
  totalPartners: 10,
  totalRevenue: 550500,
  totalDeals: 47,
  activeCities: 3,
  totalCrmHours: 1788,
}

export function getCityById(citiesArr: City[], cityId: string): City | undefined {
  return citiesArr.find((city) => city.id === cityId)
}

export function getCountryById(countryId: string): Country | undefined {
  return countries.find((country) => country.id === countryId)
}

export function getCountryByCityId(cityId: string): Country | undefined {
  return countries.find((country) => country.cities.includes(cityId))
}

export function getMasterPartners(cityPartners: Partner[]): Partner[] {
  return cityPartners.filter((partner) => partner.type === 'master')
}

export function getSubPartners(cityPartners: Partner[], masterId: string): Partner[] {
  return cityPartners.filter((partner) => partner.type === 'sub' && partner.masterId === masterId)
}

export function formatCrmTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}ч ${mins}м`
}

export function getCityTotalCrmMinutes(city: City): number {
  return city.partners.reduce((sum, partner) => sum + partner.crmMinutes, 0)
}
