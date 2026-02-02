import React, { useState } from 'react'

const FormBuilder = ({ formSchema, setFormSchema }) => {
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '' })

  const addField = () => {
    if (!newField.label) return
    const field = {
        name: newField.label.toLowerCase().replace(/\s+/g, '_'),
        label: newField.label,
        type: newField.type,
        required: newField.required,
        options: newField.options ? newField.options.split(',').map(o=>o.trim()) : []
    }
    setFormSchema([...formSchema, field])
    setNewField({ label: '', type: 'text', required: false, options: '' })
  }

  const removeField = (index) => {
    const updated = [...formSchema]
    updated.splice(index, 1)
    setFormSchema(updated)
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4">
        <h4 className="font-bold text-gray-700 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Form Fields Builder
        </h4>
        
        {/* Existing Fields List */}
        <div className="space-y-2 mb-4">
            {formSchema.length === 0 && <p className="text-sm text-gray-400 italic">No fields added yet.</p>}
            {formSchema.map((field, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="text-sm">
                        <span className="font-medium">{field.label}</span> 
                        <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                        {field.required && <span className="text-red-500 text-xs ml-1">*Req</span>}
                    </div>
                    <button type="button" onClick={() => removeField(idx)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            ))}
        </div>

        {/* Add New Field - Inline Form */}
        <div className="flex flex-wrap gap-2 items-end bg-blue-50 p-3 rounded-lg">
            <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-semibold text-gray-600">Label</label>
                <input 
                    type="text" 
                    value={newField.label}
                    onChange={(e) => setNewField({...newField, label: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm" 
                    placeholder="e.g. Leave Reason"
                />
            </div>
            <div className="w-24">
                <label className="text-xs font-semibold text-gray-600">Type</label>
                <select 
                    value={newField.type}
                    onChange={(e) => setNewField({...newField, type: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                >
                    <option value="text">Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown</option>
                    <option value="file">File</option>
                </select>
            </div>
            {newField.type === 'select' && (
                 <div className="flex-1 min-w-[120px]">
                    <label className="text-xs font-semibold text-gray-600">Options (comma sep)</label>
                    <input 
                        type="text" 
                        value={newField.options}
                        onChange={(e) => setNewField({...newField, options: e.target.value})}
                        className="w-full border rounded px-2 py-1 text-sm" 
                        placeholder="opt1, opt2"
                    />
                </div>
            )}
            <div className="flex items-center pb-2">
                 <input 
                    type="checkbox" 
                    checked={newField.required}
                    onChange={(e) => setNewField({...newField, required: e.target.checked})}
                    className="mr-1"
                />
                 <label className="text-xs text-gray-600">Req</label>
            </div>
            <button 
                type="button" 
                onClick={addField}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
                Add
            </button>
        </div>
    </div>
  )
}

export default FormBuilder
