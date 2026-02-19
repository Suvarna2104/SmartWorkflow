import React, { useState, useEffect } from 'react'
import api from '../../api'

const RequestDetails = ({ requestId, onClose }) => {
    const [request, setRequest] = useState(null)
    const [user, setUser] = useState(null)

    const [allUsers, setAllUsers] = useState([])
    const [selectedAssignee, setSelectedAssignee] = useState('')

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const u = JSON.parse(storedUser)
            setUser(u)
            // Fetch users if admin
            if (u.role === 'admin' || u.role === 'Admin' || u.roles?.some(r => ['Admin', 'admin'].includes(r.name))) {
                fetchUsers()
            }
        }
        fetchRequest()
    }, [requestId])

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users')
            setAllUsers(res.data.users || [])
        } catch (error) {
            console.error("Error fetching users", error)
        }
    }

    const fetchRequest = async () => {
        try {
            const res = await api.get(`/api/workflow/requests/${requestId}`)
            setRequest(res.data.data)
        } catch (error) {
            console.error("Error fetching request details", error)
        }
    }

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this request?')) return;

        try {
            await api.post(`/api/workflow/requests/${requestId}/action`, { 
                action: 'APPROVE', 
                comment: 'Approved via Request Details UI' 
            })
            // Refresh details
            fetchRequest()
        } catch (error) {
            console.error("Error approving request", error)
            alert('Failed to approve request')
        }
    }

    const handleRetryAssignment = async () => {
        try {
            await api.post(`/api/workflow/admin/requests/${requestId}/assign`, { reRun: true })
            fetchRequest()
            alert('Auto-assignment retried successfully')
        } catch (error) {
            alert(error.response?.data?.msg || 'Retry failed')
        }
    }

    const handleForceAssign = async () => {
        if (!selectedAssignee) return alert('Select a user')
        try {
            await api.post(`/api/workflow/admin/requests/${requestId}/assign`, { assignToUserId: selectedAssignee })
            fetchRequest()
            alert('User assigned successfully')
        } catch (error) {
            alert(error.response?.data?.msg || 'Assignment failed')
        }
    }

    if (!request) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white p-6 rounded-xl text-center">Loading...</div>
        </div>
    )

    // Check if current user can approve
    const isAssignee = user && request.currentAssignees?.includes(user._id)
    const isAdmin = user && (['admin', 'Admin'].includes(user.role) || user.roles?.some(r => ['Admin', 'admin'].includes(r.name)))
    const canApprove = (isAssignee || isAdmin) && request.status === 'IN_PROGRESS'

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        Request Details: {request.workflowId?.name}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Admin Recovery Section for Stuck Requests */}
                    {request.status === 'PENDING_ASSIGNMENT' && isAdmin && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start mb-3">
                                <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <div>
                                    <h4 className="font-bold text-red-700">Workflow Halted: No Assignees Found</h4>
                                    <p className="text-sm text-red-600 mt-1">
                                        The workflow cannot proceed because no valid users were found for the current step. 
                                        As an admin, you can retry auto-assignment (if you added users/roles) or force-assign a specific user.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-4 ml-8">
                                <button 
                                    onClick={handleRetryAssignment}
                                    className="px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm font-medium"
                                >
                                    Retry Auto-Assignment
                                </button>
                                <span className="text-gray-400 text-xs">OR</span>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={selectedAssignee}
                                        onChange={(e) => setSelectedAssignee(e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                                    >
                                        <option value="">Select User to Force Assign</option>
                                        {allUsers.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handleForceAssign}
                                        className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                                    >
                                        Force Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Status</p>
                            <span className={`font-bold ${request.status === 'APPROVED' ? 'text-green-600' : 'text-blue-800'}`}>
                                {request.status === 'IN_PROGRESS' ? 'IN PROGRESS' : request.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Initiated By</p>
                            <span className="font-bold text-gray-800">{request.initiatorUserId?.name || request.initiatorUserId?.email}</span>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500 uppercase">Current Stage</p>
                            <span className="font-bold text-gray-800">{request.kanbanStageKey || 'N/A'}</span>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500 uppercase">Submitted On</p>
                            <span className="font-bold text-gray-800">{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Form Data */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Form Data</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {request.formData && Object.entries(request.formData).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</p>
                                    <p className="text-sm font-medium">{value && typeof value === 'object' ? JSON.stringify(value) : value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Audit Trail
                        </h4>
                        <div className="border-l-2 border-gray-200 ml-3 space-y-6">
                            {request.history?.map((entry, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white 
                                        ${entry.action === 'APPROVE' ? 'bg-green-500' : 
                                          entry.action === 'REJECT' ? 'bg-red-500' : 
                                          'bg-blue-500'}`}></div>
                                    <div className="text-sm">
                                        <p className="font-bold text-gray-800">
                                            {entry.action} 
                                            <span className="font-normal text-gray-500 ml-2">by {entry.byUserId?.name || 'System'}</span>
                                        </p>
                                        <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                                        {entry.comment && (
                                            <div className="mt-1 text-gray-600 bg-gray-50 p-2 rounded text-xs italic">
                                                "{entry.comment}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
                    {canApprove && (
                        <button
                            onClick={handleApprove}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Approve Request
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RequestDetails
