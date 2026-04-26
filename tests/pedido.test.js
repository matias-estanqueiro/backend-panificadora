import request from 'supertest';
import app from '../app.js';
import { limpiarData } from './helpers/limpiarData.js';
import { v4 as uuidv4 } from 'uuid';
import { writeData, readData } from '../lib/fs.js';

let unidadId, unidadId2, usuarioId, usuarioId2, producto1Id, producto2Id;

beforeEach(async () => {
  await limpiarData();
  
  // Generar UUIDs reales para la prueba
  unidadId = uuidv4();
  unidadId2 = uuidv4();
  usuarioId = uuidv4();
  usuarioId2 = uuidv4();
  producto1Id = uuidv4();
  producto2Id = uuidv4();

  // 1. Sembrar Unidades de Negocio
  await writeData('unidadesNegocio', [
    { id: unidadId, nombre: 'Sucursal 1', tipo: 'SUCURSAL_PROPIA', activo: true },
    { id: unidadId2, nombre: 'Franquicia 1', tipo: 'FRANQUICIA', activo: true }
  ]);
  
  // 2. Sembrar Usuarios
  await writeData('usuarios', [
    { id: usuarioId, nombre: 'Juan', unidad_negocio_id: unidadId, activo: true },
    { id: usuarioId2, nombre: 'Ana', unidad_negocio_id: unidadId2, activo: true }
  ]);
  
  // 3. Sembrar Productos
  await writeData('productos', [
    { id: producto1Id, nombre: 'Pan', precio_costo: 10, precio_franquicia: 15, activo: true },
    { id: producto2Id, nombre: 'Facturas', precio_costo: 20, precio_franquicia: 25, activo: true }
  ]);
});

describe('POST /api/pedidos', () => {
  it('crea un pedido exitosamente calculando subtotales', async () => {
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: usuarioId,
      detalles: [
        { producto_id: producto1Id, cantidad: 2 },
        { producto_id: producto2Id, cantidad: 1 }
      ]
    };
    
    const res = await request(app).post('/api/pedidos').send(payload);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.pedido).toHaveProperty('id');
    expect(res.body.pedido.detalles).toHaveLength(2);
    // Verifica que el controlador calculó el subtotal internamente
    expect(res.body.pedido.detalles[0]).toHaveProperty('subtotal'); 
  });
});

describe('GET /api/pedidos y /api/pedidos/:id', () => {
  it('devuelve los nombres inyectados en el join lógico', async () => {
    // 1. Crear el pedido
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: usuarioId,
      detalles: [ { producto_id: producto1Id, cantidad: 2 } ]
    };
    const resPost = await request(app).post('/api/pedidos').send(payload);
    const pedidoId = resPost.body.pedido.id;

    // 2. Probar el GET
    const resGet = await request(app).get(`/api/pedidos/${pedidoId}`);
    
    expect(resGet.statusCode).toBe(200);
    expect(resGet.body).toHaveProperty('nombre_unidad_negocio', 'Sucursal 1');
    expect(resGet.body).toHaveProperty('nombre_usuario', 'Juan');
    expect(resGet.body.detalles[0]).toHaveProperty('nombre_producto', 'Pan');
  });
});

describe('PUT /api/pedidos/:id', () => {
  it('actualiza un pedido usando el patrón de Reemplazo Total', async () => {
    // 1. Crear un tercer producto "al vuelo"
    const producto3Id = uuidv4();
    const productos = await readData('productos');
    productos.push({ id: producto3Id, nombre: 'Torta', precio_costo: 30, precio_franquicia: 40, activo: true });
    await writeData('productos', productos);

    // 2. Crear pedido inicial con DOS productos
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: usuarioId,
      detalles: [
        { producto_id: producto1Id, cantidad: 2 },
        { producto_id: producto2Id, cantidad: 1 }
      ]
    };
    const resPost = await request(app).post('/api/pedidos').send(payload);
    const pedidoId = resPost.body.pedido.id;

    // 3. PUT mandando un solo producto (el tercero nuevo)
    const updatePayload = {
      detalles: [ { producto_id: producto3Id, cantidad: 5 } ]
    };
    const resPut = await request(app).put(`/api/pedidos/${pedidoId}`).send(updatePayload);
    
    expect(resPut.statusCode).toBe(200);
    // El array debe tener longitud 1 demostrando que los otros 2 se eliminaron
    expect(resPut.body.pedido.detalles).toHaveLength(1);
    expect(resPut.body.pedido.detalles[0].producto_id).toBe(producto3Id);
    expect(resPut.body.pedido.detalles[0].cantidad).toBe(5);
  });

  it('retorna 409 si se intenta modificar un pedido que no está PENDIENTE', async () => {
    // 1. Crear pedido
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: usuarioId,
      detalles: [ { producto_id: producto1Id, cantidad: 1 } ]
    };
    const resPost = await request(app).post('/api/pedidos').send(payload);
    const pedidoId = resPost.body.pedido.id;

    // 2. Forzar estado a 'ENTREGADO' por detrás
    const pedidos = await readData('pedidos');
    pedidos[0].estado = 'ENTREGADO';
    await writeData('pedidos', pedidos);

    // 3. Intentar actualizar
    const updatePayload = { detalles: [ { producto_id: producto2Id, cantidad: 2 } ] };
    const resPut = await request(app).put(`/api/pedidos/${pedidoId}`).send(updatePayload);
    
    expect(resPut.statusCode).toBe(409);
    expect(resPut.body).toMatchObject({ error: true, codigo_http: 409 });
  });
});

