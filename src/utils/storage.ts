import type { Hunt, PlayerState } from '../types';

const HUNTS_KEY = 'scavenger_hunts';
const PLAYER_KEY = 'scavenger_player';

export function saveHunt(hunt: Hunt): void {
  const hunts = loadAllHunts();
  const idx = hunts.findIndex(h => h.id === hunt.id);
  if (idx >= 0) hunts[idx] = hunt;
  else hunts.push(hunt);
  localStorage.setItem(HUNTS_KEY, JSON.stringify(hunts));
}

export function loadAllHunts(): Hunt[] {
  try {
    return JSON.parse(localStorage.getItem(HUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function loadHunt(id: string): Hunt | null {
  return loadAllHunts().find(h => h.id === id) ?? null;
}

export function deleteHunt(id: string): void {
  const hunts = loadAllHunts().filter(h => h.id !== id);
  localStorage.setItem(HUNTS_KEY, JSON.stringify(hunts));
}

export function savePlayerState(state: PlayerState): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(state));
}

export function loadPlayerState(): PlayerState | null {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearPlayerState(): void {
  localStorage.removeItem(PLAYER_KEY);
}
