// Polyfill for global (required by simple-peer and other Node.js packages)
if (typeof global === 'undefined') {
  var global = globalThis
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)




