import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import MapView from '../components/MapView';
import type { Hunt, Stop } from '../types';
import { saveHunt, loadAllHunts, deleteHunt } from '../utils/storage';

interface EditStop extends Stop {
  editing?: boolean;
}

export default function AdminPage({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [hunts, setHunts] = useState<Hunt[]>(loadAllHunts);

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

  const updateStop = (idx: number, patch: Partial<Stop>) => {
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const removeStop = (idx: number) => {
    setStops(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const moveStop = (idx: number, dir: -1 | 1) => {
    setStops(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const saveAndBack = () => {
    if (!huntName.trim()) return alert('הכנס שם לציד');
    if (stops.length < 2) return alert('צריך לפחות 2 תחנות');
    const hunt: Hunt = {
      id: uuid(),
      name: huntName,
      stops,
      createdAt: Date.now(),
    };
    saveHunt(hunt);
    setHunts(loadAllHunts());
    setView('list');
    setHuntName('');
    setStops([]);
    setEditingIdx(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את הציד?')) return;
    deleteHunt(id);
    setHunts(loadAllHunts());
  };

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">ניהול ציד האוצר</h1>
            <button
              onClick={() => setView('create')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              + ציד חדש
            </button>
          </div>

          {hunts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">🗺️</div>
              <p>אין ציד עדיין. צור ציד חדש!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hunts.map(hunt => (
                <div key={hunt.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{hunt.name}</h3>
                      <p className="text-sm text-gray-500">{hunt.stops.length} תחנות</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigate('play', hunt.id)}
                        className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-200"
                      >
                        שחק
                      </button>
                      <button
                        onClick={() => {
                          const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(hunt))));
                          const url = `${window.location.origin}${window.location.pathname}#hunt=${encoded}`;
                          navigator.clipboard.writeText(url);
                          alert('הקישור הועתק!');
                        }}
                        className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-200"
                      >
                        שתף
                      </button>
                      <button
                        onClick={() => handleDelete(hunt.id)}
                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">← חזור</button>
        <input
          value={huntName}
          onChange={e => setHuntName(e.target.value)}
          placeholder="שם הציד..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={saveAndBack}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          שמור
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            stops={stops}
            adminMode
            onMapClick={handleMapClick}
            onStopClick={setEditingIdx}
          />
          {pendingStop && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 flex gap-2 z-[1000]">
              <span className="text-sm text-gray-600">לחצת על המפה</span>
              <button onClick={addStop} className="bg-indigo-600 text-white px-3 py-0.5 rounded-lg text-sm">הוסף תחנה</button>
              <button onClick={() => setPendingStop(null)} className="text-gray-400 text-sm">ביטול</button>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white rounded-lg shadow px-3 py-1.5 text-xs text-gray-500 z-[1000]">
            לחץ על המפה להוספת תחנה
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-3 border-b">
            <p className="text-xs text-gray-500">{stops.length} תחנות • {stops.length > 0 ? 'הדוגמה מסומנת בכתום' : 'לחץ על המפה'}</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {stops.map((stop, idx) => (
              <div
                key={stop.id}
                className={`p-3 cursor-pointer ${editingIdx === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                onClick={() => setEditingIdx(idx)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === stops.length - 1 ? 'bg-red-500' : 'bg-indigo-500'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs text-gray-500">{idx === stops.length - 1 ? 'יעד סופי' : `תחנה ${idx + 1}`}</span>
                  <div className="flex gap-1 mr-auto">
                    <button onClick={(e) => { e.stopPropagation(); moveStop(idx, -1); }} className="text-gray-400 hover:text-gray-600 text-xs">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveStop(idx, 1); }} className="text-gray-400 hover:text-gray-600 text-xs">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); removeStop(idx); }} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                </div>

                {editingIdx === idx && (
                  <div className="space-y-2" onClick={e => e.stopPropagation()}>
                    <input
                      value={stop.name}
                      onChange={e => updateStop(idx, { name: e.target.value })}
                      placeholder="שם התחנה"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                    <textarea
                      value={stop.clue}
                      onChange={e => updateStop(idx, { clue: e.target.value })}
                      placeholder={idx === stops.length - 1 ? 'הודעת ניצחון...' : 'רמז לתחנה הבאה...'}
                      rows={3}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">רדיוס הגעה:</label>
                      <input
                        type="number"
                        value={stop.radius}
                        onChange={e => updateStop(idx, { radius: Number(e.target.value) })}
                        className="w-16 border border-gray-200 rounded px-1 py-0.5 text-sm"
                        min={5}
                        max={200}
                      />
                      <span className="text-xs text-gray-500">מטר</span>
                    </div>
                  </div>
                )}
                {editingIdx !== idx && stop.clue && (
                  <p className="text-xs text-gray-500 truncate">{stop.clue}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
