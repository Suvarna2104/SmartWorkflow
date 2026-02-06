import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useParams } from 'react-router-dom'

const RequestDetailsPage = () => {
    const { id } = useParams()
    const [request, setRequest] = useState(null)

    useEffect(() => {
        api.getRequestDetails(id).then(res => setRequest(res.data.data)).catch(console.error)
    }, [id])

    if (!request) return <div>Loading...</div>

    return (
        <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
                <h2>Request Details</h2>
                <div style={{ marginBottom: '20px', padding: '10px', background: '#f9f9f9' }}>
                    <h3>Form Data</h3>
                    <pre>{JSON.stringify(request.formData, null, 2)}</pre>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <h3>Status: <span style={{ color: request.status === 'APPROVED' ? 'green' : 'orange' }}>{request.status}</span></h3>
                    {request.status === 'IN_PROGRESS' && (
                        <p>Currently Assigned To: {request.currentAssignees?.map(u => u.name).join(', ') || 'System'}</p>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
                <h3>Audit Trail</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {request.history?.map((action, idx) => (
                        <li key={idx} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <strong>{action.action}</strong> by {action.byUserId?.name || 'System'}
                            <br />
                            <small>{new Date(action.createdAt).toLocaleString()}</small>
                            {action.comment && <p style={{ fontStyle: 'italic', margin: '5px 0' }}>"{action.comment}"</p>}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default RequestDetailsPage
