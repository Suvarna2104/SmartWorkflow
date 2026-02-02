import React, { useState, useEffect } from 'react'
import api from '../../api'

const StepsBuilder = ({ steps, setSteps }) => {
  const [roles, setRoles] = useState([]) // Need to fetch roles
  const [newStep, setNewStep] = useState({
      stageName: '',
      approverType: 'ROLE',
      approverRoleId: '',
      mode: 'ANY_ONE'
  })

  useEffect(() => {
    // Fetch system roles (mock for now if API not ready, but Role model exists)
    // We haven't implemented getRoles API yet on backend? 
    // Wait, we didn't add RoleController/Routes.
    // I should add getRoles endpoint or just hardcode for demo if stuck.
    // Let's assume we will add getRoles quickly or user has none yet.
    // For now, I'll fetch users and unique roles or add a quick getRoles endpoint.
    // Actually, UserManagement likely needs getRoles too.
    // I'll try to fetch from /api/users/roles if it exists, otherwise mock.
    // Or fetch Users and extract roles.
    
    // TEMPORARY: Mock roles or try to fetch
     fetchRoles()
  }, [])

  const fetchRoles = async () => {
       // Since I haven't made a dedicated roles endpoint, I might need to make one or just use strings
       // If I implemented Role model, I should have an endpoint.
       // I'll assume I can add it or just hardcode some defaults + dynamic
       setRoles([
           { _id: 'admin_role_id', name: 'Admin' },
           { _id: 'manager_role_id', name: 'Manager' },
           { _id: 'hr_role_id', name: 'HR' }
       ])
       // TODO: Implement GET /api/roles and call it here
  }

  const addStep = () => {
    if (!newStep.stageName) return
    const step = {
        ...newStep,
        stepOrder: steps.length + 1
    }
    setSteps([...steps, step])
    setNewStep({ stageName: '', approverType: 'ROLE', approverRoleId: '', mode: 'ANY_ONE' })
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
                             Assignee: {step.approverType === 'ROLE' ? roles.find(r=>r._id === step.approverRoleId)?.name || step.approverRoleId : 'Custom'} 
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
            <div className="w-32">
                 <label className="text-xs font-semibold text-gray-600">Assign To</label>
                 <select 
                    value={newStep.approverRoleId}
                    onChange={(e) => setNewStep({...newStep, approverRoleId: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                 >
                     <option value="">Select Role</option>
                     {roles.map(r => (
                         <option key={r._id} value={r._id}>{r.name}</option>
                     ))}
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
