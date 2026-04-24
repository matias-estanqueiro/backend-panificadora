import request from 'supertest'
import app from '../app.js'

const crearProducto = async () => {
  const res = await request(app)
    .post('/api/productos')
    .send({ nombre: 'TestProducto', unidad: 'kg', precio_costo: 10, precio_franquicia: 15 })
  return res.body.producto?.id
}

describe('Módulo Producto', () => {
  test('GET /api/productos debe devolver un array y status 200', async () => {
    const res = await request(app).get('/api/productos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('POST /api/productos debe crear un producto exitosamente', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Pan de Molde', unidad: 'unidad', precio_costo: 20, precio_franquicia: 30 })
    expect(res.status).toBe(201)
    expect(res.body.producto).toBeDefined()
    expect(res.body.producto.nombre).toBe('Pan de Molde')
    expect(res.body.producto.activo).toBe(true)
  })

  test('DELETE /api/productos/:id debe hacer baja lógica y status 200', async () => {
    const id = await crearProducto()
    const res = await request(app).delete(`/api/productos/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/dado de baja/i)
    // Verificar que el producto ahora está inactivo
    const getRes = await request(app).get(`/api/productos/${id}`)
    expect(getRes.body.activo).toBe(false)
  })

  test('DELETE /api/productos/:id con ID inválido debe devolver 404 y formato de error', async () => {
    const res = await request(app).delete('/api/productos/id-inexistente')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 404,
      mensaje: expect.any(String)
    })
  })
})
