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
import JobCategories from './pages/JobCategories'
import WorkAnalytics from './pages/WorkAnalytics'
import SalesReports from './pages/SalesReports'
import SalesReportForm from './pages/SalesReportForm'
import SalesReportView from './pages/SalesReportView'
import Inventory from './pages/Inventory'
import Materials from './pages/Materials'
import Procurements from './pages/Procurements'
import ProcurementRequests from './pages/ProcurementRequests'
import StockMovements from './pages/StockMovements'
import InventoryReports from './pages/InventoryReports'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { RoleGuard } from './components/RoleGuard'

import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path='/login' element={<Login />} />
      <Route path='/register/:token' element={<Register />} />
      <Route path='/register' element={<Register />} />
      
      {/* Protected Routes */}
      <Route path='/' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Default Dashboard Route */}
        <Route index element={<Dashboard />} />
        <Route path='dashboard' element={<Dashboard />} />
        
        {/* Admin-Only Routes */}
        <Route path='admin-dashboard' element={
          <RoleGuard requireAdmin={true}>
            <AdminDashboard />
          </RoleGuard>
        } />
        <Route path='workers' element={
          <RoleGuard requireAdmin={true}>
            <Workers />
          </RoleGuard>
        } />
        <Route path='invite' element={
          <RoleGuard requireAdmin={true}>
            <Invite />
          </RoleGuard>
        } />
        <Route path='job-categories' element={
          <RoleGuard requireAdmin={true}>
            <JobCategories />
          </RoleGuard>
        } />
        
        {/* Worker+ Routes (Workers and Admins) */}
        <Route path='customers' element={
          <RoleGuard requireWorker={true}>
            <Customer />
          </RoleGuard>
        } />
        <Route path='works' element={
          <RoleGuard requireWorker={true}>
            <Works />
          </RoleGuard>
        } />
        <Route path='payments' element={
          <RoleGuard requireWorker={true}>
            <Payments />
          </RoleGuard>
        } />
        <Route path='summary' element={
          <RoleGuard requireWorker={true}>
            <Summary />
          </RoleGuard>
        } />
        <Route path='work-analytics' element={
          <RoleGuard requireWorker={true}>
            <WorkAnalytics />
          </RoleGuard>
        } />
        
        {/* Inventory Management Routes */}
        <Route path='inventory' element={
          <RoleGuard requireWorker={true}>
            <Inventory />
          </RoleGuard>
        } />
        <Route path='inventory/materials' element={
          <RoleGuard requireWorker={true}>
            <Materials />
          </RoleGuard>
        } />
        <Route path='inventory/procurements' element={
          <RoleGuard requireWorker={true}>
            <Procurements />
          </RoleGuard>
        } />
        <Route path='inventory/procurement-requests' element={
          <RoleGuard requireWorker={true}>
            <ProcurementRequests />
          </RoleGuard>
        } />
        <Route path='inventory/stock-movements' element={
          <RoleGuard requireWorker={true}>
            <StockMovements />
          </RoleGuard>
        } />
        <Route path='inventory/reports' element={
          <RoleGuard requireWorker={true}>
            <InventoryReports />
          </RoleGuard>
        } />
        
        {/* Sales Reports - Available to all employees */}
        <Route path='sales-reports' element={
          <RoleGuard requireWorker={true}>
            <SalesReports />
          </RoleGuard>
        } />
        <Route path='sales-reports/new' element={
          <RoleGuard requireWorker={true}>
            <SalesReportForm />
          </RoleGuard>
        } />
        <Route path='sales-reports/:id' element={
          <RoleGuard requireWorker={true}>
            <SalesReportView />
          </RoleGuard>
        } />
        <Route path='sales-reports/:id/edit' element={
          <RoleGuard requireWorker={true}>
            <SalesReportForm />
          </RoleGuard>
        } />
      </Route>
    </Routes>
  )
}

export default App
