# Documentación Técnica: Arquitectura y Restricciones del Sistema

Este documento define las pautas arquitectónicas y técnicas obligatorias para el desarrollo del TP. Cualquier herramienta de generación de código debe apegarse estrictamente a estas directrices.

## 1. Stack Tecnológico y Arquitectura
* **Backend:** Node.js.
* **Framework:** Express.js (manejo de rutas dinámicas y middlewares).
* **Motor de Vistas:** Pug (implementado a través de Express).
* **Paradigma:** Programación Orientada a Objetos (POO). Las entidades lógicas deben representarse como Clases.
* **Persistencia de Datos (OBLIGATORIO):** Archivos `.json` nativos (un archivo por colección). El wrapper asíncrono `lib/fs.js` actúa como ORM/Controlador de persistencia. No se utiliza `fs` nativo en controladores.
* **Formato de Intercambio:** RESTful APIs que devuelven JSON estandarizado.

## 2. Estructura Modular (Separación de Responsabilidades)
El código debe estar organizado modularmente. Cada entidad/recurso implementa el patrón MVC/Capas:
* `/routes`: Definición de endpoints HTTP.
* `/controllers`: Orquestación de lógica HTTP (manejo de `req` y `res`).
* `/lib`: Utilidades core (wrapper de `fs.js` y diccionarios de esquemas `schemas.js`).
* `/models`: Definición de clases de dominio (POO).

## 3. Especificación Transaccional y Validaciones

### 3.1 Validación Estricta y Simetría de Esquemas (Zod)
* Todos los controladores deben validar la estructura del `req.body` utilizando **Zod** antes de cualquier lógica de negocio.
* **Simetría de Seguridad:** Todas las operaciones que muten el estado del sistema (`POST`, `PUT`, `PATCH`, `DELETE`) deben obligatoriamente requerir el campo `usuario_id` en el esquema de validación para garantizar trazabilidad y ejecución de reglas RBAC.

### 3.2 Operación de Alta (Create)
* **Validación Referencial:** Antes de guardar en el JSON, verificar que todas las referencias cruzadas existan y estén activas (`activo !== false`).
* **Congelamiento de Datos:** Al insertar transacciones (ej. `DetallePedido`), se debe copiar el precio actual del catálogo hacia la línea de detalle para que quede inmutable ante futuros cambios de precio.
* **Patrón de Auto-Upsert (Resurrección):** Si la validación de unicidad detecta un registro duplicado (por email o código) pero dicho registro se encuentra dado de baja lógica (`activo: false`), el sistema debe reactivarlo (`activo: true`), sobreescribir sus datos con el nuevo payload y retornar un `200 OK` (no un 201).
* **Inferencia de Relaciones:** En operaciones transaccionales como Pedidos, la unidad de negocio originaria no debe viajar en el payload HTTP; debe inferirse de forma segura en el backend a partir del `usuario_id` validado.

### 3.3 Operaciones de Lectura (Read) y Joins Lógicos
* Los endpoints `GET` que devuelvan entidades compuestas deben inyectar la información relacionada en la respuesta JSON (ej. inyectar `usuario_nombre` e `insumo_nombre` resolviéndolos asíncronamente en el controlador).

### 3.4 Operaciones de Actualización (Update)
* **Bloqueo por Inactividad:** Retornar `409 Conflict` si se intenta ejecutar un `PUT` o `PATCH` sobre cualquier entidad de catálogo (Producto, Usuario, etc.) cuyo estado actual sea inactivo (`activo: false`).
* **Verificación de Máquina de Estados:** Bloquear actualizaciones en transacciones mediante código `409 Conflict` si el estado de la entidad no permite modificaciones (ej. distinto de `PENDIENTE`).
* **Patrón de Reemplazo Total:** Las peticiones `PUT` aplican un reemplazo destructivo sobre los arrays hijos (ej. `detalles`). No se realizan fusiones; el array recibido sobrescribe íntegramente al almacenado.

### 3.5 Operaciones de Baja (Delete)
* **Baja Lógica (Soft Delete):** La operación `DELETE` no remueve físicamente el objeto del JSON. Actualiza su propiedad `activo` a `false` (en catálogos) o su estado a `CANCELADO` (en transacciones).
* **Dependencias Críticas:** Retornar `409 Conflict` si se intenta dar de baja una entidad "padre" que posee dependencias activas (ej. Unidad de Negocio con pedidos pendientes).

## 4. Manejo de Errores Estandarizado
Toda excepción o falla de validación (400, 403, 404, 409, 500) debe devolver un formato JSON estricto:
```json
{
  "error": true,
  "codigo_http": 400,
  "mensaje": "Descripción clara del error de negocio o validación"
}