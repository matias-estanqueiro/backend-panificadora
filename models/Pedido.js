// Modelo de Pedido y DetallePedido para Pedidos de Venta
// Basado en el diccionario de datos funcional y técnico

class DetallePedido {
  constructor(id, pedido_id, producto_id, cantidad, precio_unitario, subtotal) {
    this.id = id; // UUID
    this.pedido_id = pedido_id; // UUID
    this.producto_id = producto_id; // UUID
    this.cantidad = cantidad; // Number
    this.precio_unitario = precio_unitario; // Number
    this.subtotal = subtotal; // Number
  }
}

class Pedido {
  constructor(id, unidad_negocio_id, usuario_id, detalles, estado = 'PENDIENTE', fecha = new Date().toISOString()) {
    this.id = id; // UUID
    this.unidad_negocio_id = unidad_negocio_id; // UUID
    this.usuario_id = usuario_id; // UUID
    this.detalles = detalles; // Array<DetallePedido>
    // Estado: 'PENDIENTE', 'EN_PRODUCCION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'
    this.estado = estado; // Enum: 'PENDIENTE', 'EN_PRODUCCION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'
    this.fecha = fecha; // ISO String
  }
}

export { Pedido, DetallePedido };
