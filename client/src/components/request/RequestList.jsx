import React, { useState, useEffect } from 'react'
import api from '../../api'

import RequestDetails from './RequestDetails'

const RequestList = ({ mode = 'my' }) => {
    const [requests, setRequests] = useState([])
    const [selectedRequest, setSelectedRequest] = useState(null)

    useEffect(() => {
        fetchRequests()
    }, [mode])

    const fetchRequests = async () => {
        try {
            const url = mode === 'all' ? '/api/workflow/requests/all' : '/api/workflow/requests/my'
            const res = await api.get(url)
            // Handle both structure formats (array direct or { success: true, data: [] })
            if (res.data.success && Array.isArray(res.data.data)) {
                 setRequests(res.data.data)
            } else if (Array.isArray(res.data)) {
                 setRequests(res.data)
            } else {
                 setRequests([])
            }
        } catch (error) {
            console.error(`Error fetching requests for mode ${mode}`, error)
            setRequests([])
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">
                    {mode === 'all' ? 'All Requests' : 'My Requests'}
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Workflow</th>
                            {mode === 'all' && <th className="px-6 py-4 font-semibold">Initiator</th>}
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Current Step</th>
                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No requests found.</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.workflowId?.name || 'Unknown'}</td>
                                    {mode === 'all' && (
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {req.initiatorUserId?.name || req.initiatorUserId?.email || 'Unknown'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(req.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                              req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                                              req.status === 'RETURNED' ? 'bg-orange-100 text-orange-800' : 
                                              'bg-blue-100 text-blue-800'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{req.kanbanStageKey || 'Initial'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedRequest(req._id)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedRequest && (
                <RequestDetails 
                    requestId={selectedRequest} 
                    onClose={() => setSelectedRequest(null)} 
                />
            )}
        </div>
    )
}

export default RequestList
