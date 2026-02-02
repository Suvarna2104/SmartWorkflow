import express, { json } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import loginRoute from './routes/login.js'
import verifyToken from './middleware/authMiddleware.js'
import userRoutes from './routes/userRoutes.js'
import workflowRoutes from './routes/workflowRoutes.js'
import requestRoutes from './routes/requestRoutes.js'
import roleRoutes from './routes/roleRoutes.js'
import loggerMiddleware from './middleware/loggerMiddleware.js'

const app = express()
dotenv.config()
app.use(cors())
app.use(express.json())
app.use(loggerMiddleware)

app.use('/auth/login', loginRoute)
app.use('/api/users', userRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/roles', roleRoutes)

import Role from './model/Role.js'

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.info(`MongoDB Connected`)

        // Auto-seed Roles
        const predefinedRoles = ['Admin', 'Manager', 'Employee', 'HR']
        for (const roleName of predefinedRoles) {
            const exists = await Role.findOne({ name: roleName })
            if (!exists) {
                await Role.create({ name: roleName })
                console.log(`Seeded Role: ${roleName}`)
            }
        }
    })
    .catch(err => console.error("Error Connecting MongoDB : ", err))

app.get('/ok', verifyToken, (req, res) => {
    try {

        console.log(`Path : ${req.url}\n Method : ${req.method}`)
        return res.status(200).json({ msg: 'Server Ok' })
    }
    catch (err) {
        console.log("Error Testing Server: ", err)
        return res.status(500).json({ msg: 'Internal Server Error', err })
    }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})