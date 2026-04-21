import express from 'express'
import insumoRoutes from './routes/insumoRoutes.js'

const PORT = 3000
const app = express()

// middlewares
app.use(express.json())

// routes
app.use('/api/insumos', insumoRoutes)

// listen
app.listen(PORT, () => {
    console.log("Server running on PORT", PORT)
})
