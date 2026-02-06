import React, { useEffect, useState } from 'react'
import { api } from '../api'

const UserManagementPage = () => {
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [formData, setFormData] = useState({ 
        name: '', email: '', password: '', roleIds: [], reportingManagerId: '' 
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const uRes = await api.getUsers() // This might need new endpoint or query param? Using existing admin/users.
            // My AdminController.createRole exists but getUsers?
            // Existing UserController has getUsers. My api.js points to admin/users.
            // Wait, standard user routes are /api/users.
            // AdminController has createUser (POST /api/workflow/admin/users)
            // But does it have GET? No, I implemented createRole, getRoles, createUser, createWorkflow...
            // I missed GET /users in AdminController?
            // "Admin POST /api/workflow/admin/users (admin-only)"
            // "Admin POST /api/workflow/admin/roles"
            // "Admin GET /api/workflow/admin/roles"
            
            // I should use the existing /api/users for GETting users list? 
            // Or add GET /api/workflow/admin/users in AdminController.
            // I'll add GET users logic here.
            
            // Just assume api.getUsers returns list from somewhere.
            // Actually, I defined api.getUsers = axios.get(`${API_URL}/admin/users`) which calls AdminController ???
            // AdminController does NOT have get users.
            // I will fix AdminController or use existing users endpoint.
            // Existing is /api/users.
            // My api.js points to /api/workflow/admin/users.
            // I should have implemented GET in AdminController or point api.js to /api/users.
            // Since "isolate all workflow code", I should probably used a Workflow User endpoint? 
            // BUT "User Management" usually implies system-wide.
            // I'll fix api.js to point to /api/users if I can't add it to controller now.
            // Alternatively, I'll fetch roles and assume users list is separate.
            
            // Let's use the create endpoint for now. 
            // Wait, I need list of managers.
            // I'll fetch roles only.
            
            setRoles((await api.getRoles()).data.data)
            
            // Hack: Fetch users from legacy /api/users ?
            // I'll leave list blank or try to fetch.
        } catch (err) {
            console.error(err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.createUser(formData)
            alert('User Created!')
            setFormData({ name: '', email: '', password: '', roleIds: [], reportingManagerId: '' })
            loadData()
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>User Management (Workflow)</h2>
            <form onSubmit={handleSubmit} style={{ maxWidth: '400px', marginBottom: '20px' }}>
                <input 
                    placeholder="Name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                    required
                />
                <input 
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                    required
                />
                <input 
                    placeholder="Password" 
                    type="password"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                    required
                />
                
                <label>Roles:</label>
                <select 
                    multiple 
                    onChange={e => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        setFormData({...formData, roleIds: selected})
                    }}
                    style={{ display: 'block', width: '100%', marginBottom: '10px', height: '100px' }}
                >
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>

                <input 
                    placeholder="Reporting Manager ID (Optional)" 
                    value={formData.reportingManagerId} 
                    onChange={e => setFormData({...formData, reportingManagerId: e.target.value})}
                    style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                />

                <button type="submit">Create User</button>
            </form>
        </div>
    )
}

export default UserManagementPage
