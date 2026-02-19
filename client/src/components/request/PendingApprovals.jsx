import React, { useState, useEffect } from 'react'
import api from '../../api'

const PendingApprovals = () => {
    const [tasks, setTasks] = useState([])
    const [view, setView] = useState('pending') // 'pending' or 'history'
    const [filter, setFilter] = useState('ALL') // 'ALL', 'APPROVE', 'REJECT', 'RETURN'
    const [history, setHistory] = useState([])

    useEffect(() => {
        if (view === 'pending') {
            fetchTasks()
        } else {
            fetchHistory()
        }
    }, [view, filter])

    const fetchTasks = async () => {
        try {
            const res = await api.get('/api/workflow/tasks/my')
            setTasks(res.data.data || []) 
        } catch (error) {
            console.error("Error fetching tasks", error)
        }
    }

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/api/workflow/tasks/history?filter=${filter}`)
            setHistory(res.data.data || [])
        } catch (error) {
            console.error("Error fetching history", error)
        }
    }

    const handleAction = async (requestId, action) => {
        const comment = prompt(`Enter comment for ${action}:`)
        if (comment === null) return

        try {
            await api.post(`/api/workflow/requests/${requestId}/action`, { action, comment })
            alert('Action processed successfully')
            fetchTasks()
        } catch (error) {
            console.error("Error processing action", error)
            alert('Failed to process action')
        }
    }

    const displayedTasks = view === 'pending' ? tasks : history

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex space-x-4 items-center">
                    <h2 className="text-lg font-bold text-gray-800">
                        {view === 'pending' ? 'Pending Approvals' : 'Approval History'}
                    </h2>
                    
                    {/* View Toggle */}
                     <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button 
                            onClick={() => setView('pending')}
                            className={`px-3 py-1.5 rounded-md transition-all ${view === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pending
                        </button>
                        <button 
                            onClick={() => setView('history')}
                            className={`px-3 py-1.5 rounded-md transition-all ${view === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {/* Filter for History */}
                {view === 'history' && (
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        <option value="ALL">All Actions</option>
                        <option value="APPROVE">Approved</option>
                        <option value="REJECT">Rejected</option>
                        <option value="RETURN">Returned</option>
                    </select>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Workflow</th>
                            <th className="px-6 py-4 font-semibold">Initiator</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Stage</th>
                            {view === 'pending' ? (
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            ) : (
                                <th className="px-6 py-4 font-semibold">My Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedTasks.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No {view} tasks found.</td></tr>
                        ) : (
                            displayedTasks.map(task => (
                                <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.workflowId?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{task.initiatorUserId?.name || task.initiatorUserId?.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(task.createdAt || task.updatedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{task.kanbanStageKey || task.status}</td>
                                    
                                    {view === 'pending' ? (
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => handleAction(task._id, 'APPROVE')}
                                                className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline bg-green-50 px-3 py-1 rounded"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleAction(task._id, 'REJECT')}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline bg-red-50 px-3 py-1 rounded"
                                            >
                                                Reject
                                            </button>
                                             <button 
                                                onClick={() => handleAction(task._id, 'RETURN')}
                                                className="text-orange-600 hover:text-orange-800 text-sm font-medium hover:underline bg-orange-50 px-3 py-1 rounded"
                                            >
                                                Return
                                            </button>
                                        </td>
                                    ) : (
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                task.myLastAction === 'APPROVE' ? 'bg-green-100 text-green-700' :
                                                task.myLastAction === 'REJECT' ? 'bg-red-100 text-red-700' :
                                                task.myLastAction === 'RETURN' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {task.myLastAction || task.status}
                                            </span>
                                            {task.myLastActionDate && (
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {new Date(task.myLastActionDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PendingApprovals
