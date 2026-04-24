import request from 'supertest'
import app from '../app.js'

const crearUnidadNegocio = async () => {
  const res = await request(app)
    .post('/api/unidadesNegocio')
    .send({ nombre: 'TestUnidad', tipo: 'SUCURSAL' })
  return res.body.unidad?.id
}

describe('Módulo UnidadNegocio', () => {
  test('GET /api/unidadesNegocio debe devolver un array y status 200', async () => {
    const res = await request(app).get('/api/unidadesNegocio')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('POST /api/unidadesNegocio debe crear una unidad exitosamente', async () => {
    const res = await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: 'Sucursal Centro', tipo: 'SUCURSAL' })
    expect(res.status).toBe(201)
    expect(res.body.unidad).toBeDefined()
    expect(res.body.unidad.nombre).toBe('Sucursal Centro')
    expect(res.body.unidad.activo).toBe(true)
  })

  test('DELETE /api/unidadesNegocio/:id debe hacer baja lógica y status 200', async () => {
    const id = await crearUnidadNegocio()
    const res = await request(app).delete(`/api/unidadesNegocio/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/dada de baja/i)
    // Verificar que la unidad ahora está inactiva
    const getRes = await request(app).get(`/api/unidadesNegocio/${id}`)
    expect(getRes.body.activo).toBe(false)
  })

  test('DELETE /api/unidadesNegocio/:id con ID inválido debe devolver 404 y formato de error', async () => {
    const res = await request(app).delete('/api/unidadesNegocio/id-inexistente')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 404,
      mensaje: expect.any(String)
    })
  })
})
