import request from 'supertest'
import app from '../app.js'
import { limpiarData } from './helpers/limpiarData.js'

beforeAll(async () => {
  await limpiarData();
})

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

  describe('POST /api/unidadesNegocio', () => {
    test('crea una unidad exitosamente', async () => {
      const res = await request(app)
        .post('/api/unidadesNegocio')
        .send({ nombre: 'Sucursal Centro', tipo: 'SUCURSAL_PROPIA', direccion: 'Av. Principal 456' })
      expect(res.status).toBe(201)
      expect(res.body.unidad.nombre).toBe('Sucursal Centro')
      expect(res.body.unidad.codigo).toBe('SUCURSAL-CENTRO')
    })

    test('con datos inválidos debe devolver 400', async () => {
      const res = await request(app)
        .post('/api/unidadesNegocio')
        .send({ nombre: '!!', tipo: 'INVALID', direccion: 'a' })
      expect(res.status).toBe(400)
    })

    test('con nombre duplicado (activo) debe devolver 409', async () => {
      await request(app).post('/api/unidadesNegocio').send({ nombre: 'Duplicado', tipo: 'PLANTA_CENTRAL', direccion: 'Calle 1' })
      const res = await request(app).post('/api/unidadesNegocio').send({ nombre: 'Duplicado', tipo: 'SUCURSAL_PROPIA', direccion: 'Calle 2' })
      expect(res.status).toBe(409)
    })

    test('realiza un auto-upsert (resurrección) si la unidad existe pero está inactiva', async () => {
      // 1. Crear y borrar unidad
      const resPost = await request(app).post('/api/unidadesNegocio').send({ nombre: 'Fenix Unidad', tipo: 'FRANQUICIA', direccion: 'Calle 1' });
      const id = resPost.body.unidad.id;
      await request(app).delete(`/api/unidadesNegocio/${id}`);

      // 2. Resucitarla
      const resResurrect = await request(app).post('/api/unidadesNegocio').send({ nombre: 'Fenix Unidad', tipo: 'SUCURSAL_PROPIA', direccion: 'Calle 2' });
      expect(resResurrect.status).toBe(200);
      expect(resResurrect.body.unidad.activo).toBe(true);
      expect(resResurrect.body.unidad.tipo).toBe('SUCURSAL_PROPIA');
    })
  })

  describe('PUT /api/unidadesNegocio/:id', () => {
    test('actualiza una unidad exitosamente', async () => {
      const id = await crearUnidadNegocio()
      const res = await request(app)
        .put(`/api/unidadesNegocio/${id}`)
        .send({ nombre: 'Unidad Actualizada', tipo: 'PLANTA_CENTRAL', direccion: 'Calle 2' })
      expect(res.status).toBe(200)
      expect(res.body.unidad.nombre).toBe('Unidad Actualizada')
      expect(res.body.unidad.tipo).toBe('PLANTA_CENTRAL')
    })

    test('con nombre duplicado debe devolver 409', async () => {
      await request(app).post('/api/unidadesNegocio').send({ nombre: 'Original', tipo: 'SUCURSAL_PROPIA', direccion: 'Calle 1' })
      const res2 = await request(app).post('/api/unidadesNegocio').send({ nombre: 'Otro', tipo: 'PLANTA_CENTRAL', direccion: 'Calle 2' })
      
      const res = await request(app)
        .put(`/api/unidadesNegocio/${res2.body.unidad.id}`)
        .send({ nombre: 'Original', tipo: 'PLANTA_CENTRAL', direccion: 'Calle 2' })
      expect(res.status).toBe(409)
    })

    test('retorna 409 si se intenta editar una unidad inactiva', async () => {
      const resPost = await request(app).post('/api/unidadesNegocio').send({ nombre: 'Fantasma', tipo: 'FRANQUICIA', direccion: 'Calle 1' });
      const id = resPost.body.unidad.id;
      await request(app).delete(`/api/unidadesNegocio/${id}`);

      // Payload completo para Zod
      const resPut = await request(app)
        .put(`/api/unidadesNegocio/${id}`)
        .send({ nombre: 'Fantasma Editada', tipo: 'FRANQUICIA', direccion: 'Calle 2' });
      expect(resPut.status).toBe(409);
    })
  })

  describe('DELETE /api/unidadesNegocio/:id', () => {
    test('debe hacer baja lógica y status 200', async () => {
      const id = await crearUnidadNegocio()
      const res = await request(app).delete(`/api/unidadesNegocio/${id}`)
      expect(res.status).toBe(200)
      
      const resGet = await request(app).get(`/api/unidadesNegocio/${id}`)
      expect(resGet.body.activo).toBe(false)
    })

    test('con ID inválido debe devolver 404', async () => {
      const res = await request(app).delete('/api/unidadesNegocio/id-inexistente')
      expect(res.status).toBe(404)
    })
  })
})