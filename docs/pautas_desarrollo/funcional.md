# Documentación Funcional: Sistema de Gestión de Pedidos - La Espiga de Oro S.R.L.

## 1. Contexto del Negocio y Problemática
"La Espiga de Oro S.R.L." es una panificadora industrial que opera bajo una estructura matricial descentralizada. Su red comercial se divide en:
* **1 Planta Central:** Producción centralizada de masas y productos terminados.
* **5 Sucursales Propias:** Unidades internas que adquieren productos a costo operativo.
* **10 Franquicias:** Unidades externas con autonomía comercial, que compran a precio mayorista y pagan royalties.

**Problema Actual:** La captura de pedidos se realiza por canales informales (mensajería), causando visibilidad nula de la demanda, problemas de abastecimiento de materia prima y tensiones por demoras en entregas.

**Solución Propuesta:** Un sistema centralizado de registro de pedidos que integre la información entre la Planta y la red, permita consolidar la demanda para la producción y estructure las solicitudes de las franquicias.

## 2. Matriz de Actores y Control de Acceso (RBAC)
El sistema controla el acceso según el Rol del usuario y su Unidad de Negocio asociada.

### 2.1 Unidades de Negocio (Tipos)
* `PLANTA`
* `SUCURSAL`
* `FRANQUICIA`

### 2.2 Roles y Permisos (Casos de Uso)
* **A. ADMIN_PLANTA:** Personal jerárquico de la fábrica.
    * Gestiona (CRUD) Catálogos de Productos, Insumos y Unidades de Negocio.
    * Gestiona los estados de los Pedidos de Venta.
    * Genera Pedidos de Insumos (Abastecimiento).
    * Visualiza todos los reportes estratégicos.
* **B. ENCARGADO_SUCURSAL:** Operador de local propio.
    * Crea Pedidos de Venta hacia la Planta (viendo solo precios de costo).
    * Visualiza y edita exclusivamente los pedidos de su sucursal (solo si están en estado `PENDIENTE`).
* **C. FRANQUICIADO:** Operador de local externo.
    * Crea Pedidos de Venta hacia la Planta (viendo solo precios de franquicia).
    * Visualiza y edita exclusivamente los pedidos de su franquicia (solo si están `PENDIENTE`).
    * Puede visualizar su propio reporte de Royalties adeudados.

## 3. Entidades del Negocio (Modelo de Dominio Lógico)

* **UnidadNegocio:** Representa las locaciones (Planta, Sucursales, Franquicias). Incluye la propiedad `codigo` (String, autogenerado a partir del nombre, único y normalizado) para evitar duplicados.
* **Usuario:** Operadores del sistema, siempre vinculados a una Unidad de Negocio.
* **Producto:** El panificado terminado que se vende (ej. Pan de Hamburguesa). Posee precio dual (Costo y Franquicia). Incluye la propiedad `codigo` (String, autogenerado a partir del nombre, único y normalizado) para evitar duplicados.
* **Pedido (Venta):** Solicitud de productos realizada por una Sucursal o Franquicia a la Planta. Contiene múltiples `DetallePedido`.
* **Insumo:** Materia prima cruda (ej. Harina) utilizada por la Planta. Incluye la propiedad `codigo` (String, autogenerado a partir del nombre, único y normalizado) para evitar duplicados.
* **PedidoInsumo (Compra):** Solicitud de abastecimiento de materias primas realizada por la Planta. Contiene múltiples `DetalleInsumo`.
### Sobre la propiedad `codigo` en entidades críticas

La propiedad `codigo` es un identificador de tipo String, autogenerado a partir del nombre de la entidad (limpiando espacios, tildes y convirtiendo a mayúsculas). Su objetivo es evitar la creación de entidades duplicadas y facilitar búsquedas y validaciones transversales.

## 4. Diccionario de Datos y Validaciones (Constraints)

### 4.1 Insumo
* **id** (String/UUID): Generado automáticamente por el sistema.
* **codigo** (String): Autogenerado por el sistema. Regex: `^[A-Z0-9\-]+$` (Solo mayúsculas, números y guiones).
* **nombre** (String): Obligatorio. Min: 3 caracteres, Max: 50. Solo letras, números y espacios. Regex: `^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$`
* **unidad_medida** (String): Obligatorio. Valores estrictos (Enum): `["KG", "LTS", "UN"]`.
* **stock_actual** (Number): Obligatorio. Debe ser mayor o igual a 0.
* **punto_pedido** (Number): Obligatorio. Debe ser mayor o igual a 0.
* **activo** (Boolean): Obligatorio. Valor por defecto: `true`.

### 4.2 Producto (Make-to-Order)
* **id** (String/UUID): Generado automáticamente por el sistema.
* **codigo** (String): Autogenerado por el sistema. Regex: `^[A-Z0-9\-]+$`
* **nombre** (String): Obligatorio. Min: 3 caracteres, Max: 50. Solo letras, números y espacios. Regex: `^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$`
* **precio_costo** (Number): Obligatorio. Debe ser mayor estricto a 0.
* **precio_franquicia** (Number): Obligatorio. Debe ser mayor estricto a 0.
* **activo** (Boolean): Obligatorio. Valor por defecto: `true`.
*(Nota: No maneja stock por tratarse de un modelo de producción bajo pedido).*

