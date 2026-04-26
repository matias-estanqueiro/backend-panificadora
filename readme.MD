
# La Espiga de Oro S.R.L. – Backend de Gestión de Pedidos

## Descripción
Backend transaccional para la gestión integral de pedidos en una panificadora industrial con estructura matricial (Planta Central, Sucursales Propias y Franquicias). El sistema centraliza la cadena de suministro, garantiza la integridad referencial y bloquea transacciones inconsistentes mediante una arquitectura robusta y validaciones estrictas.

---

## Tecnologías y Herramientas
- **Node.js** (runtime)
- **Express.js** (framework web)
- **Zod** (validación de esquemas y tipos)
- **UUID** (identificadores únicos universales)
- **Jest** (testing de integración y unidad)
- **Supertest** (testing HTTP end-to-end)
- **Nodemon** (hot reload en desarrollo)

---

## Estructura de Carpetas

```
├── app.js
├── package.json
├── package-lock.json
├── controllers/
│   ├── insumoController.js
│   ├── pedidoController.js
│   ├── productoController.js
│   ├── unidadNegocioController.js
│   └── usuarioController.js
├── data/
│   ├── insumos.json
│   ├── pedidos.json
│   ├── productos.json
│   ├── unidadesNegocio.json
│   └── usuarios.json
├── docs/
│   ├── doc_tecnica_funcional.md
│   ├── endpoints_collection.yaml
│   └── pautas_desarrollo/
│       ├── funcional.md
│       ├── pautas-tecnicas-tp.md
│       └── tecnico.md
├── lib/
│   ├── fs.js
│   ├── schemas.js
│   └── utils.js
├── models/
│   ├── Insumo.js
│   ├── Pedido.js
│   ├── Producto.js
│   ├── UnidadNegocio.js
│   └── Usuario.js
├── routes/
│   ├── insumoRoutes.js
│   ├── pedidoRoutes.js
│   ├── productoRoutes.js
│   ├── unidadNegocioRoutes.js
│   └── usuarioRoutes.js
├── tests/
│   ├── insumo.test.js
│   ├── pedido.test.js
│   ├── producto.test.js
│   ├── unidadNegocio.test.js
│   ├── usuario.test.js
│   └── helpers/
│       └── limpiarData.js
├── node_modules/
└── readme.MD
```

---

## Instalación y Ejecución

1. Instala las dependencias:
	```bash
	npm install
	```
2. Ejecuta el servidor en modo desarrollo:
	```bash
	npm run dev
	```
3. Corre la suite de tests:
	```bash
	npm test
	```

---

## Características Técnicas Clave

- **Persistencia Asíncrona:** Toda la lectura y escritura de datos se realiza mediante los métodos asíncronos `readData` y `writeData` del wrapper `lib/fs.js`, eliminando condiciones de carrera y el uso directo de `fs` nativo en controladores y tests.
- **Validación de Datos con Zod:** Todos los controladores validan primero la estructura y tipos de datos usando Zod antes de cualquier lógica de negocio.
- **Máquina de Estados de Pedidos:** El ciclo de vida de un pedido sigue el flujo `PENDIENTE → EN_PRODUCCION → DESPACHADO → ENTREGADO`, con el estado terminal `CANCELADO`. El cambio de estado se realiza exclusivamente mediante `PATCH /api/pedidos/:id/estado` y solo puede ser ejecutado por usuarios con rol `ADMIN_PLANTA` (RBAC estricto).
- **Patrón de Reemplazo Total en PUT:** El endpoint `PUT /api/pedidos/:id` sobrescribe completamente el array de detalles del pedido, recalculando precios y subtotales según el catálogo vigente.
- **Soft Delete:** Las bajas lógicas se implementan mediante la propiedad `activo: false` (o `estado: 'CANCELADO'` en pedidos), nunca eliminando físicamente los registros.
- **Testing Defensivo:** El helper `tests/helpers/limpiarData.js` y la infraestructura de tests garantizan aislamiento y repetibilidad, validando tanto errores de estructura como de negocio.

---

## Documentación y Normativas

La carpeta `/docs` contiene la documentación funcional y técnica, incluyendo:
- `funcional.md`: Especificación funcional, casos de uso, reglas de negocio y modelo de dominio.
- `tecnico.md`: Pautas técnicas, arquitectura, convenciones y manejo de errores.
- `pautas-tecnicas-tp.md`: Reglas y criterios de evaluación para la entrega.

Se recomienda leer estos documentos antes de modificar o agregar cualquier funcionalidad al proyecto.
