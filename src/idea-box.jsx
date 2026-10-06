import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import IdeaBoxPage from './IdeaBoxPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IdeaBoxPage />
  </StrictMode>,
)
