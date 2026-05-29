import { useState } from 'react';
import { loadHunt } from '../utils/storage';

interface Props {
  onNavigate: (page: string, id?: string) => void;
}

export default function HomePage({ onNavigate }: Props) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const joinByCode = () => {
    const hunt = loadHunt(code.trim());
    if (!hunt) {
      setErr('ציד לא נמצא');
      return;
    }
    onNavigate('play', hunt.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4">🗺️</div>
        <h1 className="text-4xl font-bold text-white mb-2">ציד האוצר</h1>
        <p className="text-indigo-200">מרוץ לנקודות עם רמזים בדרך</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => onNavigate('admin')}
          className="w-full bg-white text-indigo-700 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-50 shadow-lg"
        >
          צור ציד חדש
        </button>

        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white text-sm mb-2">הצטרף עם קוד ציד:</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setErr(''); }}
              placeholder="הכנס קוד..."
              className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && joinByCode()}
            />
            <button
              onClick={joinByCode}
              className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-yellow-300"
            >
              כנס
            </button>
          </div>
          {err && <p className="text-red-300 text-xs mt-1">{err}</p>}
        </div>
      </div>
    </div>
  );
}
