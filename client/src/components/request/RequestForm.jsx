import React, { useState, useEffect } from 'react'
import api from '../../api'

const RequestForm = ({ onClose, onSuccess, initialWorkflowId }) => {
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [formData, setFormData] = useState({})
  
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
  }

  const handleFieldChange = (e) => {
      setFormData({...formData, [e.target.name]: e.target.value})
  }

  const handleSubmit = async (e) => {
      e.preventDefault()
      if (!selectedWorkflow) return

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
                        
                        {selectedWorkflow.formSchema.map((field, idx) => (
                            <div key={idx}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name}
                                        required={field.required}
                                        onChange={handleFieldChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    ></textarea>
                                ) : field.type === 'select' ? (
                                    <select
                                        name={field.name}
                                        required={field.required}
                                        onChange={handleFieldChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    >
                                        <option value="">Select...</option>
                                        {field.options.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        required={field.required}
                                        onChange={handleFieldChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    />
                                )}
                            </div>
                        ))}
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
