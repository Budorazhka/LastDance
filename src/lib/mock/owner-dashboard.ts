import {
  getAllPartnerIds,
  getCurrentUserId,
  getPartnerSummary,
} from "@/lib/mock/analytics-network"
import type {
  CabinetRole,
  OwnerCabinetOption,
  OwnerDashboardContext,
  OwnerHierarchyNode,
} from "@/types/owner-dashboard"

const ROOT_OWNER_NODE_ID = "supreme-owner-root"

const rolePriority: Record<CabinetRole, number> = {
  supreme_owner: 0,
  master_partner: 1,
  partner: 2,
}

function getPartnerLabel(partnerId: string, fallback: string) {
  return getPartnerSummary(partnerId)?.name ?? fallback
}

function createHierarchy(): OwnerHierarchyNode[] {
  const currentUserId = getCurrentUserId()
  const partnerIds = getAllPartnerIds()
  const pool = partnerIds.filter((id) => id !== currentUserId)

  const masterPersonIds = [currentUserId, ...pool.slice(0, 2)]
  const masterSet = new Set(masterPersonIds)
  const memberPersonIds = pool.filter((id) => !masterSet.has(id))

  const childrenByMaster = new Map<string, string[]>(
    masterPersonIds.map((masterId) => [masterId, []])
  )

  memberPersonIds.forEach((partnerId, index) => {
    const masterId = masterPersonIds[index % masterPersonIds.length]
    childrenByMaster.get(masterId)?.push(partnerId)
  })

  const masterNodeIds = masterPersonIds.map((masterId) => `master-${masterId}`)
  const nodes: OwnerHierarchyNode[] = [
    {
      id: ROOT_OWNER_NODE_ID,
      role: "supreme_owner",
      label: "Вы",
      personId: currentUserId,
      parentId: null,
      childrenIds: masterNodeIds,
    },
  ]

  masterPersonIds.forEach((masterId, masterIndex) => {
    const masterNodeId = `master-${masterId}`
    const children = childrenByMaster.get(masterId) ?? []
    const childrenNodeIds = children.map((childId) => `partner-${childId}`)
    nodes.push({
      id: masterNodeId,
      role: "master_partner",
      label: getPartnerLabel(masterId, `Master ${masterIndex + 1}`),
      personId: masterId,
      parentId: ROOT_OWNER_NODE_ID,
      childrenIds: childrenNodeIds,
    })

    children.forEach((childId, childIndex) => {
      nodes.push({
        id: `partner-${childId}`,
        role: "partner",
        label: getPartnerLabel(childId, `Partner ${childIndex + 1}`),
        personId: childId,
        parentId: masterNodeId,
        childrenIds: [],
      })
    })
  })

  return nodes
}

function createCabinets(
  currentUserId: string,
  hierarchy: OwnerHierarchyNode[]
): OwnerCabinetOption[] {
  const networkOption: OwnerCabinetOption = {
    id: "network",
    scope: "network",
    role: "supreme_owner",
    label: "Вся сеть",
  }

  const personalOption: OwnerCabinetOption = {
    id: "me",
    scope: "me",
    role: "master_partner",
    label: "Мой кабинет",
    personId: currentUserId,
  }

  const partnerOptions = hierarchy
    .filter((node) => node.role !== "supreme_owner")
    .map<OwnerCabinetOption>((node) => ({
      id: `partner-${node.personId}`,
      scope: "partner",
      role: node.role,
      label: node.label,
      personId: node.personId,
    }))
    .filter((option) => option.personId !== currentUserId)
    .sort((a, b) => {
      const roleDiff = rolePriority[a.role] - rolePriority[b.role]
      if (roleDiff !== 0) return roleDiff
      return a.label.localeCompare(b.label, "ru", { sensitivity: "base" })
    })

  return [networkOption, personalOption, ...partnerOptions]
}

let cachedContext: OwnerDashboardContext | null = null

export function getOwnerDashboardContext(): OwnerDashboardContext {
  if (cachedContext) return cachedContext

  const currentUserId = getCurrentUserId()
  const hierarchy = createHierarchy()
  const availableCabinets = createCabinets(currentUserId, hierarchy)

  cachedContext = {
    currentUserId,
    availableCabinets,
    hierarchy,
  }

  return cachedContext
}

