import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import UserManagement from './admin/UserManagement'
import WorkflowBuilder from './admin/WorkflowBuilder'
import RequestForm from './request/RequestForm'
import RequestList from './request/RequestList'
import PendingApprovals from './request/PendingApprovals'
import api from '../api'

const Admin = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [showRequestForm, setShowRequestForm] = useState(false)
  
  const userManagementRef = useRef()
  const workflowBuilderRef = useRef()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      navigate('/') // Redirect to login if not authenticated
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (!user) return null

  // Common Menu Items for ALL users
  const menuItems = [
    { label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },
    { label: 'Pending Approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }, // Added Pending Tab
    { label: 'Kanban Board', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
    { label: 'My Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ]

  // Common Stats for ALL users (can make dynamic later)
  const statsItems = [
    { label: 'Active Requests', value: '12', color: 'border-blue-500' },
    { label: 'Pending Actions', value: '04', color: 'border-yellow-500' },
    { label: 'SLA Breaches', value: '01', color: 'border-red-500' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-9.15"/></svg>
          </div>
          <span className="text-xl font-bold text-blue-900 italic">SmartFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {/* Common Items */}
          {menuItems.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveTab(item.label)} 
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === item.label ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {/* Admin Only Items */}
          {(user.role === 'admin' || (user.roles && user.roles.some(r => r.name === 'Admin'))) && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
                ADMIN TOOLS
              </div>
              <button 
                onClick={() => setActiveTab('Workflow Builder')} 
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'Workflow Builder' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-medium">Workflow Builder</span>
              </button>
              <button 
                onClick={() => setActiveTab('User Management')} 
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'User Management' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                <span className="font-medium">User Management</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center px-4 py-3 text-red-500 hover:bg-red-50 w-full rounded-lg transition-colors">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'Dashboard' ? 'System Overview' : activeTab}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, {user.name}</p>
          </div>
          
          {/* Action Buttons based on Active Tab */}
          {(activeTab === 'Dashboard' || activeTab === 'My Requests') && (
            <button 
              onClick={() => setShowRequestForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Request
            </button>
          )}

          {activeTab === 'User Management' && (
             <button 
             onClick={() => userManagementRef.current.openAddModal()}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center"
           >
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             Add User
           </button>
          )}

          {activeTab === 'Workflow Builder' && (
             <button 
             onClick={() => workflowBuilderRef.current.openCreateModal()}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center"
           >
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             Create Workflow
           </button>
          )}
        </header>

        {activeTab === 'Dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {statsItems.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start">
                   <div className={`h-12 w-1.5 rounded-full mr-4 ${stat.color.replace('border-', 'bg-')}`}></div>
                   <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                   </div>
                </div>
              ))}
            </div>

            {/* Quick Pending Approvals (Mini View) for Dashboard */}
             <PendingApprovals />
          </>
        )}

        {/* Tab Components */}
        {activeTab === 'My Requests' && <RequestList />}
        {activeTab === 'Pending Approvals' && <PendingApprovals />}
        {activeTab === 'User Management' && <UserManagement ref={userManagementRef} />}
        {activeTab === 'Workflow Builder' && <WorkflowBuilder ref={workflowBuilderRef} />}
        
        {/* Modals */}
        {showRequestForm && (
            <RequestForm 
                onClose={() => setShowRequestForm(false)} 
                onSuccess={() => setActiveTab('My Requests')} // Switch to list on success
            />
        )}

      </main>
    </div>
  )
}

export default Admin