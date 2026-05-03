export default function StatsCard({ title, value, icon, bgColor, textColor, subtitle, animatePulse }) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-transform duration-300 hover:scale-105 ${animatePulse ? 'ring-2 ring-red-400 animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${bgColor}`}>
          {icon}
        </div>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-4 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
