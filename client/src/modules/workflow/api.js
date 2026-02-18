import axios from 'axios'

const API_URL = 'http://localhost:5000/api/workflow' // Adjust base if needed

// Interceptor to add token
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const api = {
    // Admin
    getRoles: () => axios.get(`${API_URL}/admin/roles`),
    createRole: (data) => axios.post(`${API_URL}/admin/roles`, data),
    getUsers: () => axios.get(`${API_URL}/admin/users`), // Using existing or new? The new one is admin/users
    createUser: (data) => axios.post(`${API_URL}/admin/users`, data),
    getWorkflowsAdmin: () => axios.get(`${API_URL}/admin/workflows`),
    createWorkflow: (data) => axios.post(`${API_URL}/admin/workflows`, data),
    createNewVersion: (id, data) => axios.put(`${API_URL}/admin/workflows/${id}/new-version`, data),

    // Employee / Shared
    getActiveWorkflows: () => axios.get(`${API_URL}/workflows/active`),
    createRequest: (data) => axios.post(`${API_URL}/requests`, data), // { workflowId, formData }
    getMyRequests: () => axios.get(`${API_URL}/requests/my`), 
    getRequestDetails: (id) => axios.get(`${API_URL}/requests/${id}`),

    // Shared Helpers
    getRoles: () => axios.get(`${API_URL}/admin/roles`), // Reusing admin endpoint for now, or move to shared
    getUsers: (role) => axios.get(`${API_URL}/../users`, { params: { role } }), // Accessing /api/users directly

    // Approver
    getMyTasks: () => axios.get(`${API_URL}/tasks/my`),
    performAction: (id, data) => axios.post(`${API_URL}/requests/${id}/action`, data) // { action, comment }
}
