import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import PlayerPage from './pages/PlayerPage';
import type { Hunt } from './types';

type Page = 'home' | 'admin' | 'play';

function decodeHuntFromHash(): Hunt | null {
  try {
    const hash = window.location.hash;
    const match = hash.match(/[#&]hunt=([^&]*)/);
    if (!match) return null;
    return JSON.parse(decodeURIComponent(escape(atob(match[1]))));
  } catch {
    return null;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [huntId, setHuntId] = useState<string | undefined>();
  const [sharedHunt, setSharedHunt] = useState<Hunt | null>(null);

  useEffect(() => {
    const decoded = decodeHuntFromHash();
    if (decoded) {
      setSharedHunt(decoded);
      setPage('play');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const playId = params.get('play');
    if (playId) {
      setHuntId(playId);
      setPage('play');
    }
  }, []);

  const navigate = (p: string, id?: string) => {
    setPage(p as Page);
    if (id) setHuntId(id);
    setSharedHunt(null);
    window.history.pushState({}, '', p === 'play' && id ? `?play=${id}` : window.location.pathname);
  };

  if (page === 'admin') return <AdminPage onNavigate={navigate} />;
  if (page === 'play') {
    if (sharedHunt) return <PlayerPage huntData={sharedHunt} onNavigate={navigate} />;
    if (huntId) return <PlayerPage huntId={huntId} onNavigate={navigate} />;
  }
  return <HomePage onNavigate={navigate} />;
}
