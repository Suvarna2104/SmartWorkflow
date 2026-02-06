import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

const MyRequestsPage = () => {
    const [requests, setRequests] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        api.getMyRequests().then(res => setRequests(res.data.data)).catch(console.error)
    }, [])

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Requests</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
                <thead>
                    <tr>
                        <th>Workflow</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(req => (
                        <tr key={req._id}>
                            <td>{req.workflowId?.name}</td>
                            <td>{req.status}</td>
                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => navigate(`/workflow/employee/request/${req._id}`)}>View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default MyRequestsPage
