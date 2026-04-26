
import request from 'supertest'
import app from '../app.js'
import { limpiarData } from './helpers/limpiarData.js'

beforeAll(async () => {
  await limpiarData();
})

// Utilidad para crear un insumo antes de testear DELETE
const crearInsumo = async () => {
  const res = await request(app)
    .post('/api/insumos')
    .send({ nombre: 'TestInsumo', unidad_medida: 'KG', stock_actual: 10, punto_pedido: 2 })
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
      .send({ nombre: 'Azúcar', unidad_medida: 'KG', stock_actual: 5, punto_pedido: 1 })
    expect(res.status).toBe(201)
    expect(res.body.insumo).toBeDefined()
    expect(res.body.insumo.nombre).toBe('Azúcar')
    expect(res.body.insumo.codigo).toBeDefined()
    expect(typeof res.body.insumo.codigo).toBe('string')
    expect(res.body.insumo.codigo).toBe('AZUCAR')
    expect(res.body.insumo.activo).toBe(true)
  })

  test('POST /api/insumos con datos inválidos debe devolver 400', async () => {
    const res = await request(app)
      .post('/api/insumos')
      .send({ nombre: '!!', unidad_medida: 'INVALID', stock_actual: -1, punto_pedido: -2 })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: true,
      codigo_http: 400,
      mensaje: 'Errores de validación',
      detalles: expect.any(Array)
    })
  })

  test('POST /api/insumos con nombre duplicado debe devolver 409', async () => {
    // Crear el primero
    await request(app)
      .post('/api/insumos')
      .send({ nombre: 'Duplicado', unidad_medida: 'KG', stock_actual: 1, punto_pedido: 1 })
    // Intentar crear el duplicado
    const res = await request(app)
      .post('/api/insumos')
      .send({ nombre: 'Duplicado', unidad_medida: 'KG', stock_actual: 2, punto_pedido: 2 })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
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
      .send({ nombre: 'Insumo Actualizado', unidad_medida: 'KG', stock_actual: 99, punto_pedido: 5 })
    expect(res.status).toBe(200)
    expect(res.body.insumo).toBeDefined()
    expect(res.body.insumo.nombre).toBe('Insumo Actualizado')
    expect(res.body.insumo.codigo).toBe('INSUMO-ACTUALIZADO')
    expect(res.body.insumo.stock_actual).toBe(99)
  })

  test('PUT /api/insumos/:id con nombre duplicado debe devolver 409', async () => {
    // Crear dos insumos con los campos correctos
    const res1 = await request(app)
      .post('/api/insumos')
      .send({ nombre: 'Original', unidad_medida: 'KG', stock_actual: 1, punto_pedido: 1 })
    const res2 = await request(app)
      .post('/api/insumos')
      .send({ nombre: 'Otro', unidad_medida: 'KG', stock_actual: 2, punto_pedido: 2 })
    // Intentar actualizar el segundo con el nombre del primero
    const res = await request(app)
      .put(`/api/insumos/${res2.body.insumo.id}`)
      .send({ nombre: 'Original', unidad_medida: 'KG', stock_actual: 2, punto_pedido: 2 })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
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
