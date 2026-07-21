import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WinnersPage from './WinnersPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WinnersPage />
  </StrictMode>,
)
