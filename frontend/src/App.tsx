import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './context/store'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import CreatorStudio from './pages/CreatorStudio'
import Wallet from './pages/Wallet'
import AuthPage from './pages/AuthPage'
import Layout from './components/Common/Layout'
import ProtectedRoute from './components/Common/ProtectedRoute'

function App() {
  const { isAuth } = useStore()

  return (
    <Routes>
      <Route path="/" element={isAuth ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/studio" element={<CreatorStudio />} />
        <Route path="/wallet" element={<Wallet />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
