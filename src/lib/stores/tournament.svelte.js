import { loadTournament, saveTournament } from '../utils/persistence.js'

const QUOTES = [
  "I am the Great Cornholio!",
  "I need TP for my bunghole!",
  "Are you threatening me?",
  "You will cooperate with my bunghole.",
  "My bunghole will speak now.",
  "I am Cornholio! Come out with your pants down!",
  "Do not make my bunghole angry!",
  "The streets will flow with the blood of the non-believers!",
]

function createDefaultState() {
  return {
    step: 'welcome',
    settings: {
      format: 'round-robin',
      pointsToWin: 21,
      skunkRule: false,
      skunkDiff: 13,
      numGroups: 2,
      advancePerGroup: 2,
    },
    players: [],
    teams: [],
    groups: [],
    matches: [],
    bracket: null,
    champion: null,
  }
}

let state = $state(loadTournament() || createDefaultState())
let saveTimeout = null

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveTournament($state.snapshot(state)), 300)
}

export function getState() {
  return state
}

export function setStep(step) {
  state.step = step
  scheduleSave()
}

export function updateSettings(settings) {
  Object.assign(state.settings, settings)
  scheduleSave()
}

export function setPlayers(players) {
  state.players = players
  scheduleSave()
}

export function addPlayer(name) {
  state.players.push(name)
  scheduleSave()
}

export function removePlayer(index) {
  state.players.splice(index, 1)
  scheduleSave()
}

export function setTeams(teams) {
  state.teams = teams
  scheduleSave()
}

export function setGroups(groups) {
  state.groups = groups
  scheduleSave()
}

export function setMatches(matches) {
  state.matches = matches
  scheduleSave()
}

export function updateMatch(matchId, score1, score2) {
  const match = state.matches.find(m => m.id === matchId)
  if (match) {
    match.score1 = score1
    match.score2 = score2
    match.completed = true
    scheduleSave()
  }
}

export function setBracket(bracket) {
  state.bracket = bracket
  scheduleSave()
}

export function updateBracketMatch(matchId, score1, score2) {
  if (!state.bracket) return
  for (const round of state.bracket.winners || []) {
    const match = round.matches.find(m => m.id === matchId)
    if (match) {
      match.score1 = score1
      match.score2 = score2
      match.completed = true
      scheduleSave()
      return
    }
  }
  for (const round of state.bracket.losers || []) {
    const match = round.matches.find(m => m.id === matchId)
    if (match) {
      match.score1 = score1
      match.score2 = score2
      match.completed = true
      scheduleSave()
      return
    }
  }
  if (state.bracket.finals) {
    const match = state.bracket.finals.matches.find(m => m.id === matchId)
    if (match) {
      match.score1 = score1
      match.score2 = score2
      match.completed = true
      scheduleSave()
    }
  }
}

export function setChampion(champion) {
  state.champion = champion
  scheduleSave()
}

export function resetTournament() {
  Object.assign(state, createDefaultState())
  saveTournament($state.snapshot(state))
}

export function loadState(newState) {
  Object.assign(state, newState)
  scheduleSave()
}

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

export { QUOTES }
