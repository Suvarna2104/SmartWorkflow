import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

const MyTasksPage = () => {
    const [tasks, setTasks] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        api.getMyTasks().then(res => setTasks(res.data.data)).catch(console.error)
    }, [])

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Pending Tasks</h2>
            {tasks.length === 0 ? <p>No pending tasks.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
                <thead>
                    <tr>
                        <th>Workflow</th>
                        <th>Initiator</th>
                        <th>Current Step</th>
                        <th>Created At</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task._id}>
                            <td>{task.workflowId?.name}</td>
                            <td>{task.initiatorUserId?.name}</td>
                            <td>{task.kanbanStageKey || 'Approval'}</td>
                            <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button 
                                    onClick={() => navigate(`/workflow/approver/task/${task._id}`)}
                                    style={{ background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                                >
                                    Open
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            )}
        </div>
    )
}

export default MyTasksPage
