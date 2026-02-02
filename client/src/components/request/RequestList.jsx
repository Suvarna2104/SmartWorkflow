import React, { useState, useEffect } from 'react'
import api from '../../api'

import RequestDetails from './RequestDetails'

const RequestList = () => {
    const [requests, setRequests] = useState([])
    const [selectedRequest, setSelectedRequest] = useState(null)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await api.get('/api/requests/my')
            setRequests(res.data)
        } catch (error) {
            console.error("Error fetching my requests", error)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">My Requests</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Workflow</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Current Step</th>
                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No requests found.</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.workflowId?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(req.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                              req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                              req.status === 'Returned' ? 'bg-orange-100 text-orange-800' : 
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
