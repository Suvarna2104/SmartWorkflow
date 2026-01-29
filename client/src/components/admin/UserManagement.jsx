import React, { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'

const UserManagement = () => {
  const { users, loading, fetchUsers, addUser, updateUser, deleteUser } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    team: 'General'
  })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', role: 'user', team: 'General' })
    setIsEdit(false)
    setShowModal(true)
  }

  const handleOpenEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role,
      team: user.team
    })
    setEditId(user._id)
    setIsEdit(true)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isEdit) {
      // For edit, remove password if empty so it doesn't get overwritten with empty string
      const dataToSend = { ...formData }
      if (!dataToSend.password) delete dataToSend.password
      
      const result = await updateUser(editId, dataToSend)
      if (result.success) setShowModal(false)
      else alert(result.msg)
    } else {
      const result = await addUser(formData)
      if (result.success) setShowModal(false)
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
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
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team</label>
                  <input
                    type="text"
                    name="team"
                    value={formData.team}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
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