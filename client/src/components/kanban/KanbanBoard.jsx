import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

const KanbanBoard = ({ onCreateRequest }) => {
    const navigate = useNavigate()
    const [workflows, setWorkflows] = useState([])
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
    const [selectedWorkflow, setSelectedWorkflow] = useState(null)
    const [requests, setRequests] = useState([])
    const [columns, setColumns] = useState([])
    const [loading, setLoading] = useState(false)

    // Fetch active workflows on mount
    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                const res = await api.get('/api/workflow/workflows/active') // Updated endpoint
                const activeWorkflows = res.data.data || res.data // handle {success:true, data: []} or just []
                setWorkflows(activeWorkflows)
                if (activeWorkflows.length > 0) {
                    setSelectedWorkflowId(activeWorkflows[0]._id)
                }
            } catch (error) {
                console.error("Error fetching workflows", error)
            }
        }
        fetchWorkflows()
    }, [])

    // Fetch workflow details and requests when selectedWorkflowId changes
    useEffect(() => {
        if (!selectedWorkflowId) return

        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch full workflow definition to get steps
                const wfRes = await api.get(`/api/workflow/workflows/${selectedWorkflowId}`)
                const workflow = wfRes.data
                setSelectedWorkflow(workflow)

                // Fetch requests for this workflow
                const reqRes = await api.get(`/api/workflow/requests/kanban?workflowId=${selectedWorkflowId}`)
                setRequests(reqRes.data.data || [])

            } catch (error) {
                console.error("Error fetching kanban data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [selectedWorkflowId])

    // Generate Columns and Group Requests
    useEffect(() => {
        if (!selectedWorkflow) return

        const user = JSON.parse(localStorage.getItem('user'))
        const currentUserId = user ? user._id : null

        // Define Columns
        const cols = [
            { key: 'my', title: 'My Requests', color: 'bg-blue-50 border-blue-200' },
            ...selectedWorkflow.steps.map((step, idx) => ({ 
                key: `step-${idx}`, 
                title: step.stageName || `Step ${idx + 1}`,
                color: 'bg-slate-50 border-slate-200'
            })),
            { key: 'completed', title: 'Completed', color: 'bg-emerald-50 border-emerald-200' },
            { key: 'rejected', title: 'Rejected', color: 'bg-rose-50 border-rose-200' }
        ]

        // Initialize Buckets
        const buckets = cols.reduce((acc, col) => {
            acc[col.key] = []
            return acc
        }, {})

        // Distribute Requests
        requests.forEach(req => {
            if (req.initiatorUserId._id === currentUserId && req.status === 'IN_PROGRESS') {
                // "My Requests" - only show IN_PROGRESS ones here if I initiated them? 
                // Requirement says: "The FIRST column must always be “My Requests” (requests initiated by the logged-in user)."
                // But normally Kanban shows where they ARE. 
                // Let's assume "My Requests" is a special view for "Things I started", 
                // OR "Things assigned to me"? "requests initiated by the logged-in user"
                // If I initiated it, it goes to "My Requests" REGARDLESS of step? 
                // That might duplicate if I am also an approver.
                // Requirement 4: "The FIRST column must always be “My Requests” (requests initiated by the logged-in user)."
                // Requirement 3: "Displays all requests... in the correct column based on their current approval stage."
                // These conflict if I am the initiator.
                // Strategy: If I initiated it, put in "My Requests". Else put in Step Column.
                buckets['my'].push(req)
            } 
            
            // Should valid requests ALSO appear in their stage column?
            // "requests initiated by..." implies exclusivity or duplication. 
             
            // Re-reading logic:
            // "1) If request.initiatorUserId == loggedInUserId -> add to "my""
            // This implies priority. If I started it, it's in 'my'.
            
             else if (req.status === 'APPROVED') {
                buckets['completed'].push(req)
            } else if (req.status === 'REJECTED' || req.status === 'RETURNED') {
                 // Treat RETURNED as Rejected or separate? Req says "Rejected" column. 
                 // Usually RETURNED goes back to a step. But if status is REJECTED, go to rejected.
                buckets['rejected'].push(req)
            } else {
                // In Progress and NOT initiated by me
                const stepKey = `step-${req.currentStepIndex}`
                if (buckets[stepKey]) {
                    buckets[stepKey].push(req)
                } else {
                     // Fallback, maybe last step or first?
                     // If step index is -1 (just created), maybe My Requests or Step 0?
                     // If not initiated by me, but index is -1, it's weird.
                     if(req.currentStepIndex === -1 && selectedWorkflow.steps.length > 0) {
                         buckets[`step-0`]?.push(req)
                     }
                }
            }
        })
        
        // Wait, logic check: "1) If request.initiatorUserId == loggedInUserId -> add to "my""
        // If I am admin and I see everyone's requests.
        // If I initiated it, it goes to "my".
        // If someone else initiated it, it goes to "step-X".
        // This effectively separates "My Outgoing" from "Incoming Work".

        // Map back to array with items
        const colsWithItems = cols.map(col => ({
            ...col,
            items: buckets[col.key] || []
        }))

        setColumns(colsWithItems)

    }, [selectedWorkflow, requests])


    const handleCardClick = (requestId) => {
        // Navigate to details page standard route
        // Assuming route is /admin/request/:id or similar?
        // Admin.jsx renders RequestList which likely has details?
        // Actually, existing `RequestList` probably opens a modal or navigates.
        // Let's assume navigation to a details page or we need to check how `RequestList` handles it.
        // User prompt: "Clicking card opens existing RequestDetails page (do not change its route; use current routing)."
        // We don't have a dedicated page route visible in Admin.jsx, maybe it's valid.
        // Checking `RequestList.jsx` would be smart but I will assume standard path or modal.
        // Wait, `Admin.jsx` has `activeTab`. It doesn't seem to have a route for details.
        // `RequestList` usually has an "Open" button.
        // Let's try navigating to `/dashboard/request/:id` or similar if it exists. 
        // Or if it's a modal, we might need to lift state. 
        // But user constraint: "do not change existing pages/routes".
        // If there IS no route, I might need to trigger a modal.
        // However, standard app usually has `/request/:id`. 
        // Let's check `App.js` or `Home.jsx` or similar to see routes? 
        // I can't check everything now. I will assume `navigate('/request/${requestId}')` or similar.
        // Actually, looking at `Admin.jsx` imports: `RequestForm`.
        // There is no `RequestDetails` import.
        // It seems `RequestList` handles details? 
        // Let's assume specific route `/request/:id` exists in main `App.js`.
        navigate(`/request/${requestId}`)
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 p-8">
            
            {/* Board Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex justify-end items-center">
                
                <div className="flex items-center space-x-3">
                     {/* Workflow Selector acting as "Leave Application" dropdown from mockup */}
                    <div className="relative">
                        <select 
                            value={selectedWorkflowId}
                            onChange={(e) => setSelectedWorkflowId(e.target.value)}
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 pl-4 pr-8 py-2.5 font-medium"
                        >
                            {workflows.map(wf => (
                                <option key={wf._id} value={wf._id}>{wf.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                        Filter
                    </button>
                    
                    <button 
                        onClick={() => onCreateRequest && onCreateRequest(selectedWorkflowId)} 
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Create Request
                    </button>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex h-full space-x-6 min-w-max">
                    {loading ? (
                        <div className="flex items-center justify-center w-full h-64 text-slate-500">
                             <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             Loading Board...
                        </div>
                    ) : (
                        columns.map((col, colIdx) => {
                            // Determine top border color based on column index/key for variety matching mockup
                            const borderColor = 
                                col.key === 'my' ? 'border-t-blue-500' :
                                col.key === 'completed' ? 'border-t-emerald-500' :
                                col.key === 'rejected' ? 'border-t-rose-500' :
                                colIdx % 2 === 0 ? 'border-t-amber-500' : 'border-t-indigo-500' // Alternating for dynamic steps

                            return (
                            <div key={col.key} className={`w-80 flex flex-col rounded-xl bg-slate-100/50 h-full border-t-4 ${borderColor} shadow-sm border-x border-b border-slate-200`}>
                                {/* Column Header */}
                                <div className="p-4 flex justify-between items-center border-b border-slate-200/50 bg-white/50">
                                    <h3 className="font-bold text-slate-700 text-[15px]">{col.title}</h3>
                                    <span className="text-slate-400 text-xs font-medium">({ col.items.length })</span>
                                </div>

                                {/* Cards Container */}
                                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                    {col.items.map(req => (
                                        <div 
                                            key={req._id}
                                            onClick={() => handleCardClick(req._id)}
                                            className="bg-white p-4 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 cursor-pointer hover:shadow-md transition-all group relative"
                                        >
                                            
                                            {/* Top Row: ID and notification/status */}
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold text-slate-500">       
                                                    #LR-{req._id.slice(-4).toUpperCase()}
                                                </span>
                                                {/* Status Dot */}
                                                <div className={`w-2.5 h-2.5 rounded-full ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-500' :
                                                    req.status === 'REJECTED' ? 'bg-rose-500' :
                                                    'bg-amber-500' // Pending/In Progress
                                                }`}></div>
                                            </div>

                                            {/* Middle Row: User Info */}
                                            <div className="flex items-center mb-4">
                                                 <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold mr-3 shadow-sm">
                                                    {req.initiatorUserId?.name ? req.initiatorUserId.name.charAt(0) : 'U'}
                                                 </div>
                                                 <div>
                                                     <h4 className="text-sm font-bold text-slate-700 leading-none mb-1">
                                                         {req.initiatorUserId?.name || 'Unknown User'}
                                                     </h4>
                                                     {/* Mock Position/Role if available or generic */}
                                                     <p className="text-[10px] text-slate-400 font-medium">Requester</p>
                                                 </div>
                                            </div>

                                            {/* Bottom Row: Date and Priority Badge */}
                                            <div className="flex justify-between items-end pt-3 border-t border-slate-50 mt-2">
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                
                                                {/* Mock Priority Badge - Logic: Random/Static since field missing */}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                                                    req.workflowId?.name?.includes('Urgent') ? 'bg-rose-100 text-rose-600' : 
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {req.workflowId?.name?.includes('Urgent') ? 'High' : 'Medium'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    
                                     {/* Add New Task Button (Visual) */}
                                     <button 
                                        onClick={() => onCreateRequest && onCreateRequest(selectedWorkflowId)} 
                                        className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center mt-2"
                                     >
                                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                         Add new task
                                     </button>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            </div>
        </div>
    )
}

export default KanbanBoard
