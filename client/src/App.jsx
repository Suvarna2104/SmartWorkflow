import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Admin from './components/Admin'

// Workflow Modules
import WorkflowListPage from './modules/workflow/admin/WorkflowListPage'
import WorkflowCreateWizard from './modules/workflow/admin/WorkflowCreateWizard'
import UserManagementPage from './modules/workflow/admin/UserManagementPage'
import ActiveWorkflowsPage from './modules/workflow/employee/ActiveWorkflowsPage'
import CreateRequestPage from './modules/workflow/employee/CreateRequestPage'
import MyRequestsPage from './modules/workflow/employee/MyRequestsPage'
import RequestDetailsPage from './modules/workflow/employee/RequestDetailsPage'
import MyTasksPage from './modules/workflow/approver/MyTasksPage'
import TaskDetailsPage from './modules/workflow/approver/TaskDetailsPage'

function App() {

  const router = createBrowserRouter([{
    path:'/',
    element:<Login/>
  },
  {
    path:'/admin',
    element:<Admin/> 
  },
  {
    path:'/dashboard',
    element:<Admin/>
  },
  // Workflow Admin
  { path: '/workflow/admin/workflows', element: <WorkflowListPage /> },
  { path: '/workflow/admin/create', element: <WorkflowCreateWizard /> },
  { path: '/workflow/admin/users', element: <UserManagementPage /> },
  
  // Workflow Employee
  { path: '/workflow/employee/active', element: <ActiveWorkflowsPage /> },
  { path: '/workflow/employee/create/:workflowId', element: <CreateRequestPage /> },
  { path: '/workflow/employee/my-requests', element: <MyRequestsPage /> },
  { path: '/workflow/employee/request/:id', element: <RequestDetailsPage /> },

  // Workflow Approver
  { path: '/workflow/approver/tasks', element: <MyTasksPage /> },
  { path: '/workflow/approver/task/:id', element: <TaskDetailsPage /> }
  ])
  

  return (
    <RouterProvider router={router}/>
  )
}

export default App
