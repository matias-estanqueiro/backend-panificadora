import request from 'supertest'
import app from '../app.js'
import { limpiarData } from './helpers/limpiarData.js'
import { writeData } from '../lib/fs.js'
import { v4 as uuidv4 } from 'uuid'

let unidadPlantaId, unidadSucursalId, unidadFranquiciaId;

beforeAll(async () => {
  await limpiarData();
  
  unidadPlantaId = uuidv4();
  unidadSucursalId = uuidv4();
  unidadFranquiciaId = uuidv4();

  // Sembrar unidades de diferentes tipos para probar validación de roles
  await writeData('unidadesNegocio', [
    { id: unidadPlantaId, nombre: 'Planta Test', tipo: 'PLANTA_CENTRAL', codigo: 'PLANTA-TEST', direccion: 'Calle 1', activo: true },
    { id: unidadSucursalId, nombre: 'Sucursal Test', tipo: 'SUCURSAL_PROPIA', codigo: 'SUCURSAL-TEST', direccion: 'Calle 2', activo: true },
    { id: unidadFranquiciaId, nombre: 'Franquicia Test', tipo: 'FRANQUICIA', codigo: 'FRANQUICIA-TEST', direccion: 'Calle 3', activo: true }
  ]);
})

const crearUsuarioManual = async (nombre, email, rol, unidadId) => {
  return await request(app)
    .post('/api/usuarios')
    .send({ nombre, email, rol, unidad_negocio_id: unidadId });
}

describe('Módulo Usuario', () => {
  
  test('GET /api/usuarios debe devolver un array y status 200', async () => {
    const res = await request(app).get('/api/usuarios')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  describe('POST /api/usuarios', () => {
    test('crea un usuario exitosamente respetando el cruce de rol y unidad', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .send({ 
          nombre: 'Juan Admin', 
          email: 'juan@planta.com', 
          rol: 'ADMIN_PLANTA', 
          unidad_negocio_id: unidadPlantaId 
        })
      expect(res.status).toBe(201)
      expect(res.body.usuario.nombre).toBe('Juan Admin')
    })

    test('retorna 409 si el rol no coincide con el tipo de unidad de negocio', async () => {
      // Intentar poner un ADMIN_PLANTA en una SUCURSAL
      const res = await request(app)
        .post('/api/usuarios')
        .send({ 
          nombre: 'Infiltrado', 
          email: 'infil@test.com', 
          rol: 'ADMIN_PLANTA', 
          unidad_negocio_id: unidadSucursalId 
        })
      expect(res.status).toBe(409)
      expect(res.body.mensaje).toMatch(/solo puede pertenecer a una PLANTA_CENTRAL/i)
    })

    test('realiza un auto-upsert (resurrección) si el email existe pero está inactivo', async () => {
      // 1. Crear y borrar usuario
      const resPost = await crearUsuarioManual('Lazarus', 'lazarus@test.com', 'ENCARGADO_SUCURSAL', unidadSucursalId);
      const id = resPost.body.usuario.id;
      await request(app).delete(`/api/usuarios/${id}`);

      // 2. Intentar crear el mismo email (debe resucitarlo)
      const resResurrect = await request(app)
        .post('/api/usuarios')
        .send({ 
          nombre: 'Lazarus Revivido', 
          email: 'lazarus@test.com', 
          rol: 'ENCARGADO_SUCURSAL', 
          unidad_negocio_id: unidadSucursalId 
        });
      
      expect(resResurrect.status).toBe(200); 
      expect(resResurrect.body.usuario.activo).toBe(true);
      expect(resResurrect.body.usuario.nombre).toBe('Lazarus Revivido');
      expect(resResurrect.body.usuario.id).toBe(id); // Mismo ID
    })
  })

  describe('PUT /api/usuarios/:id', () => {
    test('retorna 409 si se intenta editar un usuario inactivo', async () => {
      const resPost = await crearUsuarioManual('Inactivo', 'inactivo@test.com', 'FRANQUICIADO', unidadFranquiciaId);
      const id = resPost.body.usuario.id;
      await request(app).delete(`/api/usuarios/${id}`);

      const resPut = await request(app)
        .put(`/api/usuarios/${id}`)
        .send({ 
          nombre: 'Intento Editar',
          email: 'inactivo@test.com', // Payload completo para pasar Zod
          rol: 'FRANQUICIADO',
          unidad_negocio_id: unidadFranquiciaId
        });
      
      expect(resPut.status).toBe(409);
      expect(resPut.body.mensaje).toMatch(/inactivo/i);
    })

    test('valida el cruce de roles también durante la actualización', async () => {
      const resPost = await crearUsuarioManual('Cambiante', 'cambiante@test.com', 'ENCARGADO_SUCURSAL', unidadSucursalId);
      const id = resPost.body.usuario.id;

      // Intentar cambiar rol a ADMIN_PLANTA manteniendo la unidad de Sucursal
      const resPut = await request(app)
        .put(`/api/usuarios/${id}`)
        .send({ 
          nombre: 'Cambiante',
          email: 'cambiante@test.com',
          rol: 'ADMIN_PLANTA', // Acá está el cambio malicioso
          unidad_negocio_id: unidadSucursalId // Mantenemos la sucursal
        });
      
      expect(resPut.status).toBe(409);
    })
  })

  test('DELETE /api/usuarios/:id debe hacer baja lógica', async () => {
    const resPost = await crearUsuarioManual('Borrar', 'borrar@test.com', 'ENCARGADO_SUCURSAL', unidadSucursalId);
    const id = resPost.body.usuario.id;

    const resDel = await request(app).delete(`/api/usuarios/${id}`)
    expect(resDel.status).toBe(200)
    
    const resGet = await request(app).get(`/api/usuarios/${id}`)
    expect(resGet.body.activo).toBe(false)
  })
})
