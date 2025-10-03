/**
 * ========================================
 * MARICO INSIGHTS - FRONTEND ENTRY POINT
 * ========================================
 * 
 * Purpose: Main entry point for the React application
 * 
 * Description:
 * This file serves as the root entry point for the Marico Insights frontend.
 * It renders the main App component into the DOM using React 18's createRoot API.
 * 
 * Key Functionality:
 * - React application initialization
 * - DOM mounting point configuration
 * - Global CSS imports
 * 
 * Dependencies:
 * - React 18 createRoot API
 * - Main App component
 * - Global index.css styles
 * 
 * Used by:
 * - Vite build system as application entry point
 * - Production builds for application bootstrap
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import development console utilities (only active in development mode)
import './utils/devConsole.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
