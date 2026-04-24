import request from 'supertest'
import app from '../app.js'

const crearProducto = async () => {
  const res = await request(app)
    .post('/api/productos')
    .send({ nombre: 'TestProducto', precio_costo: 10, precio_franquicia: 15 })
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
      .send({ nombre: 'Pan de Molde', precio_costo: 20, precio_franquicia: 30 })
    expect(res.status).toBe(201)
    expect(res.body.producto).toBeDefined()
    expect(res.body.producto.nombre).toBe('Pan de Molde')
    expect(res.body.producto.codigo).toBeDefined()
    expect(typeof res.body.producto.codigo).toBe('string')
    expect(res.body.producto.codigo).toBe('PAN-DE-MOLDE')
    expect(res.body.producto.activo).toBe(true)
  })

  test('POST /api/productos con datos inválidos debe devolver 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: '!!', precio_costo: -1, precio_franquicia: 0 })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: true,
      codigo_http: 400,
      mensaje: 'Errores de validación',
      detalles: expect.any(Array)
    })
  })

  test('POST /api/productos con nombre duplicado debe devolver 409', async () => {
    await request(app)
      .post('/api/productos')
      .send({ nombre: 'Duplicado', precio_costo: 1, precio_franquicia: 2 })
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Duplicado', precio_costo: 2, precio_franquicia: 3 })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
  })

  // ...existing code...
  test('PUT /api/productos/:id debe actualizar un producto exitosamente', async () => {
    const res1 = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Original', precio_costo: 10, precio_franquicia: 20 })
    const id = res1.body.producto.id
    const res = await request(app)
      .put(`/api/productos/${id}`)
      .send({ nombre: 'Producto Actualizado', precio_costo: 99, precio_franquicia: 20 })
    expect(res.status).toBe(200)
    expect(res.body.producto).toBeDefined()
    expect(res.body.producto.nombre).toBe('Producto Actualizado')
    expect(res.body.producto.codigo).toBe('PRODUCTO-ACTUALIZADO')
    expect(res.body.producto.precio_costo).toBe(99)
  })

  test('PUT /api/productos/:id con nombre duplicado debe devolver 409', async () => {
    const res1 = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Original', unidad: 'kg', precio_costo: 1, precio_franquicia: 2 })
    const res2 = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Otro', unidad: 'kg', precio_costo: 2, precio_franquicia: 3 })
    const res = await request(app)
      .put(`/api/productos/${res2.body.producto.id}`)
      .send({ nombre: 'Original' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: true,
      codigo_http: 409,
      mensaje: expect.any(String)
    })
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
