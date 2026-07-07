// src/components/PerformanceChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PerformanceChart({ coordinates }) {
  // Mengubah data koordinat GPS menjadi format data grafik
  // Karena mock data kita hanya [lat, lng], kita buat simulasi jarak (X) dan elevasi (Y)
  const chartData = coordinates.map((coord, index) => {
    return {
      titik: `Titik ${index + 1}`,
      // Simulasi elevasi acak naik turun antara 10m - 40m
      Elevasi: Math.floor(Math.sin(index) * 15) + 25, 
      // Simulasi kecepatan stabil dengan sedikit fluktuasi
      Kecepatan: parseFloat((10 + Math.cos(index) * 2).toFixed(1))
    }
  })

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Analisis Elevasi Latihan (Meter)</h5>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorElevasi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(234, 88, 12)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="rgb(234, 88, 12)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="titik" hide />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              labelStyle={{ display: 'none' }}
            />
            <Area 
              type="monotone" 
              dataKey="Elevasi" 
              stroke="rgb(234, 88, 12)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorElevasi)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}