import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const port = 3001

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
const dataFile = path.join(dataDir, 'employees.json')

app.use(express.json())

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]', 'utf8')
  }
}

app.get('/api/employees', (req, res) => {
  ensureDataFile()
  const employees = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  res.json(employees)
})

app.post('/api/employees', (req, res) => {
  ensureDataFile()

  const employees = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  const payload = Array.isArray(req.body) ? req.body : [req.body]
  const nextEmployees = [...employees, ...payload]

  fs.writeFileSync(dataFile, JSON.stringify(nextEmployees, null, 2), 'utf8')
  res.status(201).json({ saved: nextEmployees.length })
})

app.listen(port, () => {
  console.log(`Roster data server running on http://localhost:${port}`)
})
