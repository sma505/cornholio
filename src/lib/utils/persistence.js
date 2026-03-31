const INDEX_KEY = 'cornholio-index'
const PREFIX = 'cornholio-t-'

// --- Tournament Index ---

export function getTournamentIndex() {
  try {
    const data = localStorage.getItem(INDEX_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function saveIndex(index) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

// --- Single Tournament CRUD ---

export function saveTournament(state) {
  if (!state.id) return
  try {
    localStorage.setItem(PREFIX + state.id, JSON.stringify(state))
    // Update index
    const index = getTournamentIndex()
    const entry = index.find(e => e.id === state.id)
    const meta = {
      id: state.id,
      name: state.name || 'Unnamed Tournament',
      format: state.settings?.format || 'round-robin',
      gameMode: state.settings?.gameMode || 'standard',
      step: state.step,
      updatedAt: new Date().toISOString(),
    }
    if (entry) {
      Object.assign(entry, meta)
    } else {
      meta.createdAt = new Date().toISOString()
      index.push(meta)
    }
    saveIndex(index)
  } catch (e) {
    console.warn('Failed to save tournament:', e)
  }
}

export function loadTournament(id) {
  try {
    const data = localStorage.getItem(PREFIX + id)
    return data ? JSON.parse(data) : null
  } catch { return null }
}

export function deleteTournament(id) {
  localStorage.removeItem(PREFIX + id)
  const index = getTournamentIndex().filter(e => e.id !== id)
  saveIndex(index)
}

// --- Migration: move old single-tournament key to new format ---

export function migrateOldStorage() {
  const OLD_KEY = 'cornholio-tournament'
  try {
    const old = localStorage.getItem(OLD_KEY)
    if (!old) return
    const state = JSON.parse(old)
    if (!state.step || !state.settings) return
    // Assign an ID and name if missing
    if (!state.id) state.id = crypto.randomUUID()
    if (!state.name) state.name = 'My Tournament'
    saveTournament(state)
    localStorage.removeItem(OLD_KEY)
  } catch { /* ignore */ }
}

// --- Export / Import ---

export function exportTournament(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const name = (state.name || 'tournament').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-')
  link.download = `cornholio-${name}-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function importTournament(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const state = JSON.parse(reader.result)
        if (!state.step || !state.settings || !state.players) {
          reject(new Error('Invalid tournament file'))
          return
        }
        // Assign new ID to avoid collisions
        state.id = crypto.randomUUID()
        resolve(state)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
