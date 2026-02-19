import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import UserManagement from './admin/UserManagement'
import WorkflowBuilder from './admin/WorkflowBuilder'
import RequestForm from './request/RequestForm'
import RequestList from './request/RequestList'
import PendingApprovals from './request/PendingApprovals'
import KanbanBoard from './kanban/KanbanBoard'
import api from '../api'

const Admin = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [dashboardWorkflows, setDashboardWorkflows] = useState([])
  const [initialWorkflowId, setInitialWorkflowId] = useState(null)
  
  const [profileImage, setProfileImage] = useState(null)
  const fileInputRef = useRef(null)
  
  const userManagementRef = useRef()
  const workflowBuilderRef = useRef()

  // IndexedDB Helper
  const dbName = "SmartWorkflowDB"
  const storeName = "userProfileImages"

  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }
      request.onsuccess = (event) => resolve(event.target.result)
      request.onerror = (event) => reject(event.target.error)
    })
  }

  const saveToDB = async (userId, imageString) => {
    try {
      const db = await initDB()
      const tx = db.transaction(storeName, "readwrite")
      const store = tx.objectStore(storeName)
      store.put(imageString, userId)
      return tx.complete
    } catch (err) {
      console.error("IndexedDB Save Error:", err)
    }
  }

  const getFromDB = async (userId) => {
    try {
      const db = await initDB()
      const tx = db.transaction(storeName, "readonly")
      const store = tx.objectStore(storeName)
      return new Promise((resolve) => {
        const req = store.get(userId)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
      })
    } catch (err) {
      console.error("IndexedDB Read Error:", err)
      return null
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      // Load stored image from IndexedDB
      getFromDB(parsedUser._id).then(savedImage => {
          if (savedImage) setProfileImage(savedImage)
      })
    } else {
      navigate('/')
    }
  }, [navigate])

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
        // limit to 6MB
        if (file.size > 6 * 1024 * 1024) {
            alert("File size too large. Please upload an image smaller than 6MB.")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result
            setProfileImage(base64String)
            if (user && user._id) {
                saveToDB(user._id, base64String).catch(e => {
                     console.error("Failed to save to DB", e)
                     alert("Failed to confirm save. Storage might be full.")
                })
            }
        }
        reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (activeTab === 'Dashboard') {
        const fetchActiveWorkflows = async () => {
            try {
                const res = await api.get('/api/workflow/workflows/active')
                setDashboardWorkflows(res.data.data || [])
            } catch (error) {
                console.error("Error fetching dashboard workflows", error)
            }
        }
        fetchActiveWorkflows()
    }
  }, [activeTab])

  const handleStartRequest = (workflowId = null) => {
      setInitialWorkflowId(workflowId)
      setShowRequestForm(true)
  }

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

  // Add "All Requests" for Admin
  if (user && (user.role === 'Admin' || (user.roles && user.roles.some(r => r.name === 'Admin')))) {
      menuItems.push({ label: 'All Requests', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' })
  }

  // Common Stats for ALL users (can make dynamic later)
  const statsItems = [
    { label: 'Active Requests', value: '12', color: 'border-blue-500' },
    { label: 'Pending Actions', value: '04', color: 'border-yellow-500' },
    { label: 'SLA Breaches', value: '01', color: 'border-red-500' },
  ]

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans text-slate-800">
      {/* Sidebar - Dark Theme */}
      <aside className="w-72 bg-[#1E293B] text-slate-300 flex flex-col fixed h-full z-20 shadow-2xl transition-all duration-300">
        <div className="h-24 flex items-center px-8 border-b border-slate-700/50">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 mr-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">SmartFlow</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => setActiveTab(item.label)}
                    className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-200 group ${
                        activeTab === item.label 
                        ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <svg className={`w-5 h-5 mr-3.5 transition-colors ${activeTab === item.label ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                    <span className="font-medium tracking-wide text-[15px]">{item.label}</span>
                </button>
            ))}

          {/* Admin Tools Section */}
          {(user.role === 'Admin' || (user.roles && user.roles.some(r => r.name === 'Admin'))) && (
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <span className="px-5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Admin Tools</span>
              <button 
                onClick={() => setActiveTab('Workflow Builder')} 
                className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-200 group ${activeTab === 'Workflow Builder' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <svg className={`w-5 h-5 mr-3.5 transition-colors ${activeTab === 'Workflow Builder' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-medium tracking-wide text-[15px]">Workflow Builder</span>
              </button>
              <button 
                onClick={() => setActiveTab('User Management')} 
                className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-200 group ${activeTab === 'User Management' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
              >
               <svg className={`w-5 h-5 mr-3.5 transition-colors ${activeTab === 'User Management' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                <span className="font-medium tracking-wide text-[15px]">User Management</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-6 border-t border-slate-700/50">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
            />

            <div className="flex items-center p-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 mb-4 select-none">
                <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg cursor-pointer hover:opacity-90 relative overflow-hidden group"
                    title="Click to change profile picture"
                >
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        user.name.charAt(0)
                    )}
                     <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate font-medium">{user.email}</p>
                </div>
            </div>

          <button onClick={handleLogout} className="flex items-center justify-center px-4 py-3.5 bg-[#2D242C] hover:bg-[#3E2C34] text-rose-400 border border-rose-500/10 w-full rounded-xl transition-all group shadow-inner">
            <svg className="w-5 h-5 mr-2 group-hover:text-rose-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="text-sm font-semibold tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 p-10 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {activeTab === 'Dashboard' ? 'System Overview' : activeTab}
            </h1>
            <p className="text-slate-500 font-medium">Manage workflow operations seamlessly.</p>
          </div>
          
           {/* Header Button Group */}
            <div className="flex space-x-3">
                {(activeTab === 'Dashboard' || activeTab === 'My Requests') && (
                    <button 
                    onClick={() => handleStartRequest(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-xl shadow-blue-500/20 transition-all hover:translate-y-[-2px] flex items-center"
                    >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Create Request
                    </button>
                )}
                 {activeTab === 'User Management' && (
                    <button 
                    onClick={() => userManagementRef.current.openAddModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-xl shadow-blue-500/20 transition-all hover:translate-y-[-2px] flex items-center"
                    >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add User
                    </button>
                 )}
                 {activeTab === 'Workflow Builder' && (
                    <button 
                    onClick={() => workflowBuilderRef.current.openCreateModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-xl shadow-blue-500/20 transition-all hover:translate-y-[-2px] flex items-center"
                    >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Create Workflow
                    </button>
                 )}
            </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Active Requests */}
               <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                   <div className="flex items-center space-x-5">
                       <div className="h-14 w-1.5 bg-blue-500 rounded-full"></div>
                       <div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Requests</p>
                           <h3 className="text-4xl font-bold text-slate-800">12</h3>
                       </div>
                   </div>
                   <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                   </div>
               </div>
               
               {/* Pending Actions */}
               <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between group hover:border-amber-200 transition-colors">
                   <div className="flex items-center space-x-5">
                       <div className="h-14 w-1.5 bg-amber-500 rounded-full"></div>
                       <div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Actions</p>
                           <h3 className="text-4xl font-bold text-slate-800">04</h3>
                       </div>
                   </div>
                   <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   </div>
               </div>

                {/* SLA Breaches */}
               <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between group hover:border-red-200 transition-colors">
                   <div className="flex items-center space-x-5">
                       <div className="h-14 w-1.5 bg-red-500 rounded-full"></div>
                       <div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">SLA Breaches</p>
                           <h3 className="text-4xl font-bold text-slate-800">01</h3>
                       </div>
                   </div>
                   <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                     <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                   </div>
               </div>
            </div>



             {/* Available Workflows Grid */}
             <div>
                <h2 className="text-lg font-bold text-slate-800 mb-5">Available Workflows</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {dashboardWorkflows.length > 0 ? (
                        dashboardWorkflows.map(wf => (
                            <div 
                                key={wf._id} 
                                onClick={() => handleStartRequest(wf._id)}
                                className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex items-start"
                            >
                                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{wf.name}</h3>
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Active</span>
                                    </div>
                                    <p className="text-slate-500 line-clamp-2 leading-relaxed">{wf.description || 'Seamless workflow automation.'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center">
                            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                            No active workflows found.
                         </div>
                    )}
                </div>
             </div>
          </div>
        )}

        {/* Other Tabs Rendering */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             {activeTab === 'My Requests' && <div className="p-0"><RequestList mode="my" /></div>}
             {activeTab === 'All Requests' && <div className="p-0"><RequestList mode="all" /></div>}
             {activeTab === 'Pending Approvals' && <div className="p-0"><PendingApprovals /></div>}
             
             {activeTab === 'User Management' && <div className="p-0"><UserManagement ref={userManagementRef} /></div>}
             {activeTab === 'Workflow Builder' && <div className="p-0"><WorkflowBuilder ref={workflowBuilderRef} /></div>}
             {activeTab === 'Kanban Board' && <div className="p-0 h-[calc(100vh-160px)]"><KanbanBoard onCreateRequest={(wfId) => handleStartRequest(wfId)} /></div>}
        </div>


        {/* Modals */}
        {showRequestForm && (
            <RequestForm 
                onClose={() => setShowRequestForm(false)} 
                initialWorkflowId={initialWorkflowId}
                onSuccess={() => setActiveTab('My Requests')} 
            />
        )}

      </main>
    </div>
  )
}

export default Admin