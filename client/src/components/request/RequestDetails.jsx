import React, { useState, useEffect } from 'react'
import api from '../../api'

const RequestDetails = ({ requestId, onClose }) => {
    const [request, setRequest] = useState(null)

    useEffect(() => {
        fetchRequest()
    }, [requestId])

    const fetchRequest = async () => {
        try {
            const res = await api.get(`/api/workflow/requests/${requestId}`)
            setRequest(res.data.data)
        } catch (error) {
            console.error("Error fetching request details", error)
        }
    }

    if (!request) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white p-6 rounded-xl text-center">Loading...</div>
        </div>
    )

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
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Status</p>
                            <span className="font-bold text-blue-800">{request.status}</span>
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

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
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
