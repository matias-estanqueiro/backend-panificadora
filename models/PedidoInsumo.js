// models/PedidoInsumo.js
// Basado en funcional.md secciones 4.7 y 4.8

class DetalleInsumo {
  constructor(id, pedido_insumo_id, insumo_id, cantidad) {
    this.id = id;
    this.pedido_insumo_id = pedido_insumo_id;
    this.insumo_id = insumo_id;
    this.cantidad = cantidad;
  }
}

class PedidoInsumo {
  constructor(id, usuario_id, detalles, fecha_pedido, estado) {
    this.id = id;
    this.usuario_id = usuario_id;
    this.detalles = detalles; // Array de DetalleInsumo
    this.fecha_pedido = fecha_pedido || new Date().toISOString();
    this.estado = estado || 'PENDIENTE';
  }
}

export { DetalleInsumo, PedidoInsumo };
