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
  const [showClue, setShowClue] = useState(true);
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
    }
  }, [position, hunt, currentIdx]);

  const handleNext = () => {
    if (!hunt) return;
    if (currentIdx >= hunt.stops.length - 1) {
      setFinished(true);
      return;
    }
    arrivedRef.current = false;
    setArrived(false);
    setCurrentIdx(i => i + 1);
    setShowClue(true);
  };

  if (!hunt) {
    return (
      <div className="flex items-center justify-center h-screen" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-gray-600">ציד לא נמצא</p>
          <button onClick={() => onNavigate('home')} className="mt-4 text-indigo-600 underline">חזור</button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
        <div className="text-center p-8">
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">כל הכבוד!</h1>
          <p className="text-gray-600 mb-4">סיימת את הציד: <strong>{hunt.name}</strong></p>
          {hunt.stops[hunt.stops.length - 1]?.clue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-gray-700">
              {hunt.stops[hunt.stops.length - 1].clue}
            </div>
          )}
          <button
            onClick={() => onNavigate('home')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700"
          >
            חזור לתפריט
          </button>
        </div>
      </div>
    );
  }

  const currentStop = hunt.stops[currentIdx];
  const isLast = currentIdx === hunt.stops.length - 1;

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{hunt.name}</h2>
            <p className="text-indigo-200 text-sm">
              תחנה {currentIdx + 1} מתוך {hunt.stops.length}
              {isLast ? ' — יעד סופי!' : ''}
            </p>
          </div>
          <div className="flex gap-1">
            {hunt.stops.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < currentIdx ? 'bg-green-400' :
                  i === currentIdx ? 'bg-yellow-400' : 'bg-indigo-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          stops={hunt.stops}
          playerPos={position}
          currentStopIndex={currentIdx}
        />

        {/* GPS error */}
        {error && (
          <div className="absolute top-2 right-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm z-[1000]">
            {error}
          </div>
        )}

        {/* GPS accuracy */}
        {position && (
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-lg text-xs text-gray-500 z-[1000]">
            GPS ±{Math.round(position.accuracy)}m
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-white border-t shadow-lg">
        {arrived ? (
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-green-700 mb-1">הגעת לתחנה!</p>
            <p className="text-gray-500 text-sm mb-3">{currentStop.name}</p>
            {showClue && currentStop.clue && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3 text-gray-700 text-sm">
                {isLast ? '🏁 ' : '🔍 '}{currentStop.clue}
              </div>
            )}
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700"
            >
              {isLast ? 'סיים את הציד!' : 'המשך לתחנה הבאה →'}
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700">
                {isLast ? '🏁 יעד סופי' : `📍 תחנה ${currentIdx + 1}`}: {currentStop.name}
              </span>
              <button
                onClick={() => setShowClue(v => !v)}
                className="text-indigo-600 text-sm"
              >
                {showClue ? 'הסתר רמז' : 'הצג רמז'}
              </button>
            </div>
            {showClue && currentStop.clue && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-gray-700 text-sm mb-2">
                🔍 {currentStop.clue}
              </div>
            )}
            {position ? (
              <p className="text-xs text-gray-400 text-center">
                {Math.round(haversineDistance(position.lat, position.lng, currentStop.lat, currentStop.lng))}m ממך
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-center">ממתין ל-GPS...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
