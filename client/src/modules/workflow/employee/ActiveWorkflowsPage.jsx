import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

const ActiveWorkflowsPage = () => {
    const [workflows, setWorkflows] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        api.getActiveWorkflows().then(res => setWorkflows(res.data.data)).catch(console.error)
    }, [])

    return (
        <div style={{ padding: '20px' }}>
            <h2>Start New Request</h2>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {workflows.map(wf => (
                    <div key={wf._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                        <h3>{wf.name}</h3>
                        <p>{wf.description}</p>
                        <button 
                            onClick={() => navigate(`/workflow/employee/create/${wf._id}`)}
                            style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}
                        >
                            Start Request
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ActiveWorkflowsPage
