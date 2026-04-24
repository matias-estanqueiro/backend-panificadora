import { readData, writeData } from '../lib/fs.js'

class UnidadNegocio {
  constructor(id, nombre, codigo, tipo, direccion, activo = true) {
    this.id = id
    this.nombre = nombre
    this.codigo = codigo
    this.tipo = tipo // PLANTA_CENTRAL | SUCURSAL_PROPIA | FRANQUICIA
    this.direccion = direccion
    this.activo = activo
  }
}

export default UnidadNegocio
