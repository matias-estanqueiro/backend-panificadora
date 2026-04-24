// Utilidad para generar un código único a partir del nombre
export function generarCodigo(nombre) {
  return nombre
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/\s+/g, '-') // Espacios a guion
    .toUpperCase()
}
