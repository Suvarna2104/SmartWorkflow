import React, { useState, useEffect } from 'react'
import api from '../../api'

const PendingApprovals = () => {
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const res = await api.get('/api/requests/pending')
            setTasks(res.data)
        } catch (error) {
            console.error("Error fetching tasks", error)
        }
    }

    const handleAction = async (requestId, action) => {
        const comment = prompt(`Enter comment for ${action}:`)
        if (comment === null) return

        try {
            await api.post(`/api/requests/${requestId}/action`, { action, comment })
            alert('Action processed successfully')
            fetchTasks()
        } catch (error) {
            console.error("Error processing action", error)
            alert('Failed to process action')
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Pending Approvals</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Workflow</th>
                            <th className="px-6 py-4 font-semibold">Initiator</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Stage</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No pending tasks.</td></tr>
                        ) : (
                            tasks.map(task => (
                                <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.workflowId?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{task.initiatorUserId?.name || task.initiatorUserId?.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(task.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{task.kanbanStageKey}</td>
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
