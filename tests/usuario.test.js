import request from 'supertest'
import app from '../app.js'

const crearUsuario = async () => {
  const res = await request(app)
    .post('/api/usuarios')
    .send({ nombre: 'TestUsuario', rol: 'ENCARGADO_SUCURSAL', unidad_negocio_id: 'test-unidad-id' })
  return res.body.usuario?.id
}

describe('Módulo Usuario', () => {
  test('GET /api/usuarios debe devolver un array y status 200', async () => {
    const res = await request(app).get('/api/usuarios')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('POST /api/usuarios debe crear un usuario exitosamente', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'Juan Pérez', rol: 'FRANQUICIADO', unidad_negocio_id: 'test-unidad-id' })
    expect(res.status).toBe(201)
    expect(res.body.usuario).toBeDefined()
    expect(res.body.usuario.nombre).toBe('Juan Pérez')
    expect(res.body.usuario.activo).toBe(true)
  })

  test('DELETE /api/usuarios/:id debe hacer baja lógica y status 200', async () => {
    const id = await crearUsuario()
    const res = await request(app).delete(`/api/usuarios/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/dado de baja/i)
    // Verificar que el usuario ahora está inactivo
    const getRes = await request(app).get(`/api/usuarios/${id}`)
    expect(getRes.body.activo).toBe(false)
  })

  test('DELETE /api/usuarios/:id con ID inválido debe devolver 404 y formato de error', async () => {
    const res = await request(app).delete('/api/usuarios/id-inexistente')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 404,
      mensaje: expect.any(String)
    })
  })
})
