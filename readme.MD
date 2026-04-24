# API RESTful - Sistema de Gestión de Pedidos "La Espiga de Oro S.R.L."
## Descripción del Proyecto
Backend transaccional diseñado para estructurar y centralizar la cadena de suministro interno de una panificadora con estructura matricial (Planta Central, Sucursales Propias y Franquicias). 
El sistema expone un motor de operaciones CRUD interrelacionadas diseñado para erradicar la asimetría de información en la captura de pedidos, garantizando la integridad referencial y bloqueando transacciones inconsistentes. 

---

**Características Técnicas Principales:**
* **Arquitectura Modular por Capas:** Separación estricta de responsabilidades (Rutas, Controladores, Modelos). Cada entidad implementa su propio CRUD siguiendo el patrón MVC.
* **Máquina de Estados Finita:** Control auditado del ciclo de vida de los pedidos (`PENDIENTE` -> `EN_PRODUCCION` -> `DESPACHADO` -> `ENTREGADO`), con bloqueos transaccionales duros contra modificaciones en etapas avanzadas.
* **Gestión de Dependencias (Soft Deletes):** Prevención de eliminación física de registros maestros (Unidades de Negocio, Productos, Insumos, Usuarios) mediante baja lógica (`activo: false`).
* **Agregación de Datos:** Endpoints estratégicos para el cálculo de demanda consolidada (producción) y base imponible (royalties).
* **Programación Defensiva y DRY:** Utilidades centralizadas para manejo seguro de archivos y carpetas (`lib/fs.js`).
* **Validación y Manejo de Errores Estandarizado:** Todos los controladores devuelven errores en formato JSON estricto `{ error: true, codigo_http, mensaje }`.
* **Cobertura de Pruebas Automatizadas:** Pruebas de integración para todos los módulos CRUD usando Jest y Supertest.
* **Scripts de desarrollo y testing:** Scripts en `package.json` para desarrollo (`dev`), ejecución (`start`) y testing (`test`).

---

**Stack Tecnológico:**
* Entorno: Node.js
* Framework: Express.js
* Motor de vistas: Pug (para futuras vistas administrativas)
* Testing: Jest (unitario e integración), Supertest (HTTP)
* Hot reload: Nodemon
* Persistencia: Archivos JSON nativos (almacenamiento en memoria, preparado para NoSQL)
* UUID: Identificadores únicos universales para entidades

**Scripts útiles (`package.json`):**
* `start`: Ejecuta el servidor principal (`node app.js`)
* `dev`: Ejecuta el servidor en modo desarrollo con recarga automática (`nodemon app.js`)
* `test`: Ejecuta la suite de tests con Jest y Supertest

- Insumo (materia prima)
- Producto (panificados terminados)
- UnidadNegocio (Planta, Sucursal, Franquicia)
- Usuario (operadores del sistema)

---

**Manejo Defensivo de Archivos y Carpetas (`lib/fs.js`):**

El sistema implementa una función auxiliar interna `ensureFileExists(filePath)` que:

Esto permite que el backend sea robusto ante borrados accidentales de archivos/carpetas y facilita la portabilidad del sistema.

---

**Documentación de Pautas de Desarrollo (`/docs/pautas_desarrollo`):**

Esta carpeta contiene los documentos normativos y funcionales que rigen el desarrollo del sistema. Son la referencia obligatoria para cualquier contribución, asegurando la calidad, coherencia y alineación con los objetivos del negocio.

**Índice de archivos:**

- `funcional.md`: Especificación funcional del sistema, casos de uso, actores, reglas de negocio y modelo de dominio.
- `tecnico.md`: Pautas técnicas obligatorias, arquitectura, convenciones de código, manejo de errores y estructura de carpetas.
- `pautas-tecnicas-tp.md`: Reglas y recomendaciones específicas para la entrega del trabajo práctico, criterios de evaluación y buenas prácticas.

Se recomienda leer estos documentos antes de modificar o agregar cualquier funcionalidad al proyecto.
