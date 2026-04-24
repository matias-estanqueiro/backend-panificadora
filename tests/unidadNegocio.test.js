import request from 'supertest'
import app from '../app.js'

const crearUnidadNegocio = async () => {
  const res = await request(app)
    .post('/api/unidadesNegocio')
    .send({ nombre: 'TestUnidad', tipo: 'SUCURSAL_PROPIA', direccion: 'Calle 123', activo: true })
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
      .send({ nombre: 'Sucursal Centro', tipo: 'SUCURSAL_PROPIA', direccion: 'Av. Principal 456', activo: true })
    expect(res.status).toBe(201)
    expect(res.body.unidad).toBeDefined()
    expect(res.body.unidad.nombre).toBe('Sucursal Centro')
    expect(res.body.unidad.codigo).toBeDefined()
    expect(typeof res.body.unidad.codigo).toBe('string')
    expect(res.body.unidad.codigo).toBe('SUCURSAL-CENTRO')
    expect(res.body.unidad.activo).toBe(true)
  })

  test('POST /api/unidadesNegocio con datos inválidos debe devolver 400', async () => {
    const res = await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: '!!', tipo: 'INVALID', direccion: 'a' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: true,
      codigo_http: 400,
      mensaje: 'Errores de validación',
      detalles: expect.any(Array)
    })
  })

  test('POST /api/unidadesNegocio con nombre duplicado debe devolver 409', async () => {
    await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: 'Duplicado', tipo: 'PLANTA_CENTRAL', direccion: 'Calle 1', activo: true })
    const res = await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: 'Duplicado', tipo: 'SUCURSAL_PROPIA', direccion: 'Calle 2', activo: true })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
  })
  test('PUT /api/unidadesNegocio/:id debe actualizar una unidad exitosamente', async () => {
    const res1 = await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: 'Unidad Original', tipo: 'SUCURSAL_PROPIA', direccion: 'Calle 1', activo: true })
    const id = res1.body.unidad.id
    const res = await request(app)
      .put(`/api/unidadesNegocio/${id}`)
      .send({ nombre: 'Unidad Actualizada', tipo: 'PLANTA_CENTRAL', direccion: 'Calle 2', activo: true })
    expect(res.status).toBe(200)
    expect(res.body.unidad).toBeDefined()
    expect(res.body.unidad.nombre).toBe('Unidad Actualizada')
    expect(res.body.unidad.codigo).toBe('UNIDAD-ACTUALIZADA')
    expect(res.body.unidad.tipo).toBe('PLANTA_CENTRAL')
  })

  test('PUT /api/unidadesNegocio/:id con nombre duplicado debe devolver 409', async () => {
    const res1 = await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: 'Original', tipo: 'SUCURSAL' })
    const res2 = await request(app)
      .post('/api/unidadesNegocio')
      .send({ nombre: 'Otro', tipo: 'PLANTA' })
    const res = await request(app)
      .put(`/api/unidadesNegocio/${res2.body.unidad.id}`)
      .send({ nombre: 'Original' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
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
