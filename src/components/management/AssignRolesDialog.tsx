import { useState } from 'react'
import { Shield } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PermissionRow } from './PermissionRow'
import { ConfirmationDialog } from './ConfirmationDialog'
import type { Partner, Permission } from '@/types/dashboard'

interface AssignRolesDialogProps {
  partner: Partner | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (partnerId: string, permissions: Permission[]) => void
}

interface PendingToggle {
  id: string
  checked: boolean
}

export function AssignRolesDialog({
  partner,
  open,
  onOpenChange,
  onSave,
}: AssignRolesDialogProps) {
  const [localPermissions, setLocalPermissions] = useState<Permission[]>([])
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && partner) {
      setLocalPermissions(partner.permissions.map((permission) => ({ ...permission })))
    }

    if (!isOpen) {
      setPendingToggle(null)
    }

    onOpenChange(isOpen)
  }

  const requestPermissionToggle = (id: string, checked: boolean) => {
    setPendingToggle({ id, checked })
  }

  const confirmToggle = () => {
    if (!partner || !pendingToggle) return

    const updatedPermissions = localPermissions.map((permission) =>
      permission.id === pendingToggle.id ? { ...permission, enabled: pendingToggle.checked } : permission
    )

    setLocalPermissions(updatedPermissions)
    onSave(partner.id, updatedPermissions)
    setPendingToggle(null)
  }

  if (!partner) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-blue-500" />
              Доступы партнера
            </DialogTitle>
            <DialogDescription>
              Переключатели работают в режиме мгновенного применения с подтверждением каждого изменения.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <ScrollArea className="-mx-1 max-h-[360px] px-1">
            {localPermissions.map((permission) => (
              <PermissionRow
                key={permission.id}
                label={permission.label}
                description={permission.description}
                checked={permission.enabled}
                onCheckedChange={(checked) => requestPermissionToggle(permission.id, checked)}
              />
            ))}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(pendingToggle)}
        title="Подтвердите изменение"
        description="Вы уверены? Это изменит права доступа партнера"
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </>
  )
}
