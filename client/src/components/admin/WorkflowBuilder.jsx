import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import api from '../../api'
import FormBuilder from './FormBuilder'
import StepsBuilder from './StepsBuilder'

const WorkflowBuilder = forwardRef((props, ref) => {
  const [showModal, setShowModal] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formSchema: [],
    steps: []
  })
  
  // Expose open function to parent
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
        setFormData({ name: '', description: '', formSchema: [], steps: [] })
        setShowModal(true)
    }
  }))

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
        const res = await api.get('/api/workflows')
        setWorkflows(res.data)
    } catch (error) {
        console.error("Error fetching workflows", error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
        await api.post('/api/workflows', formData)
        setShowModal(false)
        fetchWorkflows()
    } catch (error) {
        console.error("Error creating workflow", error)
        alert('Failed to create workflow')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Workflow Definitions</h2>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <p>No workflows found. Click "Create Workflow" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map(wf => (
                <div key={wf._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{wf.name}</h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${wf.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {wf.isActive ? 'Active' : 'Inactive'} v{wf.version}
                            </span>
                        </div>
                        <button className="text-gray-400 hover:text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{wf.description}</p>
                    <div className="flex justify-between text-xs text-gray-500 border-t pt-4">
                        <span>{wf.steps?.length || 0} Steps</span>
                        <span>{new Date(wf.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Create New Workflow</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                    <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g., Leave Request"
                    required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Workflow purpose..."
                    ></textarea>
                </div>
              </div>

              {/* Form & Steps Builders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormBuilder 
                    formSchema={formData.formSchema} 
                    setFormSchema={(schema) => setFormData({...formData, formSchema: schema})} 
                />
                <StepsBuilder 
                    steps={formData.steps} 
                    setSteps={(steps) => setFormData({...formData, steps: steps})} 
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

export default WorkflowBuilder