### 4.3 Unidad de Negocio
* **id** (String/UUID): Generado automáticamente por el sistema.
* **codigo** (String): Autogenerado por el sistema. Regex: `^[A-Z0-9\-]+$`
* **nombre** (String): Obligatorio. Min: 3 caracteres, Max: 50. Solo letras, números y espacios. Regex: `^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$`
* **tipo** (String): Obligatorio. Valores estrictos (Enum): `["PLANTA_CENTRAL", "SUCURSAL_PROPIA", "FRANQUICIA"]`.
* **direccion** (String): Obligatorio. Min: 5 caracteres, Max: 100. Admite caracteres alfanuméricos y puntuación básica.
* **activo** (Boolean): Obligatorio. Valor por defecto: `true`.

### 4.4 Usuario
* **id** (String/UUID): Generado automáticamente por el sistema.
* **nombre** (String): Obligatorio. Min: 3 caracteres, Max: 50. Solo letras y espacios. Regex: `^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$`
* **email** (String): Obligatorio. Debe tener un formato de correo electrónico válido. Debe ser único en el sistema.
* **rol** (String): Obligatorio. Valores estrictos (Enum): `["ADMIN_PLANTA", "ENCARGADO_SUCURSAL", "FRANQUICIADO"]`.
* **unidad_negocio_id** (String/UUID): Obligatorio. Debe coincidir con el ID de una Unidad de Negocio existente (Validación referencial).
* **activo** (Boolean): Obligatorio. Valor por defecto: `true`.

### 4.5 Pedido (Venta)
* **id** (String/UUID): Generado automáticamente por el sistema.
* **unidad_negocio_id** (String/UUID): Obligatorio. Referencia a la Unidad de Negocio que solicita.
* **usuario_id** (String/UUID): Obligatorio. Referencia al Usuario que registra la operación.
* **estado** (String): Obligatorio. Valores estrictos (Enum): `["PENDIENTE", "EN_PRODUCCION", "DESPACHADO", "ENTREGADO", "CANCELADO"]`. Valor por defecto al crear: `PENDIENTE`.
* **fecha** (String/ISO 8601 Date): Generada automáticamente al momento de la creación.

### 4.6 DetallePedido
* **id** (String/UUID): Generado automáticamente por el sistema.
* **pedido_id** (String/UUID): Obligatorio. Referencia al Pedido cabecera.
* **producto_id** (String/UUID): Obligatorio. Referencia al Producto solicitado.
* **cantidad** (Number): Obligatorio. Número entero estrictamente mayor a 0.
* **precio_unitario** (Number): Generado por el backend al momento de crear el pedido (se "congela" el precio vigente según el tipo de unidad de negocio). Mayor o igual a 0.
* **subtotal** (Number): Generado por el backend (`cantidad * precio_unitario`). Mayor o igual a 0.

## 5. Flujos Operativos y Máquinas de Estado

### Persistencia y Validación
- **Persistencia asíncrona:** Todas las operaciones CRUD utilizan métodos asíncronos centralizados (`readData`, `writeData` en `lib/fs.js`). No se utiliza `fs` nativo en controladores ni tests.
- **Validación estructural:** Todos los endpoints validan primero la estructura y tipos de datos usando Zod. Solo si el payload es válido, se ejecutan validaciones de unicidad y referenciales.
- **Formato de error estándar:** Todas las respuestas de error siguen `{ error: true, codigo_http, mensaje }`.

### 5.1 Ciclo de Vida del Pedido de Venta (Máquina de Estados)
1. **PENDIENTE**: Solicitud emitida. Único estado abierto a modificaciones o cancelaciones.
2. **EN_PRODUCCION**: Pedido validado. Congelado para modificaciones.
3. **DESPACHADO**: Salida física de la Planta.
4. **ENTREGADO**: Recepción confirmada. Elegible para reporte de royalties.
5. **CANCELADO**: Pedido anulado (Soft Delete). Solo se puede pasar a este estado si el pedido estaba en PENDIENTE.

**Transiciones y RBAC:**
- El cambio de estado se realiza exclusivamente mediante `PATCH /api/pedidos/:id/estado`.
- Solo usuarios con rol `ADMIN_PLANTA` pueden ejecutar cambios de estado (RBAC estricto).
- El endpoint valida la transición permitida según la máquina de estados y aborta con error si la transición es inválida.

**PUT y Reemplazo Total:**
- El endpoint `PUT /api/pedidos/:id` reemplaza completamente el array de detalles del pedido, recalculando precios y subtotales según el catálogo vigente. Solo permitido en estado `PENDIENTE`.

**Soft Delete:**
- Las bajas lógicas se implementan mediante la propiedad `activo: false` (o `estado: 'CANCELADO'` en pedidos), nunca eliminando físicamente los registros.

### 5.2 Flujo de Abastecimiento (Insumos)
1.  **PENDIENTE:** Orden de compra emitida por la Planta.
2.  **RECIBIDO:** La materia prima ingresó a la Planta. **Regla de Negocio:** Al pasar a este estado, el sistema debe aumentar el `stock_actual` del Insumo correspondiente automáticamente.

## 6. Reportes Estratégicos (Casos de Uso Analíticos)
* **Demanda Consolidada:** Agrupa todos los `DetallePedido` de los pedidos en estado `PENDIENTE` para sumarizar la cantidad total a producir de cada panificado.
* **Base Imponible (Royalties):** Filtra los pedidos `ENTREGADO` de una Franquicia y calcula el 5% sobre el total facturado.