import { readData, writeData } from '../lib/fs.js'

class UnidadNegocio {
  constructor(id, nombre, tipo, activo = true) {
    this.id = id
    this.nombre = nombre
    this.tipo = tipo // PLANTA | SUCURSAL | FRANQUICIA
    this.activo = activo
  }
}

export default UnidadNegocio
