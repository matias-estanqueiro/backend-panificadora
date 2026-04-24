import express from 'express'
import insumoRoutes from './routes/insumoRoutes.js'
import productoRoutes from './routes/productoRoutes.js'
import unidadNegocioRoutes from './routes/unidadNegocioRoutes.js'
import usuarioRoutes from './routes/usuarioRoutes.js'

const PORT = 3000
const app = express()

// middlewares
app.use(express.json())

// routes
app.use('/api/insumos', insumoRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/unidadesNegocio', unidadNegocioRoutes)
app.use('/api/usuarios', usuarioRoutes)

// 1. EXPORTAMOS la app para que Supertest pueda inyectar peticiones
export default app;

// 2. CONDICIONAMOS el listen para que no bloquee el puerto durante los tests
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log("Server running on PORT", PORT)
    })
}
