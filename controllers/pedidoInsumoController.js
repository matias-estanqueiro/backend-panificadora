// controllers/pedidoInsumoController.js
import { 
  pedidoInsumoPayloadSchema, 
  pedidoInsumoUpdateSchema, 
  pedidoInsumoCambioEstadoSchema,
  pedidoInsumoDeleteSchema 
} from '../lib/schemas.js';
import { readData, writeData } from '../lib/fs.js';
import { v4 as uuidv4 } from 'uuid';
import { PedidoInsumo, DetalleInsumo } from '../models/PedidoInsumo.js';

// GET /api/insumos/pedidos
const getPedidosInsumos = async (req, res) => {
  try {
    const pedidos = await readData('pedidosInsumos');
    const usuarios = await readData('usuarios');
    const insumos = await readData('insumos');
    
    const result = pedidos.map(p => ({
      ...p,
      usuario_nombre: (usuarios.find(u => u.id === p.usuario_id) || {}).nombre || null,
      detalles: p.detalles.map(d => ({
        ...d,
        insumo_nombre: (insumos.find(i => i.id === d.insumo_id) || {}).nombre || null
      }))
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al obtener pedidos de insumos.' });
  }
};

// GET /api/insumos/pedidos/:id
const getPedidoInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = await readData('pedidosInsumos');
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido de insumo con ID ${id} no fue encontrado.` });
    }
    
    const usuarios = await readData('usuarios');
    const insumos = await readData('insumos');
    
    const result = {
      ...pedido,
      usuario_nombre: (usuarios.find(u => u.id === pedido.usuario_id) || {}).nombre || null,
      detalles: pedido.detalles.map(d => ({
        ...d,
        insumo_nombre: (insumos.find(i => i.id === d.insumo_id) || {}).nombre || null
      }))
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error al obtener el pedido de insumo.' });
  }
};

// POST /api/insumos/pedidos
const addPedidoInsumo = async (req, res) => {
  try {
    const parsed = pedidoInsumoPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { usuario_id, detalles } = parsed.data;

    const usuarios = await readData('usuarios');
    const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    if (!usuario) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
    }
    if (usuario.rol !== 'ADMIN_PLANTA') {
      return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'Solo usuarios con rol ADMIN_PLANTA pueden crear pedidos de insumos.' });
    }

    const insumos = await readData('insumos');
    for (const d of detalles) {
      const insumo = insumos.find(i => i.id === d.insumo_id && i.activo !== false);
      if (!insumo) {
        return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El insumo con ID ${d.insumo_id} no existe o está inactivo.` });
      }
    }

    const pedidoId = uuidv4();
    const detallesObjs = detalles.map(d => new DetalleInsumo(uuidv4(), pedidoId, d.insumo_id, d.cantidad));
    const pedido = new PedidoInsumo(pedidoId, usuario_id, detallesObjs);

    const pedidos = await readData('pedidosInsumos');
    pedidos.push(pedido);
    await writeData('pedidosInsumos', pedidos);
    
    res.status(201).json({ mensaje: `El pedido de insumos con ID ${pedidoId} ha sido creado exitosamente.`, pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: 'Error interno del servidor.' });
  }
};

// PUT /api/insumos/pedidos/:id
const updatePedidoInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = await readData('pedidosInsumos');
    const idx = pedidos.findIndex(p => p.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido de insumo con ID ${id} no fue encontrado.` });
    }
    const pedido = pedidos[idx];
    
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Solo se pueden editar pedidos pendientes.' });
    }

    const parsed = pedidoInsumoUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { usuario_id, detalles } = parsed.data;
    
    const usuarios = await readData('usuarios');
    const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    if (!usuario) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
    }
    if (usuario.rol !== 'ADMIN_PLANTA') {
      return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'Solo usuarios con rol ADMIN_PLANTA pueden editar pedidos de insumos.' });
    }
    
    const insumos = await readData('insumos');
    for (const d of detalles) {
      const insumo = insumos.find(i => i.id === d.insumo_id && i.activo !== false);
      if (!insumo) {
        return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El insumo con ID ${d.insumo_id} no existe o está inactivo.` });
      }
    }
    
    // Reemplazo total de detalles
    pedido.detalles = detalles.map(d => new DetalleInsumo(uuidv4(), pedido.id, d.insumo_id, d.cantidad));
    pedidos[idx] = pedido;
    await writeData('pedidosInsumos', pedidos);
    
    res.status(200).json({ mensaje: `El pedido de insumo con ID ${id} ha sido actualizado exitosamente.`, pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: `Error al actualizar el pedido de insumo con ID ${req.params.id}.` });
  }
};

