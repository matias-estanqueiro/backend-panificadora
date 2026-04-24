
class Insumo {
    constructor(id, nombre, unidad, cantidad, activo = true) {
        this.id = id;
        this.nombre = nombre;
        this.unidad = unidad;
        this.cantidad = cantidad;
        this.activo = activo;
    }
}

export default Insumo
