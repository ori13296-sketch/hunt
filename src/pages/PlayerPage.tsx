import { useState, useEffect, useRef } from 'react';
import MapView from '../components/MapView';
import { useGeolocation } from '../hooks/useGeolocation';
import { haversineDistance } from '../utils/distance';
import { loadHunt } from '../utils/storage';
import type { Hunt } from '../types';

interface Props {
  huntId?: string;
  huntData?: Hunt;
  onNavigate: (page: string) => void;
}

export default function PlayerPage({ huntId, huntData, onNavigate }: Props) {
  const [hunt, setHunt] = useState<Hunt | null>(huntData ?? null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [finished, setFinished] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const arrivedRef = useRef(false);
  const { position, error } = useGeolocation();

  useEffect(() => {
    if (huntData) return;
    if (!huntId) return;
    const h = loadHunt(huntId);
    if (h) setHunt(h);
  }, [huntId, huntData]);

  useEffect(() => {
    if (!hunt || !position || arrivedRef.current) return;
    const stop = hunt.stops[currentIdx];
    if (!stop) return;
    const dist = haversineDistance(position.lat, position.lng, stop.lat, stop.lng);
    if (dist <= stop.radius) {
      arrivedRef.current = true;
      setArrived(true);
      setPanelOpen(true);
    }
  }, [position, hunt, currentIdx]);

  const handleNext = () => {
    if (!hunt) return;
    if (currentIdx >= hunt.stops.length - 1) { setFinished(true); return; }
    arrivedRef.current = false;
    setArrived(false);
    setCurrentIdx(i => i + 1);
    setPanelOpen(true);
  };

  if (!hunt) {
    return (
      <div className="flex items-center justify-center h-svh bg-gray-50" dir="rtl">
        <div className="text-center p-6">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">ציד לא נמצא</p>
          <button onClick={() => onNavigate('home')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium">חזור</button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center h-svh bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
        <div className="text-center px-8">
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">כל הכבוד!</h1>
          <p className="text-gray-500 mb-6">{hunt.name}</p>
          {hunt.stops[hunt.stops.length - 1]?.clue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-gray-700 text-base">
              {hunt.stops[hunt.stops.length - 1].clue}
            </div>
          )}
          <button
            onClick={() => onNavigate('home')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-semibold text-base"
          >
            חזור לתפריט
          </button>
        </div>
      </div>
    );
  }

  const currentStop = hunt.stops[currentIdx];
  const isLast = currentIdx === hunt.stops.length - 1;
  const distM = position
    ? Math.round(haversineDistance(position.lat, position.lng, currentStop.lat, currentStop.lng))
    : null;

  return (
    <div className="flex flex-col h-svh" dir="rtl">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{hunt.name}</p>
            <p className="text-indigo-200 text-xs mt-0.5">
              תחנה {currentIdx + 1}/{hunt.stops.length}{isLast ? ' — יעד סופי!' : ''}
            </p>
          </div>
          <div className="flex gap-1 shrink-0 mr-3">
            {hunt.stops.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < currentIdx ? 'bg-green-400' : i === currentIdx ? 'bg-yellow-400' : 'bg-indigo-400'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapView stops={hunt.stops} playerPos={position} currentStopIndex={currentIdx} />

        {error && (
          <div className="absolute top-3 right-3 left-3 bg-red-100 text-red-700 px-3 py-2 rounded-xl text-sm text-center z-[1000]">
            {error}
          </div>
        )}
        {position && !error && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs text-gray-500 z-[1000]">
            ±{Math.round(position.accuracy)}m
          </div>
        )}

        {/* Collapse toggle */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 z-[1000]"
          >
            {arrived ? '✅ הגעת! לחץ להמשך' : distM !== null ? `${distM}m מהמטרה` : 'הצג רמז'}
          </button>
        )}
      </div>

      {/* Bottom panel */}
      {panelOpen && (
        <div className="bg-white border-t shadow-2xl shrink-0" dir="rtl">
          {arrived ? (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-bold text-green-700">הגעת לתחנה!</p>
                  <p className="text-sm text-gray-500">{currentStop.name}</p>
                </div>
                <button onClick={() => setPanelOpen(false)} className="mr-auto text-gray-300 text-2xl leading-none">⌄</button>
              </div>
              {currentStop.clue && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-gray-700 text-sm mb-4">
                  {isLast ? '🏁 ' : '🔍 '}{currentStop.clue}
                </div>
              )}
              <button
                onClick={handleNext}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-semibold text-base"
              >
                {isLast ? 'סיים את הציד! 🏆' : 'תחנה הבאה →'}
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800 text-sm">
                  {isLast ? '🏁 יעד סופי' : `📍 תחנה ${currentIdx + 1}`}: {currentStop.name}
                </p>
                <button onClick={() => setPanelOpen(false)} className="text-gray-300 text-2xl leading-none">⌄</button>
              </div>
              {currentStop.clue && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 text-gray-700 text-sm mb-3">
                  🔍 {currentStop.clue}
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">
                {distM !== null ? `${distM} מטר ממך` : 'ממתין ל-GPS...'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
