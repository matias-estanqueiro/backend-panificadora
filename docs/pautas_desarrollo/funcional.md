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

* **UnidadNegocio:** Representa las locaciones (Planta, Sucursales, Franquicias).
* **Usuario:** Operadores del sistema, siempre vinculados a una Unidad de Negocio.
* **Producto:** El panificado terminado que se vende (ej. Pan de Hamburguesa). Posee precio dual (Costo y Franquicia).
* **Pedido (Venta):** Solicitud de productos realizada por una Sucursal o Franquicia a la Planta. Contiene múltiples `DetallePedido`.
* **Insumo:** Materia prima cruda (ej. Harina) utilizada por la Planta.
* **PedidoInsumo (Compra):** Solicitud de abastecimiento de materias primas realizada por la Planta. Contiene múltiples `DetalleInsumo`.

## 4. Flujos Operativos y Máquinas de Estado

### 4.1 Ciclo de Vida del Pedido de Venta
1.  **PENDIENTE:** Creado por Sucursal/Franquicia. Único estado donde se permite modificar o cancelar el pedido.
2.  **EN_PRODUCCION:** La Planta comenzó a preparar el pedido. (Congelado para el solicitante).
3.  **DESPACHADO:** Los productos salieron de la Planta.
4.  **ENTREGADO:** Recepción confirmada. El pedido se cierra y se vuelve elegible para el cálculo de royalties.

### 4.2 Flujo de Abastecimiento (Insumos)
1.  **PENDIENTE:** Orden de compra emitida por la Planta.
2.  **RECIBIDO:** La materia prima ingresó a la Planta. **Regla de Negocio:** Al pasar a este estado, el sistema debe aumentar el `stock_actual` del Insumo correspondiente automáticamente.

## 5. Reportes Estratégicos (Casos de Uso Analíticos)
* **Demanda Consolidada:** Agrupa todos los `DetallePedido` de los pedidos en estado `PENDIENTE` para sumarizar la cantidad total a producir de cada panificado.
* **Base Imponible (Royalties):** Filtra los pedidos `ENTREGADO` de una Franquicia y calcula el 5% sobre el total facturado.