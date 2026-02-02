import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Admin from './components/Admin'

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
  }])
  

  return (
    <RouterProvider router={router}/>
  )
}

export default App
