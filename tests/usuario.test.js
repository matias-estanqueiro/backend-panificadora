
import request from 'supertest'
import app from '../app.js'
import { limpiarData } from './helpers/limpiarData.js'

beforeAll(async () => {
  await limpiarData();
})

let unidadNegocioIdValida;

const crearUsuario = async (email = 'testusuario@email.com', unidad_negocio_id = unidadNegocioIdValida) => {
  const res = await request(app)
    .post('/api/usuarios')
    .send({ nombre: 'TestUsuario', email, rol: 'ENCARGADO_SUCURSAL', unidad_negocio_id })
  return res.body.usuario?.id
}

describe('Módulo Usuario', () => {
  beforeAll(async () => {
    // Crear una unidad de negocio válida para asociar usuarios
    const res = await request(app)
      .post('/api/unidadesNegocio')
      .send({
        id: '00000000-0000-0000-0000-000000000001',
        nombre: 'Unidad Negocio Test',
        codigo: 'UNIDAD-NEGOCIO-TEST',
        tipo: 'SUCURSAL_PROPIA',
        direccion: 'Calle Test 123',
        activo: true
      })
    unidadNegocioIdValida = res.body.unidad.id
  })
  test('GET /api/usuarios debe devolver un array y status 200', async () => {
    const res = await request(app).get('/api/usuarios')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('POST /api/usuarios debe crear un usuario exitosamente', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'Juan Pérez', email: 'juan@email.com', rol: 'FRANQUICIADO', unidad_negocio_id: unidadNegocioIdValida })
    expect(res.status).toBe(201)
    expect(res.body.usuario).toBeDefined()
    expect(res.body.usuario.nombre).toBe('Juan Pérez')
    expect(res.body.usuario.email).toBe('juan@email.com')
    expect(res.body.usuario.activo).toBe(true)
  })

  test('POST /api/usuarios con datos inválidos debe devolver 400', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nombre: '!!', email: 'noesemail', rol: 'INVALID', unidad_negocio_id: '123' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: true,
      codigo_http: 400,
      mensaje: 'Errores de validación',
      detalles: expect.any(Array)
    })
  })

  test('POST /api/usuarios con email duplicado debe devolver 409', async () => {
    await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'UsuarioUno', email: 'duplicado@email.com', rol: 'FRANQUICIADO', unidad_negocio_id: unidadNegocioIdValida })
    // Payload estructuralmente perfecto para Zod
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'UsuarioDos', email: 'duplicado@email.com', rol: 'ADMIN_PLANTA', unidad_negocio_id: unidadNegocioIdValida })
    console.log('DETALLES ZOD:', res.body.detalles)
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
  })

  test('DELETE /api/usuarios/:id debe hacer baja lógica y status 200', async () => {
    const id = await crearUsuario('baja@email.com', unidadNegocioIdValida)
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
