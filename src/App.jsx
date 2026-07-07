// src/App.jsx
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

function AppContent() {
  const { user } = useAuth()

  // Jika user sudah login, tampilkan Dashboard. Jika belum, tampilkan halaman Auth.
  return user ? <Dashboard /> : <Auth />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}