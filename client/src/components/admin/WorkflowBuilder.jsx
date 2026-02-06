import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import api from '../../api'
import FormBuilder from './FormBuilder'
import StepsBuilder from './StepsBuilder'

const WorkflowBuilder = forwardRef((props, ref) => {
  const [showModal, setShowModal] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formSchema: [],
    steps: []
  })
  
  // Expose open function to parent
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
        setEditingId(null)
        setFormData({ name: '', description: '', formSchema: [], steps: [] })
        setShowModal(true)
    }
  }))

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
        const res = await api.get('/api/workflow/admin/workflows')
        setWorkflows(res.data.data || [])
    } catch (error) {
        console.error("Error fetching workflows", error)
    }
  }

  const handleEdit = (wf) => {
      setEditingId(wf._id)
      setFormData({
          name: wf.name,
          description: wf.description,
          formSchema: wf.formSchema,
          steps: wf.steps
      })
      setShowModal(true)
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
        if (editingId) {
            await api.put(`/api/workflow/admin/workflows/${editingId}/new-version`, formData)
            alert('New Version Created Successfully!')
        } else {
            await api.post('/api/workflow/admin/workflows', formData)
            alert('Workflow Created Successfully!')
        }
        setShowModal(false)
        fetchWorkflows()
    } catch (error) {
        console.error("Error saving workflow", error)
        alert(`Failed to save: ${error.response?.data?.msg || error.message}`)
    }
  }

  const handleToggle = async (id, currentStatus) => {
      try {
          await api.patch(`/api/workflow/admin/workflows/${id}/toggle`)
          fetchWorkflows()
      } catch (err) {
          alert('Error: ' + err.message)
      }
  }

  const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to delete this workflow version?')) return
      try {
          await api.delete(`/api/workflow/admin/workflows/${id}`)
          fetchWorkflows()
      } catch (err) {
          alert('Error: ' + err.message)
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
                <div key={wf._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{wf.name}</h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${wf.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {wf.isActive ? 'Active' : 'Inactive'} v{wf.version}
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleToggle(wf._id)} className={`${wf.isActive ? 'text-orange-400 hover:text-orange-600' : 'text-green-400 hover:text-green-600'}`} title={wf.isActive ? 'Deactivate' : 'Activate'}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path></svg>
                            </button>
                            <button onClick={() => handleEdit(wf)} className="text-blue-400 hover:text-blue-600" title="Create New Version">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onClick={() => handleDelete(wf._id)} className="text-red-400 hover:text-red-600" title="Delete">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
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
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Workflow (New Version)' : 'Create New Workflow'}</h3>
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
                    disabled={!!editingId} // Cannot change name when versioning usually, as name+version is unique index logic
                    />
                    {editingId && <small className="text-gray-500">Name cannot be changed for a new version</small>}
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
                  {editingId ? 'Create New Version' : 'Create Workflow'}
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