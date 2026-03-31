const STORAGE_KEY = 'cornholio-tournament'

export function saveTournament(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save tournament state:', e)
  }
}

export function loadTournament() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn('Failed to load tournament state:', e)
    return null
  }
}

export function clearTournament() {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportTournament(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cornholio-tournament-${new Date().toISOString().split('T')[0]}.json`
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
        resolve(state)
      } catch (e) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
