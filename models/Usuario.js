import { readData, writeData } from '../lib/fs.js'

class Usuario {
  constructor(id, nombre, email, rol, unidad_negocio_id, activo = true) {
    this.id = id
    this.nombre = nombre
    this.email = email // obligatorio, único, normalizado
    this.rol = rol // ADMINISTRADOR | ENCARGADO_SUCURSAL | FRANQUICIADO
    this.unidad_negocio_id = unidad_negocio_id
    this.activo = activo
  }
}

export default Usuario
