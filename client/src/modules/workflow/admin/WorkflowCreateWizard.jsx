import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

const WorkflowCreateWizard = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [basicInfo, setBasicInfo] = useState({ name: '', description: '' })
    const [formFields, setFormFields] = useState([])
    const [approvalSteps, setApprovalSteps] = useState([])
    const [roles, setRoles] = useState([])
    const [users, setUsers] = useState([])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
             try {
                 const [roleRes, userRes] = await Promise.all([
                     api.getRoles(),
                     api.getUsers()
                 ])
                 setRoles(roleRes.data.data)
                 setUsers(userRes.data.users)
             } catch (err) {
                 console.error(err)
             }
        }
        fetchData()
    }, [])

    const addFormField = () => {
        setFormFields([...formFields, { key: '', label: '', type: 'text', required: false, options: '' }])
    }

    const updateFormField = (index, field, val) => {
        const newFields = [...formFields]
        newFields[index][field] = val
        setFormFields(newFields)
    }

    const addApprovalStep = () => {
        setApprovalSteps([...approvalSteps, { 
            stepOrder: approvalSteps.length + 1, 
            stageName: '', 
            approverType: 'ROLE', 
            roleIds: [], 
            condition: { fieldKey: '', operator: '>', value: '' } 
        }])
    }

    const updateApprovalStep = (index, field, val) => {
        const newSteps = [...approvalSteps]
        newSteps[index][field] = val
        setApprovalSteps(newSteps)
    }

    const handleSubmit = async () => {
        try {
            setSubmitting(true)
            // Process form options (string split)
            const processedForm = formFields.map(f => ({
                ...f,
                options: f.type === 'select' ? f.options.split(',').map(s => s.trim()) : []
            }))
            
            // Process steps (ensure roleIds is array if not already)
            const processedSteps = approvalSteps.map(s => ({
                ...s,
                roleIds: Array.isArray(s.roleIds) ? s.roleIds : (s.roleIds ? [s.roleIds] : []), 
                userIds: s.userId ? [s.userId] : [],
                mode: 'ANY_ONE' // Default for now
            }))

            await api.createWorkflow({
                ...basicInfo,
                formSchema: processedForm,
                steps: processedSteps
            })
            alert('Workflow Created!')
            navigate('/workflow/admin/workflows')
        } catch (err) {
            alert('Error: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h2>Create Workflow - Step {step}/3</h2>
            
            {step === 1 && (
                <div>
                    <h3>Basic Info</h3>
                    <input 
                        placeholder="Workflow Name" 
                        value={basicInfo.name} 
                        onChange={e => setBasicInfo({...basicInfo, name: e.target.value})}
                        style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }}
                    />
                    <textarea 
                        placeholder="Description" 
                        value={basicInfo.description} 
                        onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
                        style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }}
                    />
                    <button onClick={() => setStep(2)}>Next: Form Builder</button>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3>Form Builder</h3>
                    {formFields.map((field, idx) => (
                        <div key={idx} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                            <input placeholder="Field Key (e.g. amount)" value={field.key} onChange={e => updateFormField(idx, 'key', e.target.value)} />
                            <input placeholder="Label" value={field.label} onChange={e => updateFormField(idx, 'label', e.target.value)} />
                            <select value={field.type} onChange={e => updateFormField(idx, 'type', e.target.value)}>
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="select">Select</option>
                            </select>
                            {field.type === 'select' && (
                                <input placeholder="Options (comma sep)" value={field.options} onChange={e => updateFormField(idx, 'options', e.target.value)} />
                            )}
                        </div>
                    ))}
                    <button onClick={addFormField}>+ Add Field</button>
                    <br /><br />
                    <button onClick={() => setStep(1)}>Back</button> &nbsp;
                    <button onClick={() => setStep(3)}>Next: Approval Steps</button>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3>Approval Steps</h3>
                    {approvalSteps.map((step, idx) => (
                        <div key={idx} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                            <input placeholder="Stage Name" value={step.stageName} onChange={e => updateApprovalStep(idx, 'stageName', e.target.value)} />
                            <select value={step.approverType} onChange={e => updateApprovalStep(idx, 'approverType', e.target.value)}>
                                <option value="ROLE">Role</option>
                                <option value="USER">User</option>
                                <option value="MANAGER_OF_INITIATOR">Reporting Manager</option>
                            </select>
                            {step.approverType === 'ROLE' && (
                                <select onChange={e => updateApprovalStep(idx, 'roleIds', [e.target.value])}>
                                    <option value="">Select Role</option>
                                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            )}
                            {step.approverType === 'USER' && (
                                <select onChange={e => updateApprovalStep(idx, 'userId', e.target.value)}>
                                    <option value="">Select User</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                                </select>
                            )}
                            {/* Simple Condition UI */}
                            <div style={{ marginTop: '5px' }}>
                                <small>Condition (Optional):</small>
                                <input placeholder="Field Key" value={step.condition?.fieldKey} onChange={e => {
                                    const newCond = { ...step.condition, fieldKey: e.target.value }
                                    updateApprovalStep(idx, 'condition', newCond)
                                }} />
                                <select value={step.condition?.operator} onChange={e => {
                                    const newCond = { ...step.condition, operator: e.target.value }
                                    updateApprovalStep(idx, 'condition', newCond)
                                }}>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value="==">==</option>
                                </select>
                                <input placeholder="Value" value={step.condition?.value} onChange={e => {
                                    const newCond = { ...step.condition, value: e.target.value }
                                    updateApprovalStep(idx, 'condition', newCond)
                                }} />
                            </div>
                        </div>
                    ))}
                    <button onClick={addApprovalStep}>+ Add Step</button>
                    <br /><br />
                    <button onClick={() => setStep(2)}>Back</button> &nbsp;
                    <button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Workflow'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default WorkflowCreateWizard
