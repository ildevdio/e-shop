import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './services/tenantSetup'
import App from './App.tsx'
import { useSistemaStore } from './store/sistemaStore'

useSistemaStore.getState().carregar()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
