import { Navigate } from 'react-router-dom'
import { useStore } from '../../context/store'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth } = useStore()
  if (!isAuth) return <Navigate to="/auth" replace />
  return <>{children}</>
}
