import { readData, writeData } from '../lib/fs.js'

class Producto {
  constructor(id, nombre, unidad, precio_costo, precio_franquicia, activo = true) {
    this.id = id
    this.nombre = nombre
    this.unidad = unidad
    this.precio_costo = precio_costo
    this.precio_franquicia = precio_franquicia
    this.activo = activo
  }
}

export default Producto
