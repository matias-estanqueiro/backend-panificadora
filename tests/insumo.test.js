import request from 'supertest'
import app from '../app.js'
import { limpiarData } from './helpers/limpiarData.js'

beforeAll(async () => {
  await limpiarData();
})

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

  describe('POST /api/insumos', () => {
    test('crea un insumo exitosamente', async () => {
      const res = await request(app)
        .post('/api/insumos')
        .send({ nombre: 'Azúcar', unidad_medida: 'KG', stock_actual: 5, punto_pedido: 1 })
      expect(res.status).toBe(201)
      expect(res.body.insumo.nombre).toBe('Azúcar')
      expect(res.body.insumo.codigo).toBe('AZUCAR')
    })

    test('con datos inválidos debe devolver 400', async () => {
      const res = await request(app)
        .post('/api/insumos')
        .send({ nombre: '!!', unidad_medida: 'INVALID', stock_actual: -1, punto_pedido: -2 })
      expect(res.status).toBe(400)
    })

    test('con nombre duplicado (activo) debe devolver 409', async () => {
      await request(app).post('/api/insumos').send({ nombre: 'Duplicado', unidad_medida: 'KG', stock_actual: 1, punto_pedido: 1 })
      const res = await request(app).post('/api/insumos').send({ nombre: 'Duplicado', unidad_medida: 'KG', stock_actual: 2, punto_pedido: 2 })
      expect(res.status).toBe(409)
    })

    test('realiza un auto-upsert (resurrección) si el insumo existe pero está inactivo', async () => {
      // 1. Crear y borrar insumo
      const resPost = await request(app).post('/api/insumos').send({ nombre: 'Fenix Insumo', unidad_medida: 'LTS', stock_actual: 10, punto_pedido: 5 });
      const id = resPost.body.insumo.id;
      await request(app).delete(`/api/insumos/${id}`);

      // 2. Resucitarlo
      const resResurrect = await request(app).post('/api/insumos').send({ nombre: 'Fenix Insumo', unidad_medida: 'LTS', stock_actual: 20, punto_pedido: 10 });
      expect(resResurrect.status).toBe(200);
      expect(resResurrect.body.insumo.activo).toBe(true);
      expect(resResurrect.body.insumo.stock_actual).toBe(20);
    })
  })

  describe('PUT /api/insumos/:id', () => {
    test('actualiza un insumo exitosamente', async () => {
      const id = await crearInsumo()
      const res = await request(app)
        .put(`/api/insumos/${id}`)
        .send({ nombre: 'Insumo Actualizado', unidad_medida: 'KG', stock_actual: 99, punto_pedido: 5 })
      expect(res.status).toBe(200)
      expect(res.body.insumo.nombre).toBe('Insumo Actualizado')
      expect(res.body.insumo.codigo).toBe('INSUMO-ACTUALIZADO')
      expect(res.body.insumo.stock_actual).toBe(99)
    })

    test('con nombre duplicado debe devolver 409', async () => {
      await request(app).post('/api/insumos').send({ nombre: 'Original', unidad_medida: 'KG', stock_actual: 1, punto_pedido: 1 })
      const res2 = await request(app).post('/api/insumos').send({ nombre: 'Otro', unidad_medida: 'KG', stock_actual: 2, punto_pedido: 2 })
      
      const res = await request(app)
        .put(`/api/insumos/${res2.body.insumo.id}`)
        .send({ nombre: 'Original', unidad_medida: 'KG', stock_actual: 2, punto_pedido: 2 })
      expect(res.status).toBe(409)
    })

    test('retorna 409 si se intenta editar un insumo inactivo', async () => {
      const resPost = await request(app).post('/api/insumos').send({ nombre: 'Fantasma', unidad_medida: 'UN', stock_actual: 10, punto_pedido: 5 });
      const id = resPost.body.insumo.id;
      await request(app).delete(`/api/insumos/${id}`);

      // Payload completo para pasar Zod
      const resPut = await request(app)
        .put(`/api/insumos/${id}`)
        .send({ nombre: 'Fantasma Editado', unidad_medida: 'UN', stock_actual: 50, punto_pedido: 20 });
      expect(resPut.status).toBe(409);
    })
  })

  describe('DELETE /api/insumos/:id', () => {
    test('debe hacer baja lógica y status 200', async () => {
      const id = await crearInsumo()
      const res = await request(app).delete(`/api/insumos/${id}`)
      expect(res.status).toBe(200)
      
      const resGet = await request(app).get(`/api/insumos/${id}`)
      expect(resGet.body.activo).toBe(false)
    })

    test('con ID inválido debe devolver 404', async () => {
      const res = await request(app).delete('/api/insumos/id-inexistente')
      expect(res.status).toBe(404)
    })
  })
})
