import request from 'supertest';
import app from '../app.js';
import { limpiarData } from './helpers/limpiarData.js';
import { v4 as uuidv4 } from 'uuid';
import { writeData, readData } from '../lib/fs.js';

describe('Pedidos de Insumos (Abastecimiento)', () => {
  let adminId, encargadoId, insumoId, insumoId2;

  beforeEach(async () => {
    await limpiarData();
    adminId = uuidv4();
    encargadoId = uuidv4();
    insumoId = uuidv4();
    insumoId2 = uuidv4();

    // Crear un Admin Planta y un Encargado (para probar los bloqueos 403)
    await writeData('usuarios', [
      { id: adminId, nombre: 'Admin', email: 'admin@espiga.com', rol: 'ADMIN_PLANTA', unidad_negocio_id: uuidv4(), activo: true },
      { id: encargadoId, nombre: 'Encargado', email: 'encargado@espiga.com', rol: 'ENCARGADO_SUCURSAL', unidad_negocio_id: uuidv4(), activo: true }
    ]);

    // Crear dos insumos
    await writeData('insumos', [
      { id: insumoId, nombre: 'Harina', unidad_medida: 'KG', stock_actual: 10, punto_pedido: 5, activo: true },
      { id: insumoId2, nombre: 'Levadura', unidad_medida: 'KG', stock_actual: 5, punto_pedido: 2, activo: true }
    ]);
    
    await writeData('pedidosInsumos', []);
  });

  describe('POST /api/pedidos-insumos', () => {
    it('crea un pedido de insumos válido', async () => {
      const res = await request(app)
        .post('/api/pedidos-insumos')
        .send({
          usuario_id: adminId,
          detalles: [{ insumo_id: insumoId, cantidad: 5 }]
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.pedido).toHaveProperty('id');
      expect(res.body.pedido.detalles[0].insumo_id).toBe(insumoId);
    });

    it('retorna 403 si el usuario no es ADMIN_PLANTA', async () => {
      const res = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: encargadoId, detalles: [{ insumo_id: insumoId, cantidad: 2 }] });
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /api/pedidos-insumos', () => {
    it('devuelve los pedidos con los nombres inyectados (Join Lógico)', async () => {
      // 1. Crear pedido
      const payload = { usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 5 }] };
      const resPost = await request(app).post('/api/pedidos-insumos').send(payload);
      const pedidoId = resPost.body.pedido.id;

      // 2. Probar el GET por ID
      const resGet = await request(app).get(`/api/pedidos-insumos/${pedidoId}`);
      expect(resGet.statusCode).toBe(200);
      expect(resGet.body).toHaveProperty('usuario_nombre', 'Admin');
      expect(resGet.body.detalles[0]).toHaveProperty('insumo_nombre', 'Harina');
    });
  });

  describe('PUT /api/pedidos-insumos/:id', () => {
    it('actualiza un pedido pendiente usando reemplazo total', async () => {
      const resPost = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 5 }] });
      const pedidoId = resPost.body.pedido.id;

      const resPut = await request(app)
        .put(`/api/pedidos-insumos/${pedidoId}`)
        .send({
          usuario_id: adminId,
          detalles: [{ insumo_id: insumoId2, cantidad: 10 }] // Cambiamos harina por levadura
        });

      expect(resPut.statusCode).toBe(200);
      expect(resPut.body.pedido.detalles).toHaveLength(1);
      expect(resPut.body.pedido.detalles[0].insumo_id).toBe(insumoId2);
      expect(resPut.body.pedido.detalles[0].cantidad).toBe(10);
    });

    it('retorna 409 si se intenta modificar un pedido que ya no es PENDIENTE', async () => {
      const resPost = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 5 }] });
      const pedidoId = resPost.body.pedido.id;

      // Recibirlo para sacarlo de estado PENDIENTE
      await request(app).patch(`/api/pedidos-insumos/${pedidoId}/estado`).send({ usuario_id: adminId, estado: 'RECIBIDO' });

      // Intentar editarlo
      const resPut = await request(app)
        .put(`/api/pedidos-insumos/${pedidoId}`)
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 10 }] });
      
      expect(resPut.statusCode).toBe(409);
    });
  });

  describe('DELETE /api/pedidos-insumos/:id', () => {
    it('cancela el pedido de insumo si está PENDIENTE', async () => {
      const resPost = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 5 }] });
      const pedidoId = resPost.body.pedido.id;

      const resDel = await request(app).delete(`/api/pedidos-insumos/${pedidoId}`).send({ usuario_id: adminId });
      expect(resDel.statusCode).toBe(200);

      const pedidos = await readData('pedidosInsumos');
      expect(pedidos[0].estado).toBe('CANCELADO');
    });

    it('retorna 403 si un rol no autorizado intenta cancelar', async () => {
      const resPost = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 5 }] });
      const pedidoId = resPost.body.pedido.id;

      const resDel = await request(app).delete(`/api/pedidos-insumos/${pedidoId}`).send({ usuario_id: encargadoId });
      expect(resDel.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/pedidos-insumos/:id/estado', () => {
    it('aumenta el stock_actual del insumo al recibir el pedido', async () => {
      const pedidoRes = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 7 }] });
      const pedidoId = pedidoRes.body.pedido.id;
      
      // Cambiar estado a RECIBIDO (ahora incluye usuario_id para pasar el schema)
      const patchRes = await request(app)
        .patch(`/api/pedidos-insumos/${pedidoId}/estado`)
        .send({ usuario_id: adminId, estado: 'RECIBIDO' });
      
      expect(patchRes.statusCode).toBe(200);
      
      // Verificar stock actualizado (10 originales + 7 recibidos = 17)
      const insumos = await readData('insumos');
      const insumo = insumos.find(i => i.id === insumoId);
      expect(insumo.stock_actual).toBe(17);
    });

    it('no permite duplicar el stock si el pedido ya fue recibido', async () => {
      const pedidoRes = await request(app)
        .post('/api/pedidos-insumos')
        .send({ usuario_id: adminId, detalles: [{ insumo_id: insumoId, cantidad: 3 }] });
      const pedidoId = pedidoRes.body.pedido.id;
      
      await request(app)
        .patch(`/api/pedidos-insumos/${pedidoId}/estado`)
        .send({ usuario_id: adminId, estado: 'RECIBIDO' });
        
      // Intentar recibir de nuevo
      const patchRes = await request(app)
        .patch(`/api/pedidos-insumos/${pedidoId}/estado`)
        .send({ usuario_id: adminId, estado: 'RECIBIDO' });
        
      expect(patchRes.statusCode).toBe(409);
      expect(patchRes.body.error).toBe(true);
    });
  });
});