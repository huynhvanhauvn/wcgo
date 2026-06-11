import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import './i18n'
import { AuthProvider } from './context/AuthProvider'
import { TimerProvider } from './context/TimerProvider'

// SECURITY: Disable all console logs in production mode to prevent information leakage
if (import.meta.env.PROD) {
  // console.log = () => {}
  // console.debug = () => {}
  // console.info = () => {}
  // console.warn = () => {}
  // We keep console.error for critical runtime monitoring,
  // but you can disable it too if you want absolute silence:
  // console.error = () => {}
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <TimerProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TimerProvider>
    </AuthProvider>
  </React.StrictMode>
)
