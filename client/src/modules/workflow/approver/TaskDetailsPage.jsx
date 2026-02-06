import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useParams, useNavigate } from 'react-router-dom'

const TaskDetailsPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(null)
    const [comment, setComment] = useState('')

    useEffect(() => {
        api.getRequestDetails(id).then(res => setRequest(res.data.data)).catch(console.error)
    }, [id])

    const handleAction = async (action) => {
        try {
            await api.performAction(id, { action, comment })
            alert(`Action ${action} successful`)
            navigate('/workflow/approver/tasks')
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    if (!request) return <div>Loading...</div>

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#e9ecef', borderRadius: '5px' }}>
                <h2>Approval Required</h2>
                <p><strong>Workflow:</strong> {request.workflowId?.name}</p>
                <p><strong>Initiator:</strong> {request.initiatorUserId?.name}</p>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px' }}>
                <h3>Request Data</h3>
                <table style={{ width: '100%' }}>
                    <tbody>
                        {Object.entries(request.formData || {}).map(([key, val]) => (
                            <tr key={key}>
                                <td style={{ fontWeight: 'bold', width: '30%' }}>{key}:</td>
                                <td>{val}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ background: '#f8f9fa', padding: '20px', borderTop: '2px solid #007bff' }}>
                <h3>Your Decision</h3>
                <textarea 
                    placeholder="Comments (Required for Reject/Return)" 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '8px' }}
                />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => handleAction('APPROVE')}
                        style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                    >
                        Approve
                    </button>
                    <button 
                        onClick={() => handleAction('RETURN')}
                        style={{ background: '#ffc107', color: 'black', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                    >
                        Return
                    </button>
                    <button 
                        onClick={() => handleAction('REJECT')}
                        style={{ background: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                    >
                        Reject
                    </button>
                </div>
            </div>
            
            <div style={{ marginTop: '30px' }}>
                <h4>Audit History</h4>
                {request.history?.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
                        {new Date(h.createdAt).toLocaleString()} - <strong>{h.action}</strong> by {h.byUserId?.name || 'System'}: {h.comment}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TaskDetailsPage
