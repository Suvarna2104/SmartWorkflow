import React, { useState, useEffect } from 'react'
import api from '../../api'

const StepsBuilder = ({ steps, setSteps }) => {
  const [roles, setRoles] = useState([]) 
  const [users, setUsers] = useState([])
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('') // Stores the Role ID selected in "Assign Type"
  const [selectedAssignee, setSelectedAssignee] = useState('') // Stores User ID or 'ALL_ROLE'
  
  const [newStep, setNewStep] = useState({
      stageName: '',
      approverType: 'ROLE',
      approverRoleId: '',
      userIds: [], 
      mode: 'ANY_ONE'
  })

  useEffect(() => {
     fetchRoles()
     fetchUsers()
  }, [])

  const fetchRoles = async () => {
    try {
        const res = await api.get('/api/workflow/admin/user-roles') // Use the new endpoint
        if (res.data && Array.isArray(res.data.data)) {
            setRoles(res.data.data)
        } else if (Array.isArray(res.data)) {
             setRoles(res.data)
        }
    } catch (error) {
        console.error("Error fetching roles", error)
        setRoles([])
    }
  }

  const fetchUsers = async () => {
    try {
        const res = await api.get('/api/users')
        if (res.data && Array.isArray(res.data.users)) {
             setUsers(res.data.users)
        }
    } catch (error) {
        console.error("Error fetching users", error)
        setUsers([])
    }
  }

  // Filter users based on selected role
  const getFilteredUsers = () => {
      if (!selectedRoleFilter) return []
      return users.filter(u => {
          // Check legacy 'role' string
          if (u.role && roles.find(r => r._id === selectedRoleFilter)?.name === u.role) return true;
          // Check 'roles' array
          if (u.roles && u.roles.some(r => (typeof r === 'string' ? r : r._id) === selectedRoleFilter)) return true;
          return false;
      })
  }

  const handleAssigneeChange = (val) => {
      setSelectedAssignee(val)
      
      if (val === 'ALL_ROLE') {
          // Assign to the Role itself
          setNewStep({
              ...newStep, 
              approverType: 'ROLE',
              approverRoleId: selectedRoleFilter,
              userIds: []
          })
      } else {
          // Assign to a specific User
          setNewStep({
              ...newStep,
              approverType: 'USER',
              approverRoleId: '', // Clear role ID if user is selected? Or keep it for reference? System expects cleared for USER type.
              userIds: [val]
          })
      }
  }

  const addStep = () => {
    if (!newStep.stageName) return alert('Please enter a stage name')
    if (!selectedRoleFilter) return alert('Please select an Assign Type (Role)')
    if (!selectedAssignee) return alert('Please select who to assign to')

    const stepPayload = {
         ...newStep,
        stepOrder: steps.length + 1
    }
    
    // Final check to ensure payload is correct based on selection
    if (selectedAssignee === 'ALL_ROLE') {
         stepPayload.approverType = 'ROLE'
         stepPayload.roleIds = [selectedRoleFilter]
         stepPayload.userIds = []
    } else {
         stepPayload.approverType = 'USER'
         stepPayload.userIds = [selectedAssignee]
         stepPayload.roleIds = [] // specific user, no role broadcast
    }

    setSteps([...steps, stepPayload])
    
    // Reset form
    setNewStep({ stageName: '', approverType: 'ROLE', approverRoleId: '', userIds: [], mode: 'ANY_ONE' })
    setSelectedRoleFilter('')
    setSelectedAssignee('')
  }

  const removeStep = (index) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({...s, stepOrder: i + 1}))
    setSteps(updated)
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 mt-4">
        <h4 className="font-bold text-gray-700 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            Approval Pipeline
        </h4>

        {/* Steps List */}
        <div className="space-y-3 mb-4">
             {steps.length === 0 && <p className="text-sm text-gray-400 italic">No approval steps defined.</p>}
             {steps.map((step, idx) => (
                 <div key={idx} className="flex items-center bg-gray-50 p-3 rounded border border-gray-100 relative">
                     <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                         {idx + 1}
                     </div>
                     <div className="flex-1">
                         <h5 className="text-sm font-bold text-gray-800">{step.stageName}</h5>
                         <p className="text-xs text-gray-500">
                             Assignee: <span className="font-semibold text-gray-700">
                                {
                                   step.approverType === 'ROLE' ? (
                                       (() => {
                                           const rId = step.approverRoleId || (step.roleIds && step.roleIds[0])
                                           return roles.find(r=>r._id === rId)?.name || 'Unknown Role'
                                       })()
                                   ) : (
                                       (() => {
                                           const uId = step.userIds && step.userIds[0]
                                           return users.find(u=>u._id === uId)?.name || 'Unknown User'
                                       })()
                                   )
                                } 
                             </span>
                             <span className="mx-1">•</span>
                             Type: {step.approverType}
                             <span className="mx-1">•</span>
                             Mode: {step.mode}
                         </p>
                     </div>
                     <button type="button" onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </button>
                     {idx < steps.length - 1 && (
                         <div className="absolute left-3 top-10 w-0.5 h-4 bg-gray-300"></div>
                     )}
                 </div>
             ))}
        </div>

        {/* Add Step Form */}
        <div className="bg-blue-50 p-3 rounded-lg flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-gray-600">Stage Name</label>
                <input 
                    type="text" 
                    value={newStep.stageName}
                    onChange={(e) => setNewStep({...newStep, stageName: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm" 
                    placeholder="e.g. Manager Approval"
                />
            </div>

            {/* Assign Type Dropdown (Role Filter) */}
            <div className="w-32">
                 <label className="text-xs font-semibold text-gray-600">Assign Type</label>
                 <select 
                    value={selectedRoleFilter}
                    onChange={(e) => {
                        setSelectedRoleFilter(e.target.value)
                        setSelectedAssignee('') // Reset 2nd dropdown
                    }}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                 >
                     <option value="">Select Role</option>
                     {roles.map(r => (
                         <option key={r._id} value={r._id}>{r.name}</option>
                     ))}
                 </select>
            </div>

            {/* Assign To Dropdown (Filtered Users) */}
            <div className="w-40">
                 <label className="text-xs font-semibold text-gray-600">Assign To</label>
                 <select 
                    value={selectedAssignee}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                    disabled={!selectedRoleFilter}
                 >
                     <option value="">Select User</option>
                     {selectedRoleFilter && (
                         <>
                             <option value="ALL_ROLE" className="font-bold">
                                 All {roles.find(r => r._id === selectedRoleFilter)?.name || 'Users'}
                             </option>
                             {getFilteredUsers().map(u => (
                                 <option key={u._id} value={u._id}>{u.name}</option>
                             ))}
                         </>
                     )}
                 </select>
            </div>

             <div className="w-28">
                 <label className="text-xs font-semibold text-gray-600">Mode</label>
                 <select 
                    value={newStep.mode}
                    onChange={(e) => setNewStep({...newStep, mode: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                 >
                     <option value="ANY_ONE">Any One</option>
                     <option value="ALL_REQUIRED">All Required</option>
                 </select>
            </div>
            <button 
                type="button" 
                onClick={addStep}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
                Add Step
            </button>
        </div>
    </div>
  )
}

export default StepsBuilder
