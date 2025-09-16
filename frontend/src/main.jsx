import React from 'react'
import ReactDOM from 'react-dom/client'
import './App.css';
import App from './App.jsx'   // 👈 importa tu componente principal
//import './App.css'            // 👈 importa estilos globales (opcional)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />   {/* 👈 aquí montamos la App */}
  </React.StrictMode>,
)