import { ArrowLeft, Map, Activity, Clock } from 'lucide-react'
import FeedItem from './FeedItem'

export default function UserProfile({ user, fullName, activities, goBack, onActivityClick, formatDuration }) {
  // Hanya ambil aktivitas milik user ini
  const myActivities = activities.filter(act => act.user_id === user.id)

  // Kalkulasi statistik
  const totalDistance = myActivities.reduce((sum, act) => sum + (act.distance || 0), 0).toFixed(2)
  const totalElevation = myActivities.reduce((sum, act) => sum + (act.elevation_gain || 0), 0)
  const totalSeconds = myActivities.reduce((sum, act) => sum + (act.duration || 0), 0)

  // Format avatar URL menggunakan layanan gratis ui-avatars
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ea580c&color=fff&size=150&rounded=true&bold=true&font-size=0.33`

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profile Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-8">
          
          <button 
            onClick={goBack} 
            className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition font-medium mb-6"
          >
            <ArrowLeft size={18} /> Kembali ke Beranda
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <img 
              src={avatarUrl} 
              alt="Profile Avatar" 
              className="w-32 h-32 rounded-full shadow-lg border-4 border-white"
            />
            <div className="text-center md:text-left mt-2 flex-1">
              <h2 className="text-3xl font-black text-gray-900">{fullName}</h2>
              <p className="text-gray-500 font-medium mt-1">{user.email}</p>
              
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Pelari Strava Klon
                </span>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {myActivities.length} Aktivitas
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-10 border-t border-gray-100 pt-8">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Map size={24} className="text-orange-500 mb-2" />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Jarak</p>
              <p className="text-2xl md:text-3xl font-black text-gray-900">{totalDistance} <span className="text-sm font-normal text-gray-500">km</span></p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Clock size={24} className="text-orange-500 mb-2" />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Waktu</p>
              <p className="text-xl md:text-3xl font-black text-gray-900">{formatDuration(totalSeconds).replace(' mnt', 'm')}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Activity size={24} className="text-orange-500 mb-2" />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Elevasi</p>
              <p className="text-2xl md:text-3xl font-black text-gray-900">{totalElevation} <span className="text-sm font-normal text-gray-500">m</span></p>
            </div>
          </div>

        </div>
      </div>

      {/* Daftar Aktivitas */}
      <div className="max-w-4xl mx-auto px-6 mt-10">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          Aktivitas Anda
        </h3>
        
        {myActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
             <div className="rounded-full bg-gray-50 p-4 text-gray-400"><Activity size={32} /></div>
             <h3 className="mt-4 text-base font-semibold text-gray-900">Belum ada aktivitas</h3>
             <p className="text-sm text-gray-500 mt-1">Ayo mulai berlari dan catat rekor pertamamu!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {myActivities.map((act) => (
              <FeedItem 
                key={act.id} 
                act={act} 
                onClick={() => onActivityClick(act)} 
                formatDuration={formatDuration} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
