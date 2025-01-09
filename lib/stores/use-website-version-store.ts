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
  }
}

interface WebsiteVersionState {
  versions: Version[]
  currentVersionId: string | null
  addVersion: (version: Omit<Version, 'id'>) => string
  revertToVersion: (versionId: string) => void
  getCurrentVersion: () => Version | null
}

export const useWebsiteVersionStore = create<WebsiteVersionState>()(
  devtools(
    (set, get) => ({
      versions: [],
      currentVersionId: null,

      addVersion: (version) => {
        const id = Math.random().toString(36).substring(7)
        const newVersion = { ...version, id }
        
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
        if (!currentVersionId) return null
        return versions.find(v => v.id === currentVersionId) || null
      },
    }),
    {
      name: 'website-version-store',
    }
  )
)
