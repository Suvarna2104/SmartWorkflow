import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate, useParams } from 'react-router-dom'

const CreateRequestPage = () => {
    const { workflowId } = useParams()
    const navigate = useNavigate()
    const [workflow, setWorkflow] = useState(null)
    const [formData, setFormData] = useState({})
    
    useEffect(() => {
        // We need workflow definition. But getActiveWorkflows returns list. 
        // We might not have a direct "get workflow public details" endpoint?
        // Reuse getActiveWorkflows and find? Or fetching single definition?
        // The API I made: getActiveWorkflows returns all.
        // Let's Fetch all and find (not efficient but works for MVP).
        api.getActiveWorkflows().then(res => {
            const found = res.data.data.find(w => w._id === workflowId)
            setWorkflow(found)
        })
    }, [workflowId])

    const handleChange = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.createRequest({ workflowId, formData })
            alert('Request Submitted!')
            navigate('/workflow/employee/my-requests')
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    if (!workflow) return <div>Loading...</div>

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <h2>New Request: {workflow.name}</h2>
            <form onSubmit={handleSubmit}>
                {workflow.formSchema.map(field => (
                    <div key={field.key} style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'select' ? (
                            <select 
                                required={field.required}
                                onChange={e => handleChange(field.key, e.target.value)}
                                style={{ width: '100%', padding: '8px' }}
                            >
                                <option value="">Select...</option>
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input 
                                type={field.type}
                                required={field.required}
                                onChange={e => handleChange(field.key, e.target.value)}
                                style={{ width: '100%', padding: '8px' }}
                            />
                        )}
                    </div>
                ))}
                <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }}>
                    Submit Request
                </button>
            </form>
        </div>
    )
}

export default CreateRequestPage
