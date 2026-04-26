import { writeData } from '../../lib/fs.js';

export async function limpiarData() {
  await Promise.all([
    writeData('usuarios', []),
    writeData('unidadesNegocio', []),
    writeData('productos', []),
    writeData('insumos', []),
    writeData('pedidos', [])
  ]);
}
