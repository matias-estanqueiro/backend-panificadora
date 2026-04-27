// controllers/pedidoController.js
import { 
  pedidoVentaPayloadSchema, 
  pedidoVentaUpdateSchema, 
  pedidoCambioEstadoSchema,
  pedidoVentaDeleteSchema // Importado para simetría y validación
} from '../lib/schemas.js';
import { readData, writeData } from '../lib/fs.js';
import { Pedido, DetallePedido } from '../models/Pedido.js';
import { v4 as uuidv4 } from 'uuid';

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
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido con ID ${req.params.id} no fue encontrado.` });
    }
    
    res.json(enrichPedido(pedido, usuarios, unidades, productos));
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al obtener el pedido.' });
  }
};

// POST /pedidos
const addPedido = async (req, res) => {
  try {
    const parsed = pedidoVentaPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { unidad_negocio_id, usuario_id, detalles } = parsed.data;

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
    
    // Validación de pertenencia
    if (usuario.unidad_negocio_id !== unidad_negocio_id) {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El usuario no pertenece a la unidad de negocio indicada.' });
    }

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
      }
      
      const subtotal = precio * item.cantidad;
      detallesPedido.push(new DetallePedido(uuidv4(), pedido_id, item.producto_id, item.cantidad, precio, subtotal));
    }

    const pedidos = await readData('pedidos');
    const pedido = new Pedido(pedido_id, unidad_negocio_id, usuario_id, detallesPedido);
    
    await writeData('pedidos', [...pedidos, pedido]);
    res.status(201).json({ mensaje: `El pedido con ID ${pedido_id} ha sido creado exitosamente.`, pedido });
    
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
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido con ID ${req.params.id} no fue encontrado.` });
    }
    
    const pedido = pedidos[idx];
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El pedido no se puede modificar en su estado actual.' });
    }
    
    // Validación con el nuevo esquema que incluye usuario_id
    const parsed = pedidoVentaUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    
    const { usuario_id, detalles } = parsed.data;

    // Validación RBAC básica: ¿Existe el usuario que intenta editar?
    const usuarios = await readData('usuarios');
    const usuarioEditor = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    if (!usuarioEditor) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario editor no encontrado o inactivo.' });
    }

    // Si el usuario no es ADMIN_PLANTA, solo puede editar sus propios pedidos
    if (usuarioEditor.rol !== 'ADMIN_PLANTA' && pedido.usuario_id !== usuario_id) {
        return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'No tiene permisos para editar este pedido.' });
    }

    const productos = await readData('productos');
    const unidades = await readData('unidadesNegocio');
    const unidad = unidades.find(u => u.id === pedido.unidad_negocio_id);
    
    const nuevosDetalles = [];
    for (const item of detalles) {
      const producto = productos.find(p => p.id === item.producto_id && p.activo !== false);
      if (!producto) {
        return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El producto con ID ${item.producto_id} no fue encontrado o está inactivo.` });
      }
      
      let precio;
      if (unidad.tipo === 'SUCURSAL_PROPIA' || unidad.tipo === 'PLANTA_CENTRAL') {
        precio = producto.precio_costo;
      } else if (unidad.tipo === 'FRANQUICIA') {
        precio = producto.precio_franquicia;
      }
      
      const subtotal = precio * item.cantidad;
      nuevosDetalles.push(new DetallePedido(uuidv4(), pedido.id, item.producto_id, item.cantidad, precio, subtotal));
    }
    
    pedido.detalles = nuevosDetalles;
    pedidos[idx] = pedido;
    await writeData('pedidos', pedidos);
    
    res.status(200).json({ mensaje: `El pedido con ID ${req.params.id} ha sido actualizado exitosamente.`, pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: `Error al actualizar el pedido con ID ${req.params.id}.` });
  }
};

// DELETE /pedidos/:id
const deletePedido = async (req, res) => {
  try {
    // 1. Validar body con el nuevo esquema
    const parsed = pedidoVentaDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { usuario_id } = parsed.data;

    const pedidos = await readData('pedidos');
    const idx = pedidos.findIndex(p => p.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido con ID ${req.params.id} no fue encontrado.` });
    }
    
    const pedido = pedidos[idx];
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: `El pedido con ID ${req.params.id} no se puede cancelar en su estado actual.` });
    }

    // 2. Validar RBAC para cancelación
    const usuarios = await readData('usuarios');
    const usuarioCancela = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    
    if (!usuarioCancela) {
        return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
    }

    // Solo el creador o un Admin Planta pueden cancelar
    if (usuarioCancela.rol !== 'ADMIN_PLANTA' && pedido.usuario_id !== usuario_id) {
        return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'No tiene permisos para cancelar este pedido.' });
    }
    
    pedido.estado = 'CANCELADO';
    pedidos[idx] = pedido;
    await writeData('pedidos', pedidos);
    
    res.status(200).json({ mensaje: `El pedido con ID ${req.params.id} ha sido cancelado exitosamente.`, pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: `Error al cancelar el pedido con ID ${req.params.id}.` });
  }
};

// PATCH /api/pedidos/:id/estado
const patchPedidoEstado = async (req, res) => {
  const parsed = pedidoCambioEstadoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
  }
  const { usuario_id, estado } = parsed.data;

  const usuarios = await readData('usuarios');
  const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
  if (!usuario) {
    return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El usuario con ID ${usuario_id} no fue encontrado o está inactivo.` });
  }
  if (usuario.rol !== 'ADMIN_PLANTA') {
    return res.status(403).json({ error: true, codigo_http: 403, mensaje: `Acceso denegado. Solo un administrador de planta puede cambiar el estado del pedido.` });
  }

  const pedidos = await readData('pedidos');
  const idx = pedidos.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido con ID ${req.params.id} no fue encontrado.` });
  }
  const pedido = pedidos[idx];
  if (pedido.estado === 'CANCELADO') {
    return res.status(409).json({ error: true, codigo_http: 409, mensaje: `No se puede cambiar el estado del pedido porque está cancelado.` });
  }

  pedido.estado = estado;
  pedidos[idx] = pedido;
  await writeData('pedidos', pedidos);
  res.status(200).json(pedido);
};

export { getPedidos, getPedido, addPedido, updatePedido, deletePedido, patchPedidoEstado };