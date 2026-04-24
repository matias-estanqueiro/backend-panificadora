# Documentación Técnica: Arquitectura y Restricciones del Sistema

Este documento define las pautas arquitectónicas y técnicas obligatorias para el desarrollo del TP. Cualquier herramienta de generación de código (ej. Copilot) debe apegarse estrictamente a estas directrices.

## 1. Stack Tecnológico y Arquitectura
* **Backend:** Node.js.
* **Framework:** Express.js (manejo de rutas dinámicas y middlewares).
* **Motor de Vistas:** Pug (implementado a través de Express).
* **Paradigma:** Programación Orientada a Objetos (POO). Las entidades lógicas deben representarse como Clases.
* **Persistencia de Datos (OBLIGATORIO):** Archivos `.json` nativos (un archivo por entidad ej. `data/db.json`). El sistema de archivos actuará como base de datos.
* **Formato de Intercambio:** RESTful APIs que devuelven JSON estandarizado.

## 2. Estructura Modular (Separación de Responsabilidades)
El código debe estar organizado modularmente. Cada entidad/recurso (ej. Usuarios, Pedidos) debe implementar el patrón MVC/Capas:
* `/routes`: Definición de endpoints HTTP.
* `/controllers`: Orquestación de lógica HTTP (manejo de `req` y `res`).
* `/services` (o `/models`): Lógica de negocio (POO) y acceso de lectura/escritura a los archivos JSON.

## 3. Especificación Transaccional y Relacional (Flujo CRUD Genérico)
Dado que persistimos en JSON plano, las relaciones relacionales (Foráneas) se manejan vía lógica de negocio en Node.js usando UUIDs (`id`).

### 3.1 Operación de Alta (Create)
* **Validación de Entrada:** Todos los endpoints `POST` deben verificar que el payload contenga los datos obligatorios.
* **Validación Referencial:** Antes de guardar en el JSON, el controlador debe verificar que todas las referencias cruzadas existan.
    * *Ejemplo:* Si se crea un `Pedido`, validar que el `unidad_negocio_id` y cada `producto_id` existan en la "base de datos" JSON y tengan el flag `activo: true`. Fallar con código HTTP 400 o 404 en caso contrario.
* **Congelamiento de Datos:** Al insertar un `DetallePedido`, se debe copiar el precio actual del producto (evaluando si corresponde precio de costo o franquicia) hacia la línea de detalle para que quede inmutable ante futuros cambios de precio en el catálogo.

### 3.2 Operaciones de Lectura (Read)
* **Poblado de Relaciones (Join Lógico):** Los endpoints `GET` que devuelvan entidades compuestas deben inyectar la información relacionada en la respuesta JSON.
    * *Ejemplo:* Al consultar un Pedido, la respuesta no debe tener solo un array de `producto_id`, sino que el servicio debe buscar en el JSON de productos e inyectar el nombre de cada panificado en la salida.

### 3.3 Operaciones de Actualización (Update)
* **Verificación de Estado:** Bloquear actualizaciones (PUT/PATCH) mediante código `409 Conflict` si la máquina de estados no lo permite (ej. intentar modificar un pedido que ya está `EN_PRODUCCION`).
* **Validación:** Igual que en el Alta, cualquier nueva referencia agregada durante la edición debe validarse contra el archivo JSON.

### 3.4 Operaciones de Baja (Delete)
* **Dependencias Críticas:** Implementar lógica para prevenir la eliminación de registros "padre" que tengan registros "hijo".
    * *Ejemplo:* Retornar `409 Conflict` si se intenta borrar un `Cliente/UnidadNegocio` que tiene pedidos activos.
* **Baja Lógica (Soft Delete):** Para catálogos críticos (Productos, Insumos), la operación `DELETE` no debe remover físicamente el objeto del JSON, sino actualizar su propiedad `activo` a `false`.

## 4. Manejo de Errores Estandarizado
Toda excepción o falla de validación debe ser atrapada (idealmente por un middleware global) y devolver un formato JSON estricto:
```json
{
  "error": true,
  "codigo_http": 400,
  "mensaje": "Descripción clara del error de validación o dependencia"
}