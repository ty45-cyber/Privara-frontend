import { useState, useEffect } from 'react'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import './index.css'

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('privara_token'))

  function onAuth(token) {
    localStorage.setItem('privara_token', token)
    setAuthed(true)
  }

  function onLogout() {
    localStorage.removeItem('privara_token')
    setAuthed(false)
  }

  return authed ? <Dashboard onLogout={onLogout} /> : <AuthPage onAuth={onAuth} />
}