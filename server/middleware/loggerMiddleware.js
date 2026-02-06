import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createLogStream = () => {
    const logDir = path.join(__dirname, '../logs')
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir)
    }
    return fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' })
}

const logStream = createLogStream()

const loggerMiddleware = (req, res, next) => {
    const start = Date.now()
    const { method, url, body, query } = req

    // Console Log for Development
    console.log(`[${new Date().toISOString()}] ${method} ${url}`)

    // Hook into response finish to log status and duration
    res.on('finish', () => {
        const duration = Date.now() - start
        const status = res.statusCode
        const logMessage = `[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms\n`

        // Log to file
        logStream.write(logMessage)

        // Console Log Response
        console.log(` -> ${status} ${duration}ms`)

        if (status >= 400) {
            console.error(`Error Request: ${method} ${url} - Status: ${status}`)
            // Optionally log body if safe (avoid passwords)
            if (body && Object.keys(body).length > 0) {
                const safeBody = { ...body }
                if (safeBody.password) safeBody.password = '*****'
                console.error('Request Body:', JSON.stringify(safeBody))
            }
        }
    })

    next()
}

export default loggerMiddleware
