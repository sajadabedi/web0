import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Version {
  id: string
  messageId: string
  timestamp: number
  html: string
  css: string
  changes: {
    type: 'initial' | 'update'
    description: string
    isManualEdit?: boolean
  }
}

interface WebsiteVersionState {
  versions: Version[]
  currentVersionId: string | null
  addVersion: (version: Omit<Version, 'id'>) => string
  revertToVersion: (versionId: string) => void
  getCurrentVersion: () => Version | null
  getLatestNonManualVersion: () => {
    version: Version | null
    manualEdits: { id: string; content: string }[]
  }
}

export const useWebsiteVersionStore = create<WebsiteVersionState>()(
  devtools(
    (set, get) => ({
      versions: [],
      currentVersionId: null,

      addVersion: (version) => {
        const id = Math.random().toString(36).substring(7)
        const newVersion = { ...version, id }
        
        // If this is a manual edit, keep all versions
        // If it's an AI change, remove versions after the last non-manual version
        if (!version.changes.isManualEdit) {
          const { version: lastNonManual } = get().getLatestNonManualVersion()
          if (lastNonManual) {
            const lastIndex = get().versions.findIndex(v => v.id === lastNonManual.id)
            set((state) => ({
              versions: [...state.versions.slice(0, lastIndex + 1), newVersion],
              currentVersionId: newVersion.id
            }))
            return newVersion.id
          }
        }
        
        set((state) => ({
          versions: [...state.versions, newVersion],
          currentVersionId: newVersion.id
        }))
        
        return newVersion.id
      },

      revertToVersion: (versionId) => {
        const { versions } = get()
        const targetVersion = versions.find(v => v.id === versionId)
        if (!targetVersion) return

        // Find the index of the target version
        const targetIndex = versions.findIndex(v => v.id === versionId)
        if (targetIndex === -1) return

        // Keep only versions up to and including the target version
        set((state) => ({
          versions: state.versions.slice(0, targetIndex + 1),
          currentVersionId: versionId
        }))
      },

      getCurrentVersion: () => {
        const { versions, currentVersionId } = get()
        return versions.find(v => v.id === currentVersionId) || versions[versions.length - 1] || null
      },

      getLatestNonManualVersion: () => {
        const { versions } = get()
        const currentVersion = get().getCurrentVersion()
        if (!currentVersion) return { version: null, manualEdits: [] }

        // Find the index of the current version
        const currentIndex = versions.findIndex(v => v.id === currentVersion.id)
        if (currentIndex === -1) return { version: null, manualEdits: [] }

        // Get all versions up to current
        const relevantVersions = versions.slice(0, currentIndex + 1)

        // Find latest non-manual version
        const latestNonManual = [...relevantVersions]
          .reverse()
          .find(v => !v.changes.isManualEdit)

        if (!latestNonManual) return { version: null, manualEdits: [] }

        // Get all manual edits after the latest non-manual version
        const manualEdits: { id: string; content: string }[] = []
        const startIndex = versions.findIndex(v => v.id === latestNonManual.id)

        // Extract manual edits from version descriptions
        versions.slice(startIndex + 1).forEach(v => {
          if (v.changes.isManualEdit) {
            const match = v.changes.description.match(/Updated text "([^"]+)" to "([^"]+)"/)
            if (match) {
              manualEdits.push({
                id: match[1],
                content: match[2].replace(/\.\.\.$/, '') // Remove ellipsis if present
              })
            }
          }
        })

        return {
          version: latestNonManual,
          manualEdits
        }
      }
    }),
    {
      name: 'website-version-store',
    }
  )
)
