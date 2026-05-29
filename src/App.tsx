import { useState } from 'react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import PlayerPage from './pages/PlayerPage';
import type { Hunt } from './types';

type Page = 'home' | 'admin' | 'play';

export function encodeHunt(hunt: Hunt): string {
  const json = JSON.stringify(hunt);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeHunt(encoded: string): Hunt | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function getInitialState(): { page: Page; huntId?: string; sharedHunt?: Hunt } {
  const hash = window.location.hash;
  const match = hash.match(/[#&]hunt=([A-Za-z0-9+/=_-]+)/);
  if (match) {
    const hunt = decodeHunt(match[1]);
    if (hunt) return { page: 'play', sharedHunt: hunt };
  }
  const params = new URLSearchParams(window.location.search);
  const playId = params.get('play');
  if (playId) return { page: 'play', huntId: playId };
  return { page: 'home' };
}

const initial = getInitialState();

export default function App() {
  const [page, setPage] = useState<Page>(initial.page);
  const [huntId, setHuntId] = useState<string | undefined>(initial.huntId);
  const [sharedHunt, setSharedHunt] = useState<Hunt | null>(initial.sharedHunt ?? null);

  const navigate = (p: string, id?: string) => {
    setPage(p as Page);
    if (id) setHuntId(id);
    setSharedHunt(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  if (page === 'admin') return <AdminPage onNavigate={navigate} />;
  if (page === 'play') {
    if (sharedHunt) return <PlayerPage huntData={sharedHunt} onNavigate={navigate} />;
    if (huntId) return <PlayerPage huntId={huntId} onNavigate={navigate} />;
  }
  return <HomePage onNavigate={navigate} />;
}
