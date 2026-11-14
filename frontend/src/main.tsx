import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initTheme } from './hooks/useTheme'
import { translateNetworkErrors } from './services/apiError'

initTheme()
translateNetworkErrors()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
