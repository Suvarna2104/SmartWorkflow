import express from 'express'
import { Login } from '../controller/Login.js'

const router = express.Router()

router.post('/', Login)

export default router
