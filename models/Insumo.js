import { readData, writeData } from '../lib/fs.js'
class Insumo {
    constructor(id, nombre, codigo, unidad_medida, stock_actual, punto_pedido, activo = true) {
        this.id = id;
        this.nombre = nombre;
        this.codigo = codigo;
        this.unidad_medida = unidad_medida;
        this.stock_actual = stock_actual;
        this.punto_pedido = punto_pedido;
        this.activo = activo;
    }
}

export default Insumo
