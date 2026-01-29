import { useState } from 'react'
import api from '../api'

const useLogin = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const login = async (email, password) => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.post('/auth/login', { email, password })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            return { success: true, data: res.data }
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed')
            return { success: false, error: err.response?.data?.msg || 'Login failed' }
        } finally {
            setLoading(false)
        }
    }

    return { login, loading, error }
}

export default useLogin