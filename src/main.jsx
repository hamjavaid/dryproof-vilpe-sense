import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
// Global styles first, so page styles can override them
import './styles.css'
import App from './App.jsx'
import { DataProvider } from './data.jsx'
import { WorkflowProvider } from './workflow.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <DataProvider>
        <WorkflowProvider>
          <App />
        </WorkflowProvider>
      </DataProvider>
    </HashRouter>
  </React.StrictMode>
)
