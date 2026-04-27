import request from 'supertest'
import app from '../app.js'
import { limpiarData } from './helpers/limpiarData.js'

beforeAll(async () => {
  await limpiarData();
})

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

  describe('POST /api/productos', () => {
    test('crea un producto exitosamente', async () => {
      const res = await request(app)
        .post('/api/productos')
        .send({ nombre: 'Pan de Molde', precio_costo: 20, precio_franquicia: 30 })
      expect(res.status).toBe(201)
      expect(res.body.producto.nombre).toBe('Pan de Molde')
      expect(res.body.producto.codigo).toBe('PAN-DE-MOLDE')
    })

    test('con datos inválidos debe devolver 400', async () => {
      const res = await request(app)
        .post('/api/productos')
        .send({ nombre: '!!', precio_costo: -1, precio_franquicia: 0 })
      expect(res.status).toBe(400)
    })

    test('con nombre duplicado (activo) debe devolver 409', async () => {
      await request(app).post('/api/productos').send({ nombre: 'Duplicado', precio_costo: 1, precio_franquicia: 2 })
      const res = await request(app).post('/api/productos').send({ nombre: 'Duplicado', precio_costo: 2, precio_franquicia: 3 })
      expect(res.status).toBe(409)
    })

    test('realiza un auto-upsert (resurrección) si el producto existe pero está inactivo', async () => {
      // 1. Crear y borrar producto
      const resPost = await request(app).post('/api/productos').send({ nombre: 'Fenix', precio_costo: 10, precio_franquicia: 15 });
      const id = resPost.body.producto.id;
      await request(app).delete(`/api/productos/${id}`);

      // 2. Resucitarlo
      const resResurrect = await request(app).post('/api/productos').send({ nombre: 'Fenix', precio_costo: 20, precio_franquicia: 30 });
      expect(resResurrect.status).toBe(200);
      expect(resResurrect.body.producto.activo).toBe(true);
      expect(resResurrect.body.producto.precio_costo).toBe(20);
    })
  })

  describe('PUT /api/productos/:id', () => {
    test('actualiza un producto exitosamente', async () => {
      const id = await crearProducto()
      const res = await request(app)
        .put(`/api/productos/${id}`)
        .send({ nombre: 'Producto Actualizado', precio_costo: 99, precio_franquicia: 20 })
      expect(res.status).toBe(200)
      expect(res.body.producto.nombre).toBe('Producto Actualizado')
      expect(res.body.producto.codigo).toBe('PRODUCTO-ACTUALIZADO')
    })

    test('con nombre duplicado debe devolver 409', async () => {
      await request(app).post('/api/productos').send({ nombre: 'Original', precio_costo: 1, precio_franquicia: 2 })
      const res2 = await request(app).post('/api/productos').send({ nombre: 'Otro', precio_costo: 2, precio_franquicia: 3 })
      
      const res = await request(app)
        .put(`/api/productos/${res2.body.producto.id}`)
        .send({ nombre: 'Original', precio_costo: 2, precio_franquicia: 3 })
      expect(res.status).toBe(409)
    })

    test('retorna 409 si se intenta editar un producto inactivo', async () => {
      const resPost = await request(app).post('/api/productos').send({ nombre: 'Fantasma', precio_costo: 10, precio_franquicia: 15 });
      const id = resPost.body.producto.id;
      await request(app).delete(`/api/productos/${id}`);

      const resPut = await request(app)
        .put(`/api/productos/${id}`)
        .send({ nombre: 'Fantasma Editado', precio_costo: 50, precio_franquicia: 60 });
      expect(resPut.status).toBe(409);
    })
  })

  describe('DELETE /api/productos/:id', () => {
    test('debe hacer baja lógica y status 200', async () => {
      const id = await crearProducto()
      const res = await request(app).delete(`/api/productos/${id}`)
      expect(res.status).toBe(200)
      
      const resGet = await request(app).get(`/api/productos/${id}`)
      expect(resGet.body.activo).toBe(false)
    })

    test('con ID inválido debe devolver 404', async () => {
      const res = await request(app).delete('/api/productos/id-inexistente')
      expect(res.status).toBe(404)
    })
  })
})
