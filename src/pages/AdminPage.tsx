import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import MapView from '../components/MapView';
import type { Hunt, Stop } from '../types';
import { saveHunt, loadAllHunts, deleteHunt } from '../utils/storage';

interface EditStop extends Stop {}

function StopSheet({
  stop, idx, total, onUpdate, onDelete, onMove, onClose,
}: {
  stop: EditStop; idx: number; total: number;
  onUpdate: (p: Partial<Stop>) => void;
  onDelete: () => void;
  onMove: (d: -1 | 1) => void;
  onClose: () => void;
}) {
  const isLast = idx === total - 1;
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col justify-end" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl p-5 space-y-3 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-700">
            {isLast ? 'יעד סופי' : `תחנה ${idx + 1}`}
          </span>
          <div className="flex gap-2">
            <button onClick={() => onMove(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-lg">↑</button>
            <button onClick={() => onMove(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-lg">↓</button>
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-500 text-lg">✕</button>
          </div>
        </div>
        <input
          value={stop.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder="שם התחנה"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <textarea
          value={stop.clue}
          onChange={e => onUpdate({ clue: e.target.value })}
          placeholder={isLast ? 'הודעת ניצחון...' : 'רמז לתחנה הבאה...'}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 whitespace-nowrap">רדיוס הגעה</label>
          <input
            type="number"
            value={stop.radius}
            onChange={e => onUpdate({ radius: Number(e.target.value) })}
            className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-base"
            min={5} max={200}
          />
          <span className="text-sm text-gray-500">מטר</span>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-base mt-1"
        >
          סגור
        </button>
      </div>
    </div>
  );
}

export default function AdminPage({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [hunts, setHunts] = useState<Hunt[]>(loadAllHunts);
  const [tab, setTab] = useState<'map' | 'stops'>('map');

  const [huntName, setHuntName] = useState('');
  const [stops, setStops] = useState<EditStop[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [pendingStop, setPendingStop] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingStop({ lat, lng });
  }, []);

  const addStop = () => {
    if (!pendingStop) return;
    const newStop: EditStop = {
      id: uuid(),
      lat: pendingStop.lat,
      lng: pendingStop.lng,
      name: `תחנה ${stops.length + 1}`,
      clue: '',
      radius: 20,
    };
    setStops(prev => [...prev, newStop]);
    setEditingIdx(stops.length);
    setPendingStop(null);
  };

  const updateStop = (idx: number, patch: Partial<Stop>) =>
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const removeStop = (idx: number) => {
    setStops(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const moveStop = (idx: number, dir: -1 | 1) => {
    setStops(prev => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return arr;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
    setEditingIdx(i => i === null ? null : i + dir);
  };

  const saveAndBack = () => {
    if (!huntName.trim()) return alert('הכנס שם לציד');
    if (stops.length < 2) return alert('צריך לפחות 2 תחנות');
    const hunt: Hunt = { id: uuid(), name: huntName, stops, createdAt: Date.now() };
    saveHunt(hunt);
    setHunts(loadAllHunts());
    setView('list');
    setHuntName(''); setStops([]); setEditingIdx(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את הציד?')) return;
    deleteHunt(id);
    setHunts(loadAllHunts());
  };

  const share = (hunt: Hunt) => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(hunt))));
    const url = `${window.location.origin}${window.location.pathname}#hunt=${encoded}`;
    if (navigator.share) {
      navigator.share({ title: hunt.name, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('הקישור הועתק!');
    }
  };

  // ── List view ──
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between z-10">
          <button onClick={() => onNavigate('home')} className="text-gray-400 text-2xl leading-none">←</button>
          <h1 className="text-lg font-bold text-gray-800">הצידים שלי</h1>
          <button
            onClick={() => setView('create')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium text-sm"
          >
            + חדש
          </button>
        </div>

        <div className="p-4 space-y-3 pb-8">
          {hunts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-base">אין ציד עדיין</p>
              <p className="text-sm mt-1">לחץ + חדש כדי להתחיל</p>
            </div>
          ) : hunts.map(hunt => (
            <div key={hunt.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-base">{hunt.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{hunt.stops.length} תחנות</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onNavigate('play', hunt.id)}
                  className="bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium"
                >
                  שחק
                </button>
                <button
                  onClick={() => share(hunt)}
                  className="bg-indigo-50 text-indigo-700 py-2.5 rounded-xl text-sm font-medium"
                >
                  שתף
                </button>
                <button
                  onClick={() => handleDelete(hunt.id)}
                  className="bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-medium"
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Create view ──
  return (
    <div className="flex flex-col h-svh" dir="rtl">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => setView('list')} className="text-gray-400 text-2xl leading-none">←</button>
        <input
          value={huntName}
          onChange={e => setHuntName(e.target.value)}
          placeholder="שם הציד..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={saveAndBack}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
        >
          שמור
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map (always mounted) */}
        <div className={`absolute inset-0 ${tab === 'stops' ? 'pointer-events-none opacity-0' : ''}`}>
          <MapView
            stops={stops}
            adminMode
            onMapClick={handleMapClick}
            onStopClick={idx => { setEditingIdx(idx); }}
          />
          {!pendingStop && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-full px-4 py-1.5 text-xs text-gray-500 shadow z-[1000]">
              הקש על המפה להוספת תחנה
            </div>
          )}
          {pendingStop && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl px-5 py-3 flex gap-3 items-center z-[1000]">
              <span className="text-sm text-gray-600">תחנה חדשה?</span>
              <button onClick={addStop} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium">הוסף</button>
              <button onClick={() => setPendingStop(null)} className="text-gray-400 text-sm">ביטול</button>
            </div>
          )}
        </div>

        {/* Stops list tab */}
        {tab === 'stops' && (
          <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
            {stops.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p>עדיין אין תחנות</p>
                <p className="text-sm mt-1">עבור למפה והוסף נקודות</p>
              </div>
            ) : (
              <div className="divide-y">
                {stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 px-4 py-3.5 bg-white active:bg-gray-50"
                    onClick={() => { setEditingIdx(idx); setTab('map'); }}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${idx === stops.length - 1 ? 'bg-red-500' : 'bg-indigo-500'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{stop.name}</p>
                      <p className="text-xs text-gray-400 truncate">{stop.clue || 'ללא רמז'}</p>
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom tabs */}
      <div className="bg-white border-t grid grid-cols-2 shrink-0">
        <button
          onClick={() => setTab('map')}
          className={`py-3.5 text-sm font-medium ${tab === 'map' ? 'text-indigo-600 border-t-2 border-indigo-600 -mt-px' : 'text-gray-400'}`}
        >
          מפה
        </button>
        <button
          onClick={() => setTab('stops')}
          className={`py-3.5 text-sm font-medium ${tab === 'stops' ? 'text-indigo-600 border-t-2 border-indigo-600 -mt-px' : 'text-gray-400'}`}
        >
          תחנות {stops.length > 0 && `(${stops.length})`}
        </button>
      </div>

      {/* Stop edit sheet */}
      {editingIdx !== null && stops[editingIdx] && (
        <StopSheet
          stop={stops[editingIdx]}
          idx={editingIdx}
          total={stops.length}
          onUpdate={p => updateStop(editingIdx, p)}
          onDelete={() => removeStop(editingIdx)}
          onMove={d => moveStop(editingIdx, d)}
          onClose={() => setEditingIdx(null)}
        />
      )}
    </div>
  );
}