// DELETE /api/insumos/pedidos/:id
const deletePedidoInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = pedidoInsumoDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { usuario_id } = parsed.data;
    
    const usuarios = await readData('usuarios');
    const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    if (!usuario) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
    }
    if (usuario.rol !== 'ADMIN_PLANTA') {
      return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'Solo usuarios con rol ADMIN_PLANTA pueden cancelar pedidos de insumos.' });
    }
    
    const pedidos = await readData('pedidosInsumos');
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido de insumo con ID ${id} no fue encontrado.` });
    }
    const pedido = pedidos[idx];
    
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Solo se pueden cancelar pedidos pendientes.' });
    }
    
    pedido.estado = 'CANCELADO';
    pedidos[idx] = pedido;
    await writeData('pedidosInsumos', pedidos);
    
    res.status(200).json({ mensaje: `El pedido de insumo con ID ${id} ha sido cancelado exitosamente.`, pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: `Error al cancelar el pedido de insumo con ID ${req.params.id}.` });
  }
};

// PATCH /api/insumos/pedidos/:id/estado
const patchEstadoInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = pedidoInsumoCambioEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: true, codigo_http: 400, mensaje: 'Errores de validación', detalles: parsed.error.issues });
    }
    const { usuario_id, estado } = parsed.data;
    
    const usuarios = await readData('usuarios');
    const usuario = usuarios.find(u => u.id === usuario_id && u.activo !== false);
    if (!usuario) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'Usuario no encontrado o inactivo.' });
    }
    if (usuario.rol !== 'ADMIN_PLANTA') {
      return res.status(403).json({ error: true, codigo_http: 403, mensaje: 'Solo usuarios con rol ADMIN_PLANTA pueden cambiar el estado.' });
    }

    const pedidos = await readData('pedidosInsumos');
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: `El pedido de insumo con ID ${id} no fue encontrado.` });
    }
    const pedido = pedidos[idx];
    
    if (pedido.estado === 'CANCELADO') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'No se puede cambiar el estado de un pedido cancelado.' });
    }
    if (pedido.estado === 'RECIBIDO') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El pedido ya fue recibido y el stock ya fue actualizado.' });
    }
    
    // Lógica Crítica: Actualizar stock de insumos
    const insumos = await readData('insumos');
    for (const d of pedido.detalles) {
      const insumoIndex = insumos.findIndex(i => i.id === d.insumo_id);
      if (insumoIndex !== -1) {
        insumos[insumoIndex].stock_actual = (insumos[insumoIndex].stock_actual || 0) + d.cantidad;
      }
    }
    
    pedido.estado = estado; // 'RECIBIDO'
    pedidos[idx] = pedido;
    
    await Promise.all([
      writeData('insumos', insumos),
      writeData('pedidosInsumos', pedidos)
    ]);
    
    res.status(200).json({ mensaje: `El pedido de insumo con ID ${id} ha cambiado su estado a RECIBIDO exitosamente.`, pedido });
  } catch (error) {
    res.status(500).json({ error: true, codigo_http: 500, mensaje: `Error al cambiar el estado del pedido de insumo con ID ${req.params.id}.` });
  }
};

export { addPedidoInsumo, getPedidosInsumos, getPedidoInsumo, updatePedidoInsumo, deletePedidoInsumo, patchEstadoInsumo };