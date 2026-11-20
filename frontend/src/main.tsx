import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { App } from './App.tsx'
import { installAuthFetch } from './lib/auth'
import { initSkylark } from './lib/skylark'
import { SkylarkErrorBoundary } from './lib/SkylarkErrorBoundary'

installAuthFetch()
initSkylark()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SkylarkErrorBoundary>
        <App />
      </SkylarkErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
