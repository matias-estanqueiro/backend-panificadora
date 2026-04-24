# Pautas Técnicas y Restricciones del TP (Panificadora)

Este documento define la arquitectura, el stack tecnológico y las reglas estrictas de implementación para el trabajo práctico. GitHub Copilot debe basarse en estas reglas antes de proponer código.

## 1. Stack Tecnológico (Obligatorio)
- **Backend:** Node.js con Express.js.
- **Persistencia de Datos:** Sistema de archivos nativo utilizando un archivo `.json` como "base de datos".
- **Paradigma:** Programación Orientada a Objetos (POO).
- **Vistas:** Motor de plantillas Pug.
- **Arquitectura:** Estructura modular. Cada módulo CRUD debe estar en su propio archivo/carpeta separando responsabilidades (Rutas, Controladores, Modelos).

## 2. Requerimientos de Implementación
- **Rutas:** Implementar rutas dinámicas.
- **Middlewares:** Utilizar middlewares para validaciones y control de flujo.
- **Manejo de Errores:** Implementar validaciones de datos en la entrada y manejo de errores explícito (ej: devolver errores claros si las referencias a otros IDs no existen).
- **Testing:** Incluir pruebas documentadas del funcionamiento de los módulos.

## 3. Flujo de Trabajo y Relaciones (Reglas de Negocio Generales)
El sistema gestiona múltiples entidades de una panificadora (ej: Clientes, Productos, Pedidos). Todo módulo CRUD debe cumplir con las siguientes reglas de interacción:

### A. Crear (Alta)
- Validar que los datos obligatorios estén completos.
- Si el registro requiere referencias (Ej: Un Pedido), se debe validar que el Cliente/Sucursal y los Productos seleccionados existan en el JSON antes de guardarlo.

### B. Leer (Consulta)
- Al listar información, se deben poblar/cruzar los datos relacionados.
- **Ejemplo Panificadora:** Al mostrar un Pedido, no mostrar solo los IDs, sino incluir el nombre del Cliente y el detalle/nombres de los Productos solicitados.

### C. Actualizar (Modificación)
- Permitir modificar datos propios y referencias.
- **Ejemplo Panificadora:** Cambiar las cantidades o los productos dentro de un pedido existente.
- Siempre verificar que las nuevas referencias existan antes de guardar.

### D. Eliminar (Baja Lógica y Dependencias)
- **Restricción Crítica:** Considerar dependencias entre módulos.
- **Ejemplo Panificadora:** No eliminar físicamente un Cliente que tenga pedidos activos (aplicar bloqueo o "Baja Lógica / Soft Delete").
- Solo permitir la eliminación de un Producto si no está asociado a ningún pedido activo.