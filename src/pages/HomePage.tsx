interface Props {
  onNavigate: (page: string, id?: string) => void;
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4">🗺️</div>
        <h1 className="text-4xl font-bold text-white mb-2">ציד האוצר</h1>
        <p className="text-indigo-200">מרוץ לנקודות עם רמזים בדרך</p>
      </div>

      <div className="w-full max-w-sm">
        <button
          onClick={() => onNavigate('admin')}
          className="w-full bg-white text-indigo-700 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-50 shadow-lg"
        >
          צור ציד חדש
        </button>
        <p className="text-indigo-300 text-sm text-center mt-4">
          יש לך קישור ציד? פשוט פתח אותו
        </p>
      </div>
    </div>
  );
}
