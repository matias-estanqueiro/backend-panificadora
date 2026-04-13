# API RESTful - Sistema de Gestión de Pedidos "La Espiga de Oro S.R.L."
## Descripción del Proyecto
Backend transaccional diseñado para estructurar y centralizar la cadena de suministro interno de una panificadora con estructura matricial (Planta Central, Sucursales Propias y Franquicias). 

El sistema expone un motor de operaciones CRUD interrelacionadas diseñado para erradicar la asimetría de información en la captura de pedidos, garantizando la integridad referencial y bloqueando transacciones inconsistentes. 

**Características Técnicas Principales:**
* **Arquitectura Modular por Capas:** Separación estricta de responsabilidades (Rutas, Controladores, Servicios y Modelos).
* **Control de Acceso Basado en Roles (RBAC):** Segregación de permisos y visibilidad de datos (precios de costo vs. precios de venta) dependiente de la Unidad de Negocio del usuario autenticado.
* **Máquina de Estados Finita:** Control auditado del ciclo de vida de los pedidos (`PENDIENTE` -> `EN_PRODUCCION` -> `DESPACHADO` -> `ENTREGADO`), con bloqueos transaccionales duros contra modificaciones en etapas avanzadas.
* **Gestión de Dependencias (Soft Deletes):** Prevención de eliminación de registros maestros (Unidades de Negocio, Productos) vinculados a transacciones históricas.
* **Agregación de Datos:** Endpoints estratégicos para el cálculo de demanda consolidada (producción) y base imponible (royalties).

**Stack Tecnológico:**
* Entorno: Node.js
* Framework: Express.js
* Persistencia: Almacenamiento en memoria (Fase 1 - MVP), diseñado con interfaces preparadas para inyección NoSQL (MongoDB) en futuras iteraciones.
