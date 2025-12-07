import React from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import './App.css'

// Redirect component that preserves URL parameters
const RedirectWithParams = ({ to }) => {
  const params = useParams();
  const newPath = Object.keys(params).reduce(
    (path, key) => path.replace(`:${key}`, params[key]),
    to
  );
  return <Navigate to={newPath} replace />;
};

// Components
import Customer from './pages/Customer'
import Works from './pages/Works'
import Payments from './pages/Payments'
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
import PendingStockAdjustments from './pages/PendingStockAdjustments'
import Procurements from './pages/Procurements'
import ProcurementRequests from './pages/ProcurementRequests'
import StockMovements from './pages/StockMovements'
import InventoryReports from './pages/InventoryReports'
import CustomerContacts from './pages/CustomerContacts'
import MarketingMessages from './pages/MarketingMessages'
import Notifications from './pages/Notifications'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { RoleGuard } from './components/RoleGuard'

import Login from './pages/Login'
import Register from './pages/Register'
import ChangePassword from './pages/ChangePassword'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path='/' element={<LandingPage />} />
      
      {/* Staff Portal Routes - Hidden from public */}
      <Route path='/portal/login' element={<Login />} />
      <Route path='/portal/register/:token' element={<Register />} />
      <Route path='/portal/register' element={<Register />} />
      
      {/* Protected Staff Routes */}
      <Route path='/portal' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Default Dashboard Route */}
        <Route index element={<Dashboard />} />
        <Route path='dashboard' element={<Dashboard />} />
        
        {/* Password Change Route - Available to all authenticated users */}
        <Route path='change-password' element={<ChangePassword />} />
        
        {/* Notifications - Available to all authenticated users */}
        <Route path='notifications' element={<Notifications />} />
        
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
        <Route path='customer-contacts' element={
          <RoleGuard requireWorker={true}>
            <CustomerContacts />
          </RoleGuard>
        } />
        <Route path='marketing-messages' element={
          <RoleGuard requireAdmin={true}>
            <MarketingMessages />
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
        <Route path='inventory/pending-adjustments' element={
          <RoleGuard requireWorker={true}>
            <PendingStockAdjustments />
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

      {/* Redirect old sales-reports paths to new portal paths */}
      <Route path='/sales-reports' element={<Navigate to='/portal/sales-reports' replace />} />
      <Route path='/sales-reports/new' element={<Navigate to='/portal/sales-reports/new' replace />} />
      <Route path='/sales-reports/:id/edit' element={<RedirectWithParams to='/portal/sales-reports/:id/edit' />} />
      <Route path='/sales-reports/:id' element={<RedirectWithParams to='/portal/sales-reports/:id' />} />
    </Routes>
  )
}

export default App
