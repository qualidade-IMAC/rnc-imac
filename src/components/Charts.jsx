import React from 'react';

export const BarChart = ({ data, title, isTypes = false }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...(data || []).map(d => d.value || 0), 1);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full">
      <h3 className="text-sm font-black text-[#5C3A21] mb-5 border-b border-gray-100 pb-2">{title}</h3>
      <div className="space-y-3">
        {(data || []).map((item, index) => {
          const widthPercentage = ((item.value || 0) / maxValue) * 100;
          
          let barColor = item.color || '#9CA3AF'; 
          if (!isTypes) {
             barColor = index === 0 ? '#EF4444' : (index === 1 ? '#F59E0B' : '#9CA3AF');
          }

          return (
            <div key={index} className="animate-fade-in-up bg-gray-50 p-3 rounded-lg border border-gray-100" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className={`truncate pr-2 font-bold ${!isTypes && index === 0 ? 'text-gray-900' : 'text-gray-600'}`} title={item.label}>
                  {!isTypes ? <span className="text-gray-400 mr-1">{index + 1}.</span> : ''}{item.label}
                </span>
                <span className={`font-black text-sm px-2 py-0.5 rounded bg-white border shadow-sm ${!isTypes && index === 0 ? 'text-red-600 border-red-100' : 'text-gray-700 border-gray-200'}`}>
                  {item.value || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.max(widthPercentage, 1)}%`, backgroundColor: barColor }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TimelineChart = ({ data, title, color = '#F4B41A', onSelectDate, selectedDate }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map(d => d.value || 0), 1);
  const midValue = Math.ceil(maxValue / 2);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[320px]">
      <h3 className="text-sm font-black text-[#5C3A21] mb-6 flex justify-between border-b border-gray-100 pb-2">
        <span>{title}</span>
        {selectedDate && <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full animate-pulse shadow-sm">Dia Selecionado: {selectedDate.split('-').reverse().join('/')}</span>}
      </h3>
      
      <div className="flex-1 flex mt-2">
        <div className="w-8 relative border-r-2 border-gray-200 pb-8 shrink-0">
          <span className="absolute top-0 -translate-y-1/2 right-2 text-[11px] font-bold text-gray-500">{maxValue}</span>
          <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[11px] font-bold text-gray-500">{midValue}</span>
          <span className="absolute bottom-8 translate-y-1/2 right-2 text-[11px] font-bold text-gray-500">0</span>
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-0 pb-8 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-gray-200 border-dashed"></div>
            <div className="w-full border-t border-gray-200 border-dashed"></div>
            <div className="w-full border-t-2 border-gray-300"></div> 
          </div>

          <div className="absolute inset-0 pb-8 flex items-end justify-around px-4">
            {data.map((item, index) => {
              const hPercent = `${((item.value / maxValue) * 100)}%`;
              const isSelected = selectedDate === item.fullDate;
              return (
                <div key={index} className="flex flex-col items-center group z-10 h-full justify-end relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[12px] px-3 py-1.5 rounded-lg transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-md font-bold">
                    {item.value} Registros
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                  
                  <button 
                    onClick={() => onSelectDate && onSelectDate(item.fullDate)}
                    className={`w-full min-w-[24px] max-w-[32px] rounded-t-md transition-all duration-300 hover:opacity-90 cursor-pointer shadow-sm relative ${isSelected ? 'ring-4 ring-blue-300 scale-105' : ''}`}
                    style={{ height: hPercent === '0%' ? '0px' : hPercent, backgroundColor: isSelected ? '#3B82F6' : color }}
                  >
                    {item.value > 0 && <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/90">{item.value}</span>}
                  </button>

                  <span className={`absolute top-full mt-3 text-[11px] font-bold text-center ${isSelected ? 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PieChartComponent = ({ data, title }) => {
  if (!data || data.length === 0) return null;
  const total = (data || []).reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) return null;
  
  const colors = ['#F4B41A', '#ED7D31', '#5C3A21', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
  let currentAngle = 0;
  const slices = (data || []).map((item, index) => {
    const percentage = ((item.value || 0) / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle; currentAngle += angle;
    const startRad = ((startAngle - 90) * Math.PI) / 180, endRad = ((startAngle + angle - 90) * Math.PI) / 180;
    const cx = 50, cy = 50, r = 40;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    return { ...item, percentage, color: item.color || colors[index % colors.length], path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className="w-48 h-48">
          {slices.map((slice, index) => <path key={index} d={slice.path} fill={slice.color} stroke="white" strokeWidth="1" className="transition-all duration-500 hover:opacity-80 cursor-pointer"><title>{`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title></path>)}
          <circle cx="50" cy="50" r="25" fill="white" />
          <text x="50" y="48" textAnchor="middle" className="text-lg font-bold" fill="#1f2937">{total}</text>
          <text x="50" y="60" textAnchor="middle" className="text-xs" fill="#6b7280">Total</text>
        </svg>
        <div className="mt-4 grid grid-cols-2 gap-2 w-full">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 truncate" title={slice.label}>{slice.label}</div>
                <div className="text-xs text-gray-500">{slice.value} ({slice.percentage.toFixed(1)}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
