import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import TimelinePage from './components/TimelinePage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TimelinePage />
  </StrictMode>,
);