describe('DELETE /api/pedidos/:id', () => {
  it('cancela el pedido (soft delete) si está PENDIENTE', async () => {
    // 1. Crear pedido
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: usuarioId,
      detalles: [ { producto_id: producto1Id, cantidad: 1 } ]
    };
    const resPost = await request(app).post('/api/pedidos').send(payload);
    const pedidoId = resPost.body.pedido.id;

    // 2. Borrar pedido
    const resDel = await request(app).delete(`/api/pedidos/${pedidoId}`);
    
    expect(resDel.statusCode).toBe(200);
    const pedidos = await readData('pedidos');
    expect(pedidos[0].estado).toBe('CANCELADO');
  });

  it('retorna 409 si se intenta cancelar un pedido que no está PENDIENTE', async () => {
    // 1. Crear pedido
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: usuarioId,
      detalles: [ { producto_id: producto1Id, cantidad: 1 } ]
    };
    const resPost = await request(app).post('/api/pedidos').send(payload);
    const pedidoId = resPost.body.pedido.id;

    // 2. Forzar estado a 'EN_PRODUCCION'
    const pedidos = await readData('pedidos');
    pedidos[0].estado = 'EN_PRODUCCION';
    await writeData('pedidos', pedidos);

    // 3. Intentar borrar
    const resDel = await request(app).delete(`/api/pedidos/${pedidoId}`);
    
    expect(resDel.statusCode).toBe(409);
    expect(resDel.body).toMatchObject({ error: true, codigo_http: 409 });
  });
});

describe('PATCH /api/pedidos/:id/estado', () => {
  let adminId, encargadoId, pedidoId;

  beforeEach(async () => {
    // Crear un usuario ADMIN_PLANTA y uno ENCARGADO_SUCURSAL
    adminId = uuidv4();
    encargadoId = uuidv4();
    // Agregar ambos usuarios a la base
    const usuarios = await readData('usuarios');
    usuarios.push(
      { id: adminId, nombre: 'Admin Planta', email: 'admin@planta.com', rol: 'ADMIN_PLANTA', unidad_negocio_id: unidadId, activo: true },
      { id: encargadoId, nombre: 'Encargado', email: 'encargado@sucursal.com', rol: 'ENCARGADO_SUCURSAL', unidad_negocio_id: unidadId, activo: true }
    );
    await writeData('usuarios', usuarios);

    // Crear un pedido PENDIENTE
    const payload = {
      unidad_negocio_id: unidadId,
      usuario_id: adminId,
      detalles: [ { producto_id: producto1Id, cantidad: 1 } ]
    };
    const res = await request(app).post('/api/pedidos').send(payload);
    pedidoId = res.body.pedido.id;
  });

  it('permite a un ADMIN_PLANTA cambiar el estado a EN_PRODUCCION', async () => {
    const patchPayload = {
      usuario_id: adminId,
      estado: 'EN_PRODUCCION'
    };
    const res = await request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .send(patchPayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe('EN_PRODUCCION');
  });

  it('deniega acceso a un ENCARGADO_SUCURSAL (403)', async () => {
    const patchPayload = {
      usuario_id: encargadoId,
      estado: 'EN_PRODUCCION'
    };
    const res = await request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .send(patchPayload);
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      error: true,
      codigo_http: 403,
      mensaje: expect.stringMatching(/administrador de planta/i)
    });
  });
});