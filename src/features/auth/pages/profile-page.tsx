import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { initials } from '../../../shared/lib/initials'
import { resolveDisplayName } from '../../../shared/lib/resolve-display-name'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { StatTile } from '../../../shared/ui/stat-tile'
import iconChevronRight from '../../../assets/icons/icon-chevron-right.svg'
import iconEdit from '../../../assets/icons/icon-edit.svg'
import iconEquipFreeweight from '../../../assets/icons/icon-equip-freeweight.svg'
import { useHomeStatsQuery } from '../../history/api/use-history'
import { signOut, updateDisplayName } from '../api/auth'
import { useSession } from '../api/use-session'

// `/profile` (PR11 — this screen was never part of the original 9-screen
// Figma set, designed now consistent with the rest of the app's tokens/
// components). Deliberately does NOT add body-measurement/height/weight/
// unit-preference fields — out of scope for v1 per the original spec
// (single kg unit, no body measurements).
export function ProfilePage() {
  const { session } = useSession()
  const statsQuery = useHomeStatsQuery()
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedDisplayName, setSavedDisplayName] = useState<string | undefined>(undefined)

  const metadataDisplayName = savedDisplayName ?? session?.user.user_metadata?.display_name
  const displayName = resolveDisplayName(metadataDisplayName, session?.user.email)

  function startEditing() {
    setDraftName(displayName)
    setSaveError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setSaveError(null)
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    const result = await updateDisplayName(draftName)
    setIsSaving(false)

    if (result.error !== null) {
      setSaveError(result.error)
      return
    }

    setSavedDisplayName(result.data.user_metadata?.display_name)
    setIsEditing(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">Perfil</h1>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-display text-base font-bold text-foreground">
            {initials(displayName)}
          </div>

          <div className="flex flex-1 flex-col gap-1">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  aria-label="Nombre"
                  disabled={isSaving}
                />
                {saveError && <span className="text-sm text-red-400">{saveError}</span>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={cancelEditing} disabled={isSaving}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-extrabold uppercase tracking-wide text-foreground">
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={startEditing}
                  aria-label="Editar nombre"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:text-foreground"
                >
                  <img src={iconEdit} alt="" className="h-4 w-4" />
                </button>
              </div>
            )}
            <span className="font-mono text-xs text-muted">{session?.user.email ?? ''}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <StatTile label="Sesiones" value={String(statsQuery.data?.sessions ?? 0)} />
          <StatTile
            label="Volumen kg"
            value={String(statsQuery.data?.volumeKg ?? 0)}
            valueClassName="text-data"
          />
          <StatTile label="PRs" value={String(statsQuery.data?.prCount ?? 0)} valueClassName="text-positive" />
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground">Ajustes</h2>
          <Link
            to="/settings/equipment"
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 hover:border-accent/60"
          >
            <img src={iconEquipFreeweight} alt="" className="h-5 w-5 opacity-70" />
            <span className="flex-1 text-sm text-foreground">Equipo disponible</span>
            <img src={iconChevronRight} alt="" className="h-4 w-4 opacity-50" />
          </Link>
        </section>

        <Button variant="secondary" size="sm" onClick={handleSignOut} className="self-start text-red-400">
          Cerrar sesión
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
