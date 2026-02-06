import express from 'express'
import adminRoutes from './adminRoutes.js'
import employeeRoutes from './employeeRoutes.js'
import approverRoutes from './approverRoutes.js'

const router = express.Router()

// Mount sub-routers
router.use('/admin', adminRoutes)
router.use('/', employeeRoutes) // Employee routes are often root-level or /requests
router.use('/', approverRoutes) // Approver routes /tasks

export default router
