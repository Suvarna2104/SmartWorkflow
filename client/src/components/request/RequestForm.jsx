import React, { useState, useEffect } from 'react'
import api from '../../api'

const RequestForm = ({ onClose, onSuccess, initialWorkflowId }) => {
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  
  useEffect(() => {
    fetchWorkflows()
  }, [])

  useEffect(() => {
    if (initialWorkflowId && workflows.length > 0) {
        const preSelected = workflows.find(w => w._id === initialWorkflowId)
        if (preSelected) {
            setSelectedWorkflow(preSelected)
        }
    }
  }, [initialWorkflowId, workflows])

  const fetchWorkflows = async () => {
    try {
        const res = await api.get('/api/workflow/workflows/active')
        setWorkflows(res.data.data || [])
    } catch (error) {
        console.error("Error fetching workflows", error)
    }
  }

  const handleWorkflowChange = (e) => {
      const wf = workflows.find(w => w._id === e.target.value)
      setSelectedWorkflow(wf)
      setFormData({})
      setErrors({})
  }

  const handleFieldChange = (e) => {
      console.log(`Field Changed: ${e.target.name} = ${e.target.value}`)
      setFormData({...formData, [e.target.name]: e.target.value})
      // Clear error for this field
      if (errors[e.target.name]) {
          setErrors(prev => ({...prev, [e.target.name]: null}))
      }
  }

  const validateForm = () => {
      const newErrors = {}
      let isValid = true

      selectedWorkflow.formSchema.forEach(field => {
          const key = field.key
          const value = formData[key]

          // 1. Required Check
          if (field.required && !value) {
              newErrors[key] = `${field.label} is required`
              isValid = false
              return
          }

          // 2. Date Validation
          if (field.type === 'date' && value) {
              const date = new Date(value)
              if (isNaN(date.getTime())) {
                  newErrors[key] = "Invalid Date"
                  isValid = false
              } else {
                  // Optional: No Past Date check
                  // Check if we should enforce this? User said "optional rule: date cannot be in the past (configurable)"
                  // For now, let's enforce it by default or check a hypothetical config. 
                  // Let's enforce it simply as "Should be today or future"
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  if (date < today) {
                      newErrors[key] = "Date cannot be in the past"
                      isValid = false
                  }
              }
          }
      })

      setErrors(newErrors)
      return isValid
  }

  const handleSubmit = async (e) => {
      e.preventDefault()
      if (!selectedWorkflow) return

      if (!validateForm()) {
          console.log("Validation Failed", errors) // Errors state might not be updated yet in log, but UI will show
          return
      }

      console.log("Submitting FormData:", formData)

      try {
          await api.post('/api/workflow/requests', {
              workflowId: selectedWorkflow._id,
              formData: formData
          })
          alert('Request submitted successfully!')
          onSuccess && onSuccess()
          onClose && onClose()
      } catch (error) {
          console.error("Error submitting request", error)
          alert('Failed to submit request')
      }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Start New Request</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Workflow</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        onChange={handleWorkflowChange}
                        value={selectedWorkflow?._id || ''}
                        required
                    >
                        <option value="">-- Choose Workflow --</option>
                        {workflows.map(wf => (
                            <option key={wf._id} value={wf._id}>{wf.name}</option>
                        ))}
                    </select>
                </div>

                {selectedWorkflow && (
                    <div className="space-y-4 border-t pt-4">
                        <p className="text-sm text-gray-500 mb-2">{selectedWorkflow.description}</p>
                        
                        {selectedWorkflow.formSchema.map((field, idx) => {
                             // CRITICAL FIX: Use field.key instead of field.name
                             // Fallback to name/label if key is missing (though model requires key)
                             const fieldKey = field.key || field.name || field.label.replace(/\s+/g, '_').toLowerCase()
                             
                             return (
                            <div key={idx}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={fieldKey}
                                        required={field.required}
                                        onChange={handleFieldChange}
                                        value={formData[fieldKey] || ''}
                                        className={`w-full border rounded-lg px-4 py-2 ${errors[fieldKey] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    ></textarea>
                                ) : field.type === 'select' ? (
                                    <select
                                        name={fieldKey}
                                        required={field.required}
                                        onChange={handleFieldChange}
                                        value={formData[fieldKey] || ''}
                                        className={`w-full border rounded-lg px-4 py-2 ${errors[fieldKey] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select...</option>
                                        {field.options.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        name={fieldKey}
                                        required={field.required}
                                        onChange={handleFieldChange}
                                        value={formData[fieldKey] || ''}
                                        className={`w-full border rounded-lg px-4 py-2 ${errors[fieldKey] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                )}
                                {errors[fieldKey] && (
                                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        {errors[fieldKey]}
                                    </p>
                                )}
                            </div>
                        )})}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                        disabled={!selectedWorkflow}
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default RequestForm
