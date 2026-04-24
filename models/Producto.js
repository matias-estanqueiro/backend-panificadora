import { readData, writeData } from '../lib/fs.js'

class Producto {
  constructor(id, nombre, codigo, precio_costo, precio_franquicia, activo = true) {
    this.id = id
    this.nombre = nombre
    this.codigo = codigo
    this.precio_costo = precio_costo
    this.precio_franquicia = precio_franquicia
    this.activo = activo
  }
}

export default Producto
