import React, { useEffect, useState } from 'react'
import { api } from '../api' // Relative path from modules/workflow/admin/ to modules/workflow/api ? No.
// File path: client/src/modules/workflow/admin/WorkflowListPage.jsx
// api path: client/src/modules/workflow/api.js -> ../api

import { useNavigate } from 'react-router-dom'

const WorkflowListPage = () => {
    const [workflows, setWorkflows] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        loadWorkflows()
    }, [])

    const loadWorkflows = async () => {
        try {
            const res = await api.getWorkflowsAdmin()
            setWorkflows(res.data.data)
        } catch (err) {
            alert('Error loading workflows: ' + err.message)
        }
    }

    return (
        <div className="p-4" style={{ padding: '20px' }}>
            <h2>Workflow Management</h2>
            <button 
                onClick={() => navigate('/workflow/admin/create')}
                style={{ padding: '10px 20px', marginBottom: '20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                + Create New Workflow
            </button>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }} border="1">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Steps</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {workflows.map(wf => (
                        <tr key={wf._id}>
                            <td>{wf.name}</td>
                            <td>v{wf.version}</td>
                            <td>{wf.isActive ? 'Active' : 'Inactive'}</td>
                            <td>{wf.steps.length}</td>
                            <td>
                                <button onClick={() => navigate(`/workflow/admin/edit/${wf._id}`)} disabled>Edit (Coming Soon)</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default WorkflowListPage
