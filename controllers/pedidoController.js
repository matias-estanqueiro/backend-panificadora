import { pedidoCambioEstadoSchema } from '../lib/schemas.js';
import { readData, writeData } from '../lib/fs.js';
import { Pedido, DetallePedido } from '../models/Pedido.js';
import { v4 as uuidv4 } from 'uuid';
import { pedidoVentaPayloadSchema, pedidoVentaUpdateSchema } from '../lib/schemas.js';

// Helper para join lógico de nombres
const enrichPedido = (pedido, usuarios, unidades, productos) => {
  const unidad = unidades.find(u => u.id === pedido.unidad_negocio_id);
  const usuario = usuarios.find(u => u.id === pedido.usuario_id);
  const detalles = pedido.detalles.map(det => {
    const producto = productos.find(p => p.id === det.producto_id);
    return {
      ...det,
      nombre_producto: producto ? producto.nombre : null
    };
  });
  return {
    ...pedido,
    nombre_unidad_negocio: unidad ? unidad.nombre : null,
    nombre_usuario: usuario ? usuario.nombre : null,
    detalles
  };
};

// GET /pedidos
const getPedidos = async (req, res) => {
  try {
    const pedidos = await readData('pedidos');
    const usuarios = await readData('usuarios');
    const unidades = await readData('unidadesNegocio');
    const productos = await readData('productos');
    
    const result = pedidos.map(p => enrichPedido(p, usuarios, unidades, productos));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al obtener pedidos.' });
  }
};

// GET /pedidos/:id
const getPedido = async (req, res) => {
  try {
    const pedidos = await readData('pedidos');
    const usuarios = await readData('usuarios');
    const unidades = await readData('unidadesNegocio');
    const productos = await readData('productos');
    
    const pedido = pedidos.find(p => p.id === req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Pedido no encontrado.' });
    }
    
    res.json(enrichPedido(pedido, usuarios, unidades, productos));
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al obtener el pedido.' });
  }
};

// POST /pedidos
const addPedido = async (req, res) => {
  try {
    // 1. Validación de forma
    const parsed = pedidoVentaPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { unidad_negocio_id, usuario_id, detalles } = parsed.data;

    // 2. Validación de existencia
    const usuarios = await readData('usuarios');
    const unidades = await readData('unidadesNegocio');
    const productos = await readData('productos');

    const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    if (!usuario) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
    }
    const unidad = unidades.find(u => u.id === unidad_negocio_id && u.activo !== false);
    if (!unidad) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Unidad de negocio no encontrada o inactiva.' });
    }
    if (usuario.unidad_negocio_id !== unidad_negocio_id) {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El usuario no pertenece a la unidad de negocio indicada.' });
    }

    // 3. Procesar detalles y congelar precios con for...of
    const pedido_id = uuidv4();
    const detallesPedido = [];
    
    for (const item of detalles) {
      const producto = productos.find(p => p.id === item.producto_id && p.activo !== false);
      if (!producto) {
        return res.status(404).json({ error: true, codigo_http: 404, mensaje: `Producto no encontrado o inactivo: ${item.producto_id}` });
      }
      
      let precio;
      if (unidad.tipo === 'SUCURSAL_PROPIA' || unidad.tipo === 'PLANTA_CENTRAL') {
        precio = producto.precio_costo;
      } else if (unidad.tipo === 'FRANQUICIA') {
        precio = producto.precio_franquicia;
      } else {
        return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Tipo de unidad de negocio desconocido.' });
      }
      
      const subtotal = precio * item.cantidad;
      detallesPedido.push(new DetallePedido(uuidv4(), pedido_id, item.producto_id, item.cantidad, precio, subtotal));
    }

    // 4. Instanciar Pedido y persistir
    const pedidos = await readData('pedidos');
    const pedido = new Pedido(pedido_id, unidad_negocio_id, usuario_id, detallesPedido);
    
    await writeData('pedidos', [...pedidos, pedido]);
    res.status(201).json({ mensaje: 'Pedido creado exitosamente.', pedido });
    
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error interno del servidor.' });
  }
};

// PUT /pedidos/:id
const updatePedido = async (req, res) => {
  try {
    const pedidos = await readData('pedidos');
    const idx = pedidos.findIndex(p => p.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Pedido no encontrado.' });
    }
    
    const pedido = pedidos[idx];
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El pedido no se puede modificar en su estado actual.' });
    }
    
    const parsed = pedidoVentaUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    
    const { detalles } = parsed.data;
    const productos = await readData('productos');
    const unidades = await readData('unidadesNegocio');
    const unidad = unidades.find(u => u.id === pedido.unidad_negocio_id);
    
    if (!unidad) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Unidad de negocio no encontrada.' });
    }

    const nuevosDetalles = [];
    for (const item of detalles) {
      const producto = productos.find(p => p.id === item.producto_id && p.activo !== false);
      if (!producto) {
        return res.status(404).json({ error: true, codigo_http: 404, mensaje: `Producto no encontrado o inactivo: ${item.producto_id}` });
      }
      
      let precio;
      if (unidad.tipo === 'SUCURSAL_PROPIA' || unidad.tipo === 'PLANTA_CENTRAL') {
        precio = producto.precio_costo;
      } else if (unidad.tipo === 'FRANQUICIA') {
        precio = producto.precio_franquicia;
      } else {
        return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Tipo de unidad de negocio desconocido.' });
      }
      
      const subtotal = precio * item.cantidad;
      nuevosDetalles.push(new DetallePedido(uuidv4(), pedido.id, item.producto_id, item.cantidad, precio, subtotal));
    }
    
    pedido.detalles = nuevosDetalles;
    pedidos[idx] = pedido;
    await writeData('pedidos', pedidos);
    
    res.status(200).json({ mensaje: 'Pedido actualizado exitosamente.', pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al actualizar el pedido.' });
  }
};

// DELETE /pedidos/:id
const deletePedido = async (req, res) => {
  try {
    const pedidos = await readData('pedidos');
    const idx = pedidos.findIndex(p => p.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Pedido no encontrado.' });
    }
    
    const pedido = pedidos[idx];
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El pedido no se puede cancelar en su estado actual.' });
    }
    
    pedido.estado = 'CANCELADO';
    pedidos[idx] = pedido;
    await writeData('pedidos', pedidos);
    
    res.status(200).json({ mensaje: 'Pedido cancelado exitosamente.', pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al cancelar el pedido.' });
  }
};

// PATCH /api/pedidos/:id/estado
const patchPedidoEstado = async (req, res) => {
  // 1. Validar payload
  const parsed = pedidoCambioEstadoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
  }
  const { usuario_id, estado } = parsed.data;

  // 2. Validar usuario y RBAC
  const usuarios = await readData('usuarios');
  const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
  if (!usuario) {
    return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
  }
  if (usuario.rol !== 'ADMIN_PLANTA') {
    return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'Acceso denegado. Solo un administrador de planta puede cambiar el estado del pedido.' });
  }

  // 3. Validar pedido
  const pedidos = await readData('pedidos');
  const idx = pedidos.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Pedido no encontrado.' });
  }
  const pedido = pedidos[idx];
  if (pedido.estado === 'CANCELADO') {
    return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'No se puede cambiar el estado de un pedido cancelado' });
  }

  pedido.estado = estado;
  pedidos[idx] = pedido;
  await writeData('pedidos', pedidos);
  res.status(200).json(pedido);
};

export { getPedidos, getPedido, addPedido, updatePedido, deletePedido, patchPedidoEstado };