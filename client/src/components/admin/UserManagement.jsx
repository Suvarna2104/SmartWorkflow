import React, { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../api'

const UserManagement = () => {
  const { users, loading, fetchUsers, addUser, updateUser, deleteUser } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [roles, setRoles] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '', // Changed to roleId for selection
    team: 'General'
  })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers])

  const fetchRoles = async () => {
    try {
        const res = await api.get('/api/workflow/admin/roles')
        let fetchedRoles = []
        if (Array.isArray(res.data)) {
             fetchedRoles = res.data
        } else if (res.data.success && Array.isArray(res.data.data)) {
             fetchedRoles = res.data.data
        }
        setRoles(fetchedRoles)
        return fetchedRoles
    } catch (error) {
        console.error("Error fetching roles", error)
        return []
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCreateRole = async () => {
      const roleName = prompt("Enter new Role Name:")
      if (!roleName) return

      try {
          const res = await api.post('/api/workflow/admin/roles', { name: roleName })
          if (res.data.success) {
              alert("Role created successfully!")
              const newRoles = await fetchRoles() // Refresh list and get new list
              
              // Auto-select the new role if possible. 
              // We need the ID of the new role. res.data.data should have it.
              if (res.data.data && res.data.data._id) {
                   setFormData(prev => ({ ...prev, roleId: res.data.data._id }))
              }
          } else {
             alert("Failed to create role: " + (res.data.msg || 'Unknown error'))
          }
      } catch (error) {
          console.error("Error creating role", error)
          alert("Failed to create role: " + (error.response?.data?.error || error.message))
      }
  }

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', roleId: '', team: 'General' })
    setIsEdit(false)
    setShowModal(true)
  }

  const handleOpenEdit = (user) => {
    // Determine current roleId from user.roles array or fallback
    // user.roles populated? If fetchUsers does populate, great. 
    // If not, we might only have role string.
    // Let's assume user.roles is populated with Objects or IDs.
    // If user.roles is array of objects, take first one.
    
    let currentRoleId = ''
    if (user.roles && user.roles.length > 0) {
        currentRoleId = typeof user.roles[0] === 'object' ? user.roles[0]._id : user.roles[0]
    } else {
         // Fallback: try to find role by name from our roles list
         const found = roles.find(r => r.name === user.role)
         if (found) currentRoleId = found._id
    }

    setFormData({
      name: user.name,
      email: user.email,
      password: '', 
      roleId: currentRoleId,
      team: user.team
    })
    setEditId(user._id)
    setIsEdit(true)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Construct payload
    // Find role name for legacy field
    const selectedRole = roles.find(r => r._id === formData.roleId)
    const roleName = selectedRole ? selectedRole.name : 'employee'

    const payload = {
        name: formData.name,
        email: formData.email,
        role: roleName, // Legacy
        roleIds: [formData.roleId], // New
        team: formData.team
    }
    
    if (isEdit) {
      if (formData.password) payload.password = formData.password
      
      const result = await updateUser(editId, payload)
      if (result.success) {
          setShowModal(false)
          fetchUsers() // Refresh users to show updated data
      }
      else alert(result.msg)
    } else {
      payload.password = formData.password
      const result = await addUser(payload)
      if (result.success) {
          setShowModal(false)
          fetchUsers()
      }
      else alert(result.msg)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = await deleteUser(id)
      if (!result.success) alert(result.msg)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Team</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
            ) : users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.team}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => handleOpenEdit(user)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{isEdit ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    required={!isEdit}
                  />
                </div>
              )}
               {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="flex space-x-2">
                      <select
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md p-2 bg-white"
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={handleCreateRole}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                        title="Add New Role"
                      >
                          +
                      </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <input
                    type="text"
                    name="team"
                    value={formData.team}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEdit ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement