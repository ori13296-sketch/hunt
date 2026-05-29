import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import PlayerPage from './pages/PlayerPage';

type Page = 'home' | 'admin' | 'play';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [huntId, setHuntId] = useState<string | undefined>();

  useEffect(() => {
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
    window.history.pushState({}, '', p === 'play' && id ? `?play=${id}` : '/');
  };

  if (page === 'admin') return <AdminPage onNavigate={navigate} />;
  if (page === 'play' && huntId) return <PlayerPage huntId={huntId} onNavigate={navigate} />;
  return <HomePage onNavigate={navigate} />;
}
