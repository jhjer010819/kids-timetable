import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Editor from './Editor.tsx'
import Landing from './Landing.tsx'
import Preview from './Preview.tsx'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Editor />} />
        <Route path="/preview" element={<Preview />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
