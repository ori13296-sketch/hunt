interface Props {
  onNavigate: (page: string, id?: string) => void;
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-indigo-600 to-indigo-900 flex flex-col items-center justify-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]" dir="rtl">
      <div className="text-center mb-12">
        <div className="text-8xl mb-5">🗺️</div>
        <h1 className="text-4xl font-bold text-white mb-2">ציד האוצר</h1>
        <p className="text-indigo-300 text-base">מרוץ לנקודות עם רמזים בדרך</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => onNavigate('admin')}
          className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
        >
          צור ציד חדש
        </button>
        <p className="text-indigo-400 text-sm text-center pt-2">
          יש לך קישור ציד? פשוט פתח אותו
        </p>
      </div>
    </div>
  );
}
