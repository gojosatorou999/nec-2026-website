import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BlogPage from './BlogPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BlogPage />
  </StrictMode>,
)
