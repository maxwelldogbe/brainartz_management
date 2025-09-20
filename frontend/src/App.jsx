import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

// Components
import Customer from './pages/Customer'
import Works from './pages/Works'
import Payments from './pages/Payments'
import Summary from './pages/Summary'
import AdminDashboard from './pages/AdminDashboard'
import Invite from './pages/Invite'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
function App() {

  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route path='/register/:token' element={<Register />} />
      <Route path='/' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path='customers' element={<Customer />} />
        <Route path='works' element={<Works />} />
        <Route path='payments' element={<Payments />} />
        <Route path='summary' element={<Summary />} />
  <Route path='admin-dashboard' element={<AdminDashboard />} />
  <Route path='workers' element={<Workers />} />
  <Route path='invite' element={<Invite />} />
      </Route>

    </Routes>
  )
}

export default App
