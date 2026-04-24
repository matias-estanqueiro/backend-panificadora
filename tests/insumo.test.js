import request from 'supertest'
import app from '../app.js'

// Utilidad para crear un insumo antes de testear DELETE
const crearInsumo = async () => {
  const res = await request(app)
    .post('/api/insumos')
    .send({ nombre: 'TestInsumo', unidad: 'kg', cantidad: 10 })
  return res.body.insumo?.id
}

describe('Módulo Insumo', () => {
  test('GET /api/insumos debe devolver un array y status 200', async () => {
    const res = await request(app).get('/api/insumos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('POST /api/insumos debe crear un insumo exitosamente', async () => {
    const res = await request(app)
      .post('/api/insumos')
      .send({ nombre: 'Azúcar', unidad: 'kg', cantidad: 5 })
    expect(res.status).toBe(201)
    expect(res.body.insumo).toBeDefined()
    expect(res.body.insumo.nombre).toBe('Azúcar')
    expect(res.body.insumo.activo).toBe(true)
  })

  test('DELETE /api/insumos/:id debe hacer baja lógica y status 200', async () => {
    const id = await crearInsumo()
    const res = await request(app).delete(`/api/insumos/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/dado de baja/i)
    // Verificar que el insumo ahora está inactivo
    const getRes = await request(app).get(`/api/insumos/${id}`)
    expect(getRes.body.activo).toBe(false)
  })


  test('PUT /api/insumos/:id debe actualizar un insumo exitosamente', async () => {
    const id = await crearInsumo()
    const res = await request(app)
      .put(`/api/insumos/${id}`)
      .send({ nombre: 'Insumo Actualizado', cantidad: 99 })
    expect(res.status).toBe(200)
    expect(res.body.insumo).toBeDefined()
    expect(res.body.insumo.nombre).toBe('Insumo Actualizado')
    expect(res.body.insumo.cantidad).toBe(99)
  })

  test('PUT /api/insumos/:id con ID inválido debe devolver 404 y formato de error', async () => {
    const res = await request(app)
      .put('/api/insumos/id-inexistente')
      .send({ nombre: 'No existe' })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 404,
      mensaje: expect.any(String)
    })
  })
})
