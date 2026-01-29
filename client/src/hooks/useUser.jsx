import { useState, useCallback } from 'react'
import api from '../api'

const useUser = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Fetch all users
    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/users')
            if (res.data.success) {
                setUsers(res.data.users)
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }, [])

    // Add new user
    const addUser = async (userData) => {
        setLoading(true)
        try {
            const res = await api.post('/api/users', userData)
            if (res.data.success) {
                setUsers(prev => [...prev, res.data.user])
                return { success: true }
            }
        } catch (err) {
            return { success: false, msg: err.response?.data?.msg || 'Failed to add user' }
        } finally {
            setLoading(false)
        }
    }

    // Update user
    const updateUser = async (id, userData) => {
        setLoading(true)
        try {
            const res = await api.put(`/api/users/${id}`, userData)
            if (res.data.success) {
                setUsers(prev => prev.map(user => user._id === id ? res.data.user : user))
                return { success: true }
            }
        } catch (err) {
            return { success: false, msg: err.response?.data?.msg || 'Failed to update user' }
        } finally {
            setLoading(false)
        }
    }

    // Delete user
    const deleteUser = async (id) => {
        setLoading(true)
        try {
            const res = await api.delete(`/api/users/${id}`)
            if (res.data.success) {
                setUsers(prev => prev.filter(user => user._id !== id))
                return { success: true }
            }
        } catch (err) {
            return { success: false, msg: err.response?.data?.msg || 'Failed to delete user' }
        } finally {
            setLoading(false)
        }
    }

    return {
        users,
        loading,
        error,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser
    }
}

export default useUser
