import { Router } from 'express';
import { AulaController } from '../controllers/aulaController.ts';
import { PlanificacionController } from '../controllers/planificacionController.ts';
import { CatalogoController } from '../controllers/catalogoController.ts';
import { CatalogoCrudController } from '../controllers/catalogoCrudController.ts';
import { AuthController } from '../controllers/authController.ts';
import { ReporteController } from '../controllers/reporteController.ts';
import { CarreraAsignaturaController } from '../controllers/carreraAsignaturaController.ts';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Aulas
router.get('/aulas', AulaController.list);
router.get('/aulas/recomendadas', PlanificacionController.recomendarAulas);
router.post('/aulas/sync-estados', AulaController.syncEstados);
router.get('/aulas/:id', AulaController.getById);
router.patch('/aulas/:id/estado', AulaController.updateEstado);

// Planificaciones y asignación de aulas
router.get('/planificaciones', PlanificacionController.list);
router.post('/planificaciones/validar-cruces', PlanificacionController.validarCruces);
router.post('/planificaciones/asignacion-automatica', PlanificacionController.asignacionAutomatica);
router.post('/planificaciones/asignar-aula-directa', PlanificacionController.asignarAulaDirecta);
router.post('/planificaciones/retirar-aula-directa', PlanificacionController.retirarAulaDirecta);
router.post('/planificaciones', PlanificacionController.create);
router.put('/planificaciones/:id', PlanificacionController.update);
router.delete('/planificaciones/all', PlanificacionController.deleteAll);
router.delete('/planificaciones', PlanificacionController.deleteAll);
router.delete('/planificaciones/:id', PlanificacionController.delete);

// Catálogos
router.get('/catalogos', CatalogoController.getAll);
router.get('/catalogos/:entity', CatalogoCrudController.list);
router.post('/catalogos/:entity', CatalogoCrudController.create);
router.put('/catalogos/:entity/:id', CatalogoCrudController.update);
router.patch('/catalogos/:entity/:id/estado', CatalogoCrudController.toggleEstado);
router.delete('/catalogos/:entity/:id', CatalogoCrudController.delete);

// Asignación de Asignaturas a Carreras (Validación Curricular y Drag & Drop)
router.get('/carrera-asignaturas', CarreraAsignaturaController.list);
router.post('/carrera-asignaturas', CarreraAsignaturaController.assign);
router.delete('/carrera-asignaturas', CarreraAsignaturaController.unassign);
router.delete('/carrera-asignaturas/carrera/:id_carrera', CarreraAsignaturaController.unassignAll);

// Autenticación & Perfiles
router.post('/auth/login', AuthController.login);
router.get('/auth/usuarios', AuthController.listUsers);
router.post('/auth/switch-role', AuthController.switchRole);

// Endpoint directo de docentes para vistas administrativas
router.get('/docentes', async (req, res) => {
  try {
    const { CatalogoModel } = await import('../models/CatalogoModel.ts');
    const docentes = await CatalogoModel.getDocentes();
    res.json({ success: true, data: docentes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seguridad (Usuarios / Roles / Permisos / Auditoría)
router.post('/seguridad/seed', async (req, res) => {
  try {
    const { reseedSecurity } = await import('../db/database.ts');
    await reseedSecurity();
    res.json({ success: true, message: 'Datos institucionales de seguridad, grupos y usuarios cargados exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seguridad/usuarios', async (req, res) => {
  try {
    const { queryAll } = await import('../db/database.ts');
    const users = await queryAll(`
      SELECT 
        u.id_usuario, 
        u.id_docente, 
        u.nombres, 
        u.apellidos, 
        u.username, 
        u.email, 
        u.telefono,
        u.cargo, 
        u.estado, 
        u.intentos_fallidos, 
        u.ultimo_acceso, 
        u.fecha_creacion,
        COALESCE(r.nombre, usr.rol, 'INVITADO') AS rol_nombre,
        COALESCE(r.id_rol, 5) AS id_rol,
        d.nombres || ' ' || d.apellidos AS docente_nombre,
        (SELECT COUNT(*) FROM usuario_permisos_override upo WHERE upo.id_usuario = u.id_usuario) AS custom_perms_count,
        (SELECT GROUP_CONCAT(g.nombre, ', ') FROM usuario_grupos ug JOIN grupos g ON ug.id_grupo = g.id_grupo WHERE ug.id_usuario = u.id_usuario) AS grupos_nombres,
        (SELECT GROUP_CONCAT(ug.id_grupo, ',') FROM usuario_grupos ug WHERE ug.id_usuario = u.id_usuario) AS grupos_ids
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      LEFT JOIN usuario usr ON u.id_usuario = usr.id_usuario
      LEFT JOIN docente d ON u.id_docente = d.id_docente
      ORDER BY u.id_usuario
    `);
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seguridad/roles', async (req, res) => {
  try {
    const { queryAll } = await import('../db/database.ts');
    const roles = await queryAll(`
      SELECT 
        r.*,
        (SELECT COUNT(*) FROM usuario_roles ur WHERE ur.id_rol = r.id_rol) AS total_usuarios
      FROM roles r 
      ORDER BY r.id_rol
    `);
    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seguridad/roles', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { nombre, descripcion, emoji, color } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre del grupo o rol es obligatorio' });
    }
    const cleanNombre = nombre.trim().toUpperCase().replace(/\s+/g, '_');
    const cleanDesc = descripcion?.trim() || `Grupo de usuarios ${cleanNombre}`;
    const cleanEmoji = emoji?.trim() || '🔵';
    const cleanColor = color?.trim() || 'blue';

    const existing = await queryOne('SELECT id_rol FROM roles WHERE UPPER(nombre) = ?', [cleanNombre]);
    if (existing) {
      return res.status(400).json({ success: false, message: `El grupo "${cleanNombre}" ya existe en el sistema` });
    }

    const result = await runQuery(
      `INSERT INTO roles (nombre, descripcion, emoji, color, estado) VALUES (?, ?, ?, ?, 'ACTIVO')`,
      [cleanNombre, cleanDesc, cleanEmoji, cleanColor]
    );

    res.json({ 
      success: true, 
      message: `Grupo ${cleanEmoji} ${cleanNombre} creado exitosamente`, 
      data: { id_rol: result.lastInsertRowid, nombre: cleanNombre, descripcion: cleanDesc, emoji: cleanEmoji, color: cleanColor } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/seguridad/roles/:id', async (req, res) => {
  try {
    const { runQuery } = await import('../db/database.ts');
    const { id } = req.params;
    const { nombre, descripcion, emoji, color, estado } = req.body;
    await runQuery(
      `UPDATE roles SET 
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        emoji = COALESCE(?, emoji),
        color = COALESCE(?, color),
        estado = COALESCE(?, estado)
      WHERE id_rol = ?`,
      [nombre, descripcion, emoji, color, estado, id]
    );
    res.json({ success: true, message: 'Rol actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/seguridad/roles/:id', async (req, res) => {
  try {
    const { runQuery } = await import('../db/database.ts');
    const { id } = req.params;
    const roleId = Number(id);
    if (roleId <= 7) {
      return res.status(400).json({ success: false, message: 'No es posible eliminar un rol canónico del sistema' });
    }
    await runQuery('DELETE FROM usuario_roles WHERE id_rol = ?', [roleId]);
    await runQuery('DELETE FROM rol_permisos WHERE id_rol = ?', [roleId]);
    await runQuery('DELETE FROM roles WHERE id_rol = ?', [roleId]);
    res.json({ success: true, message: 'Rol eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seguridad/permisos', async (req, res) => {
  try {
    const { queryAll } = await import('../db/database.ts');
    const permisos = await queryAll('SELECT * FROM permisos ORDER BY id_permiso');
    const modulos = await queryAll('SELECT * FROM modulos ORDER BY orden, id_modulo');
    res.json({ success: true, data: { permisos, modulos } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seguridad/auditoria', async (req, res) => {
  try {
    const { queryAll } = await import('../db/database.ts');
    const logs = await queryAll(`
      SELECT a.*, COALESCE(u.username, 'SISTEMA') as usuario_nombre
      FROM auditoria a
      LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
      ORDER BY a.id_auditoria DESC
      LIMIT 100
    `);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/seguridad/usuarios/:id/estado', async (req, res) => {
  try {
    const { runQuery } = await import('../db/database.ts');
    const { id } = req.params;
    const { estado } = req.body;
    await runQuery("UPDATE usuarios SET estado = ?, fecha_actualizacion = datetime('now') WHERE id_usuario = ?", [estado, id]);
    
    // Registrar en auditoría
    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'CAMBIO_ESTADO', ?, '127.0.0.1', datetime('now'))
    `, [`Actualización de estado de usuario #${id} a ${estado}`]);

    res.json({ success: true, message: 'Estado actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/seguridad/usuarios/:id/reset-intentos', async (req, res) => {
  try {
    const { runQuery } = await import('../db/database.ts');
    const { id } = req.params;
    await runQuery("UPDATE usuarios SET intentos_fallidos = 0, fecha_actualizacion = datetime('now') WHERE id_usuario = ?", [id]);
    
    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'RESET_INTENTOS', ?, '127.0.0.1', datetime('now'))
    `, [`Restablecimiento de intentos fallidos para usuario #${id}`]);

    res.json({ success: true, message: 'Intentos fallidos restablecidos a 0' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Asignar rol directamente a un usuario (por ID o por nombre del rol)
router.patch('/seguridad/usuarios/:id/rol', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;
    const { id_rol, rol_nombre } = req.body;

    let rol = null;
    if (id_rol && !isNaN(Number(id_rol)) && Number(id_rol) > 0) {
      rol = await queryOne('SELECT * FROM roles WHERE id_rol = ?', [Number(id_rol)]);
    }

    if (!rol && rol_nombre) {
      const cleanTarget = String(rol_nombre).trim().toUpperCase();
      rol = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = ?', [cleanTarget]);
      if (!rol && cleanTarget === 'CONSULTA') {
        rol = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = "USUARIO_CONSULTA"');
      } else if (!rol && cleanTarget === 'USUARIO_CONSULTA') {
        rol = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = "CONSULTA"');
      }
      // Si aún no existe en DB, crearlo dinámicamente
      if (!rol) {
        const insertRes = await runQuery(
          `INSERT INTO roles (nombre, descripcion, emoji, color, estado) VALUES (?, ?, '🔵', 'blue', 'ACTIVO')`,
          [cleanTarget, `Grupo institucional ${cleanTarget}`]
        );
        rol = await queryOne('SELECT * FROM roles WHERE id_rol = ?', [insertRes.lastInsertRowid]);
      }
    }

    if (!rol) {
      return res.status(400).json({ success: false, message: 'Debe especificar un rol o grupo válido' });
    }

    await runQuery('DELETE FROM usuario_roles WHERE id_usuario = ?', [id]);
    await runQuery('INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)', [id, rol.id_rol]);
    await runQuery("UPDATE usuario SET rol = ? WHERE id_usuario = ?", [rol.nombre, id]);
    await runQuery("UPDATE usuarios SET fecha_actualizacion = datetime('now') WHERE id_usuario = ?", [id]);

    const user = await queryOne('SELECT username, nombres, apellidos FROM usuarios WHERE id_usuario = ?', [id]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'ASIGNACION_ROL', ?, '127.0.0.1', datetime('now'))
    `, [`Asignación de rol/grupo "${rol.nombre}" al usuario @${user?.username || id}`]);

    res.json({ 
      success: true, 
      message: `Usuario @${user?.username || id} asignado al rol/grupo ${rol.emoji || ''} ${rol.nombre}`, 
      rol_nombre: rol.nombre, 
      id_rol: rol.id_rol 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Asignar múltiples usuarios a un rol o grupo institucional (Batch assignment)
router.post('/seguridad/roles/asignar-usuarios', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id_rol, rol_nombre, id_usuarios } = req.body;

    if (!Array.isArray(id_usuarios) || id_usuarios.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un usuario para asignar' });
    }

    let rol = null;
    if (id_rol && !isNaN(Number(id_rol)) && Number(id_rol) > 0) {
      rol = await queryOne('SELECT * FROM roles WHERE id_rol = ?', [Number(id_rol)]);
    }

    if (!rol && rol_nombre) {
      const cleanTarget = String(rol_nombre).trim().toUpperCase();
      rol = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = ?', [cleanTarget]);
      if (!rol && cleanTarget === 'CONSULTA') {
        rol = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = "USUARIO_CONSULTA"');
      } else if (!rol && cleanTarget === 'USUARIO_CONSULTA') {
        rol = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = "CONSULTA"');
      }
      if (!rol) {
        const insertRes = await runQuery(
          `INSERT INTO roles (nombre, descripcion, emoji, color, estado) VALUES (?, ?, '🔵', 'blue', 'ACTIVO')`,
          [cleanTarget, `Grupo institucional ${cleanTarget}`]
        );
        rol = await queryOne('SELECT * FROM roles WHERE id_rol = ?', [insertRes.lastInsertRowid]);
      }
    }

    if (!rol) {
      return res.status(400).json({ success: false, message: 'Rol o grupo institucional no encontrado' });
    }

    let countAssigned = 0;
    for (const uid of id_usuarios) {
      const numUid = Number(uid);
      if (isNaN(numUid)) continue;
      await runQuery('DELETE FROM usuario_roles WHERE id_usuario = ?', [numUid]);
      await runQuery('INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)', [numUid, rol.id_rol]);
      await runQuery("UPDATE usuario SET rol = ? WHERE id_usuario = ?", [rol.nombre, numUid]);
      await runQuery("UPDATE usuarios SET fecha_actualizacion = datetime('now') WHERE id_usuario = ?", [numUid]);
      countAssigned++;
    }

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'ASIGNACION_ROL_MASIVA', ?, '127.0.0.1', datetime('now'))
    `, [`Asignación masiva de ${countAssigned} usuario(s) al rol/grupo "${rol.nombre}"`]);

    res.json({
      success: true,
      message: `Se asignaron ${countAssigned} usuario(s) al grupo/rol ${rol.emoji || ''} ${rol.nombre} exitosamente`,
      data: { id_rol: rol.id_rol, rol_nombre: rol.nombre, total_asignados: countAssigned }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remover o reasignar un usuario de un grupo
router.post('/seguridad/roles/remover-usuario', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id_usuario, nuevo_id_rol, nuevo_rol_nombre } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ success: false, message: 'ID de usuario requerido' });
    }

    let targetRole = null;
    if (nuevo_id_rol) {
      targetRole = await queryOne('SELECT * FROM roles WHERE id_rol = ?', [Number(nuevo_id_rol)]);
    } else if (nuevo_rol_nombre) {
      targetRole = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = ?', [String(nuevo_rol_nombre).toUpperCase()]);
    } else {
      // Reasignar por defecto a CONDULTA (id 7)
      targetRole = await queryOne('SELECT * FROM roles WHERE UPPER(nombre) = "CONDULTA"') ||
                   await queryOne('SELECT * FROM roles WHERE id_rol = 7');
    }

    const newRoleId = targetRole ? targetRole.id_rol : 7;
    const newRoleName = targetRole ? targetRole.nombre : 'CONDULTA';

    await runQuery('DELETE FROM usuario_roles WHERE id_usuario = ?', [id_usuario]);
    await runQuery('INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)', [id_usuario, newRoleId]);
    await runQuery("UPDATE usuario SET rol = ? WHERE id_usuario = ?", [newRoleName, id_usuario]);
    await runQuery("UPDATE usuarios SET fecha_actualizacion = datetime('now') WHERE id_usuario = ?", [id_usuario]);

    const u = await queryOne('SELECT username FROM usuarios WHERE id_usuario = ?', [id_usuario]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'DESVINCULAR_ROL', ?, '127.0.0.1', datetime('now'))
    `, [`Reasignación de usuario @${u?.username || id_usuario} a perfil base "${newRoleName}"`]);

    res.json({
      success: true,
      message: `Usuario @${u?.username || id_usuario} reasignado al perfil base ${newRoleName}`,
      data: { nuevo_rol: newRoleName }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtener permisos de un usuario (incluyendo sus asignaciones personalizadas u origen del rol)
router.get('/seguridad/usuarios/:id/permisos', async (req, res) => {
  try {
    const { queryAll, queryOne } = await import('../db/database.ts');
    const { id } = req.params;

    const user = await queryOne(`
      SELECT 
        u.id_usuario, u.username, u.nombres, u.apellidos, u.cargo,
        COALESCE(r.nombre, 'OPERADOR') AS rol_nombre,
        COALESCE(r.id_rol, 5) AS id_rol
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      WHERE u.id_usuario = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const overrides = await queryAll('SELECT modulo, permisos_json FROM usuario_permisos_override WHERE id_usuario = ?', [id]);
    const overridesMap: Record<string, any> = {};
    overrides.forEach((o: any) => {
      try {
        overridesMap[o.modulo] = JSON.parse(o.permisos_json);
      } catch (_) {}
    });

    res.json({
      success: true,
      data: {
        usuario: user,
        overrides: overridesMap,
        hasOverrides: Object.keys(overridesMap).length > 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Guardar o actualizar permisos asignados a un usuario
router.post('/seguridad/usuarios/:id/permisos', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;
    const { permisos } = req.body; // Map of modulo -> rule object

    const user = await queryOne('SELECT username, nombres, apellidos FROM usuarios WHERE id_usuario = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await runQuery('DELETE FROM usuario_permisos_override WHERE id_usuario = ?', [id]);

    if (permisos && typeof permisos === 'object') {
      for (const [modulo, perms] of Object.entries(permisos)) {
        await runQuery(`
          INSERT INTO usuario_permisos_override (id_usuario, modulo, permisos_json, fecha_actualizacion)
          VALUES (?, ?, ?, datetime('now'))
        `, [id, modulo, JSON.stringify(perms)]);
      }
    }

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'ASIGNACION_PERMISOS', ?, '127.0.0.1', datetime('now'))
    `, [`Personalización y asignación de permisos individuales al usuario @${user.username}`]);

    res.json({ success: true, message: 'Permisos del usuario asignados y actualizados correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Restaurar permisos por defecto del rol para un usuario
router.delete('/seguridad/usuarios/:id/permisos', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;

    const user = await queryOne('SELECT username FROM usuarios WHERE id_usuario = ?', [id]);
    await runQuery('DELETE FROM usuario_permisos_override WHERE id_usuario = ?', [id]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'RESETEAR_PERMISOS', ?, '127.0.0.1', datetime('now'))
    `, [`Restauración de permisos por defecto del rol para usuario @${user?.username || id}`]);

    res.json({ success: true, message: 'Permisos restaurados a la configuración estándar del rol' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Actualizar información completa de usuario y asignación de rol
router.put('/seguridad/usuarios/:id', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;
    const { nombres, apellidos, username, email, telefono, cargo, id_rol, id_docente, estado } = req.body;

    if (!nombres || !apellidos || !username || !email) {
      return res.status(400).json({ success: false, message: 'Nombres, apellidos, username y correo son requeridos' });
    }

    await runQuery(`
      UPDATE usuarios 
      SET nombres = ?, apellidos = ?, username = ?, email = ?, telefono = ?, cargo = ?, id_docente = ?, estado = COALESCE(?, estado), fecha_actualizacion = datetime('now')
      WHERE id_usuario = ?
    `, [nombres, apellidos, username, email, telefono || '', cargo || '', id_docente || null, estado, id]);

    if (id_rol) {
      await runQuery('DELETE FROM usuario_roles WHERE id_usuario = ?', [id]);
      await runQuery('INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)', [id, id_rol]);
      const rol = await queryOne('SELECT nombre FROM roles WHERE id_rol = ?', [id_rol]);
      if (rol) {
        await runQuery("UPDATE usuario SET rol = ? WHERE id_usuario = ?", [rol.nombre, id]);
      }
    }

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'EDITAR_USUARIO', ?, '127.0.0.1', datetime('now'))
    `, [`Edición de perfil y asignación de rol para usuario #${id} (@${username})`]);

    res.json({ success: true, message: 'Usuario y roles actualizados exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar usuario
router.delete('/seguridad/usuarios/:id', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;

    if (Number(id) === 1) {
      return res.status(403).json({ success: false, message: 'No se puede eliminar el usuario administrador principal' });
    }

    const user = await queryOne('SELECT username FROM usuarios WHERE id_usuario = ?', [id]);
    await runQuery('DELETE FROM usuario_roles WHERE id_usuario = ?', [id]);
    await runQuery('DELETE FROM usuario_permisos_override WHERE id_usuario = ?', [id]);
    await runQuery('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    await runQuery('DELETE FROM usuario WHERE id_usuario = ?', [id]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'ELIMINAR_USUARIO', ?, '127.0.0.1', datetime('now'))
    `, [`Eliminación definitiva del usuario #${id} (@${user?.username || id})`]);

    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seguridad/usuarios', async (req, res) => {
  try {
    const { runQuery } = await import('../db/database.ts');
    const { nombres, apellidos, username, email, telefono, cargo, id_rol, id_docente } = req.body;
    if (!nombres || !apellidos || !username || !email) {
      return res.status(400).json({ success: false, message: 'Nombres, apellidos, username y correo son requeridos' });
    }
    const result = await runQuery(`
      INSERT INTO usuarios (id_docente, nombres, apellidos, username, password_hash, email, telefono, cargo, estado, intentos_fallidos, fecha_creacion)
      VALUES (?, ?, ?, ?, 'hash_default_123', ?, ?, ?, 'ACTIVO', 0, datetime('now'))
    `, [id_docente || null, nombres, apellidos, username, email, telefono || '', cargo || 'Personal Institucional']);

    const newId = result.lastInsertRowid;
    if (id_rol) {
      await runQuery('INSERT OR REPLACE INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)', [newId, id_rol]);
    }

    // Registrar en auditoría
    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'CREAR_USUARIO', ?, '127.0.0.1', datetime('now'))
    `, [`Creación de nuevo usuario @${username} (${nombres} ${apellidos})`]);

    res.json({ success: true, message: 'Usuario registrado exitosamente', id_usuario: newId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// ENDPOINTS DE ARQUITECTURA INSTITUCIONAL: USUARIO -> GRUPOS & ROLES -> PERMISOS -> MÓDULOS
// =========================================================================

// Obtener todos los grupos con sus miembros y roles por defecto
router.get('/seguridad/grupos', async (req, res) => {
  try {
    const { queryAll } = await import('../db/database.ts');
    const grupos = await queryAll(`
      SELECT 
        g.id_grupo, g.codigo, g.nombre, g.descripcion, g.emoji, g.color, g.id_rol_defecto, g.estado, g.fecha_creacion,
        r.nombre AS rol_defecto_nombre, r.emoji AS rol_defecto_emoji
      FROM grupos g
      LEFT JOIN roles r ON g.id_rol_defecto = r.id_rol
      ORDER BY g.id_grupo ASC
    `);

    // Obtener miembros por grupo
    const miembros = await queryAll(`
      SELECT 
        ug.id_grupo, u.id_usuario, u.username, u.nombres, u.apellidos, u.email, u.cargo,
        COALESCE(r.nombre, 'INVITADO') AS rol_nombre,
        COALESCE(r.emoji, '⚪') AS rol_emoji
      FROM usuario_grupos ug
      JOIN usuarios u ON ug.id_usuario = u.id_usuario
      LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      ORDER BY u.apellidos, u.nombres
    `);

    const gruposConMiembros = grupos.map((g: any) => {
      const usersInGroup = miembros.filter((m: any) => m.id_grupo === g.id_grupo);
      return {
        ...g,
        total_usuarios: usersInGroup.length,
        usuarios: usersInGroup
      };
    });

    res.json({ success: true, data: gruposConMiembros });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Crear nuevo grupo institucional
router.post('/seguridad/grupos', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { codigo, nombre, descripcion, emoji, color, id_rol_defecto } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ success: false, message: 'Código y nombre de grupo son requeridos' });
    }

    const cleanCodigo = String(codigo).trim().toUpperCase();
    const existing = await queryOne('SELECT id_grupo FROM grupos WHERE UPPER(codigo) = ?', [cleanCodigo]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Ya existe un grupo con el código ${cleanCodigo}` });
    }

    const result = await runQuery(`
      INSERT INTO grupos (codigo, nombre, descripcion, emoji, color, id_rol_defecto, estado, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO', datetime('now'))
    `, [
      cleanCodigo,
      String(nombre).trim(),
      descripcion || '',
      emoji || '👥',
      color || 'purple',
      id_rol_defecto ? Number(id_rol_defecto) : null
    ]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'CREAR_GRUPO', ?, '127.0.0.1', datetime('now'))
    `, [`Creación de nuevo grupo institucional "${nombre}" (${cleanCodigo})`]);

    res.json({
      success: true,
      message: `Grupo "${nombre}" creado exitosamente`,
      id_grupo: result.lastInsertRowid
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Modificar grupo institucional
router.put('/seguridad/grupos/:id', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;
    const { nombre, descripcion, emoji, color, id_rol_defecto, estado } = req.body;

    const grupo = await queryOne('SELECT * FROM grupos WHERE id_grupo = ?', [id]);
    if (!grupo) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }

    await runQuery(`
      UPDATE grupos 
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          emoji = COALESCE(?, emoji),
          color = COALESCE(?, color),
          id_rol_defecto = ?,
          estado = COALESCE(?, estado)
      WHERE id_grupo = ?
    `, [nombre, descripcion, emoji, color, id_rol_defecto !== undefined ? id_rol_defecto : grupo.id_rol_defecto, estado, id]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'EDITAR_GRUPO', ?, '127.0.0.1', datetime('now'))
    `, [`Actualización del grupo institucional "${nombre || grupo.nombre}"`]);

    res.json({ success: true, message: 'Grupo actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar grupo institucional
router.delete('/seguridad/grupos/:id', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;

    if (Number(id) === 1) {
      return res.status(403).json({ success: false, message: 'No se puede eliminar el grupo institucional de Dirección General' });
    }

    const grupo = await queryOne('SELECT nombre FROM grupos WHERE id_grupo = ?', [id]);
    await runQuery('DELETE FROM usuario_grupos WHERE id_grupo = ?', [id]);
    await runQuery('DELETE FROM grupos WHERE id_grupo = ?', [id]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'ELIMINAR_GRUPO', ?, '127.0.0.1', datetime('now'))
    `, [`Eliminación del grupo institucional #${id} (${grupo?.nombre || ''})`]);

    res.json({ success: true, message: 'Grupo eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Asignar usuarios a un grupo institucional
router.post('/seguridad/grupos/:id/usuarios', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;
    const { id_usuarios, asignar_rol_defecto } = req.body;

    if (!Array.isArray(id_usuarios) || id_usuarios.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un usuario' });
    }

    const grupo = await queryOne('SELECT * FROM grupos WHERE id_grupo = ?', [id]);
    if (!grupo) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }

    let addedCount = 0;
    for (const uid of id_usuarios) {
      const numUid = Number(uid);
      if (isNaN(numUid)) continue;
      await runQuery('INSERT OR IGNORE INTO usuario_grupos (id_usuario, id_grupo, fecha_asignacion) VALUES (?, ?, datetime("now"))', [numUid, id]);
      
      // Si se solicita sincronizar el rol por defecto del grupo
      if (asignar_rol_defecto && grupo.id_rol_defecto) {
        await runQuery('DELETE FROM usuario_roles WHERE id_usuario = ?', [numUid]);
        await runQuery('INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)', [numUid, grupo.id_rol_defecto]);
        const role = await queryOne('SELECT nombre FROM roles WHERE id_rol = ?', [grupo.id_rol_defecto]);
        if (role) {
          await runQuery('UPDATE usuario SET rol = ? WHERE id_usuario = ?', [role.nombre, numUid]);
        }
      }
      addedCount++;
    }

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'ASIGNAR_GRUPO', ?, '127.0.0.1', datetime('now'))
    `, [`Asignación de ${addedCount} usuario(s) al grupo institucional "${grupo.nombre}"`]);

    res.json({
      success: true,
      message: `Se asignaron ${addedCount} usuario(s) al grupo "${grupo.nombre}"`,
      data: { total_asignados: addedCount }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remover usuario de un grupo institucional
router.delete('/seguridad/grupos/:id/usuarios/:id_usuario', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id, id_usuario } = req.params;

    const grupo = await queryOne('SELECT nombre FROM grupos WHERE id_grupo = ?', [id]);
    const user = await queryOne('SELECT username FROM usuarios WHERE id_usuario = ?', [id_usuario]);

    await runQuery('DELETE FROM usuario_grupos WHERE id_grupo = ? AND id_usuario = ?', [id, id_usuario]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'DESVINCULAR_GRUPO', ?, '127.0.0.1', datetime('now'))
    `, [`Desvinculación del usuario @${user?.username || id_usuario} del grupo institucional "${grupo?.nombre || id}"`]);

    res.json({ success: true, message: `Usuario desvinculado del grupo "${grupo?.nombre || ''}"` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remover todos los usuarios de un grupo institucional
router.delete('/seguridad/grupos/:id/usuarios', async (req, res) => {
  try {
    const { runQuery, queryOne } = await import('../db/database.ts');
    const { id } = req.params;

    const grupo = await queryOne('SELECT nombre FROM grupos WHERE id_grupo = ?', [id]);
    const countBefore = await queryOne('SELECT COUNT(*) as count FROM usuario_grupos WHERE id_grupo = ?', [id]);

    await runQuery('DELETE FROM usuario_grupos WHERE id_grupo = ?', [id]);

    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'SEGURIDAD', 'DESVINCULAR_TODOS_GRUPO', ?, '127.0.0.1', datetime('now'))
    `, [`Se retiraron todos los ${countBefore?.count || 0} miembros del grupo institucional "${grupo?.nombre || id}"`]);

    res.json({ success: true, message: `Se retiraron todos los miembros del grupo "${grupo?.nombre || ''}"` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtener grafo completo de Arquitectura de Seguridad: USUARIO -> GRUPOS & ROLES -> PERMISOS -> MÓDULOS
router.get('/seguridad/arquitectura', async (req, res) => {
  try {
    const { queryAll } = await import('../db/database.ts');

    const usuarios = await queryAll(`
      SELECT 
        u.id_usuario, u.username, u.nombres, u.apellidos, u.email, u.cargo, u.estado,
        COALESCE(r.id_rol, 7) AS id_rol,
        COALESCE(r.nombre, 'INVITADO') AS rol_nombre,
        COALESCE(r.emoji, '⚪') AS rol_emoji,
        COALESCE(r.color, 'slate') AS rol_color
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      ORDER BY u.apellidos, u.nombres
    `);

    const grupos = await queryAll(`
      SELECT 
        g.id_grupo, g.codigo, g.nombre, g.descripcion, g.emoji, g.color, g.id_rol_defecto, g.estado,
        r.nombre AS rol_defecto_nombre
      FROM grupos g
      LEFT JOIN roles r ON g.id_rol_defecto = r.id_rol
      ORDER BY g.id_grupo ASC
    `);

    const usuarioGrupos = await queryAll('SELECT id_usuario, id_grupo FROM usuario_grupos');

    const roles = await queryAll(`
      SELECT 
        r.id_rol, r.nombre, r.descripcion, r.emoji, r.color, r.estado,
        (SELECT COUNT(*) FROM usuario_roles ur WHERE ur.id_rol = r.id_rol) AS total_usuarios
      FROM roles r
      ORDER BY r.id_rol ASC
    `);

    const modulos = await queryAll(`
      SELECT id_modulo, codigo, nombre, descripcion, icono, orden, estado
      FROM modulos
      ORDER BY orden ASC
    `);

    const permisos = await queryAll(`
      SELECT id_permiso, codigo, nombre, descripcion
      FROM permisos
      ORDER BY id_permiso ASC
    `);

    // Cruzar grupos en cada usuario
    const usuariosConGrupos = usuarios.map((u: any) => {
      const gIds = usuarioGrupos.filter((ug: any) => ug.id_usuario === u.id_usuario).map((ug: any) => ug.id_grupo);
      const userGrupos = grupos.filter((g: any) => gIds.includes(g.id_grupo));
      return {
        ...u,
        grupos: userGrupos
      };
    });

    res.json({
      success: true,
      data: {
        usuarios: usuariosConGrupos,
        grupos,
        roles,
        permisos,
        modulos,
        relaciones: {
          usuario_grupos: usuarioGrupos
        },
        stats: {
          totalUsuarios: usuarios.length,
          totalGrupos: grupos.length,
          totalRoles: roles.length,
          totalPermisos: permisos.length,
          totalModulos: modulos.length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ASIGNACIÓN ACADÉMICA (SEDE, ESCUELA, CARRERA, AULAS)
// ============================================================================
router.get('/seguridad/asignacion-academica', async (req, res) => {
  try {
    const { queryAll, runQuery } = await import('../db/database.ts');
    const rol = (req.query.rol as string) || 'SUPERADMIN';
    const grupo = (req.query.grupo as string) || 'Administración TI';
    const apartado = (req.query.apartado as string) || 'TODOS';

    // Asegurar existencia de tabla
    await runQuery(`
      CREATE TABLE IF NOT EXISTS asignacion_academica (
        id_asignacion INTEGER PRIMARY KEY AUTOINCREMENT,
        rol_codigo TEXT NOT NULL,
        grupo_nombre TEXT NOT NULL,
        apartado TEXT NOT NULL,
        id_entidad INTEGER NOT NULL,
        codigo_entidad TEXT,
        nombre_entidad TEXT NOT NULL,
        crear INTEGER DEFAULT 1,
        leer INTEGER DEFAULT 1,
        actualizar INTEGER DEFAULT 1,
        eliminar INTEGER DEFAULT 0,
        fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rol_codigo, grupo_nombre, apartado, id_entidad)
      )
    `);

    // Verificar registros existentes y poblar apartados faltantes
    let existing = await queryAll(
      'SELECT * FROM asignacion_academica WHERE rol_codigo = ? AND grupo_nombre = ?',
      [rol, grupo]
    );

    const isSuper = rol === 'SUPERADMIN' || rol === 'ADMINISTRADOR';
    const isCoord = rol === 'COORDINADOR';
    const isDocente = rol === 'DOCENTE';

    const apartadosPresentes = new Set(existing.map((item: any) => item.apartado));

    // 1. Sedes
    if (!apartadosPresentes.has('SEDE')) {
      const sedes = await queryAll('SELECT id_sede as id, codigo, nombre FROM sede WHERE estado = "ACTIVA"');
      for (const s of sedes) {
        await runQuery(`
          INSERT OR IGNORE INTO asignacion_academica 
          (rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar)
          VALUES (?, ?, 'SEDE', ?, ?, ?, ?, ?, ?, ?)
        `, [rol, grupo, s.id, s.codigo, s.nombre, isSuper ? 1 : (isCoord ? 1 : 0), 1, isSuper ? 1 : (isCoord ? 1 : 0), isSuper ? 1 : 0]);
      }
    }

    // 2. Escuelas
    if (!apartadosPresentes.has('ESCUELA')) {
      const escuelas = await queryAll('SELECT id_escuela as id, codigo, nombre FROM escuela WHERE estado = "ACTIVA"');
      for (const e of escuelas) {
        await runQuery(`
          INSERT OR IGNORE INTO asignacion_academica 
          (rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar)
          VALUES (?, ?, 'ESCUELA', ?, ?, ?, ?, ?, ?, ?)
        `, [rol, grupo, e.id, e.codigo, e.nombre, isSuper ? 1 : (isCoord ? 1 : 0), 1, isSuper ? 1 : (isCoord ? 1 : 0), isSuper ? 1 : 0]);
      }
    }

    // 3. Carreras
    if (!apartadosPresentes.has('CARRERA')) {
      const carreras = await queryAll('SELECT id_carrera as id, codigo, nombre FROM carrera WHERE estado = "ACTIVA"');
      for (const c of carreras) {
        await runQuery(`
          INSERT OR IGNORE INTO asignacion_academica 
          (rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar)
          VALUES (?, ?, 'CARRERA', ?, ?, ?, ?, ?, ?, ?)
        `, [rol, grupo, c.id, c.codigo, c.nombre, isSuper ? 1 : (isCoord ? 1 : 0), 1, isSuper ? 1 : (isCoord ? 1 : 0), isSuper ? 1 : 0]);
      }
    }

    // 4. Aulas (Todas las 65 aulas y laboratorios institucionales oficiales)
    if (!apartadosPresentes.has('AULA')) {
      const aulas = await queryAll('SELECT id_aula_laboratorio as id, codigo, nombre, tipo FROM aula_laboratorio ORDER BY id_bloque, piso, codigo');
      for (const a of aulas) {
        await runQuery(`
          INSERT OR IGNORE INTO asignacion_academica 
          (rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar)
          VALUES (?, ?, 'AULA', ?, ?, ?, ?, ?, ?, ?)
        `, [rol, grupo, a.id, a.codigo, a.nombre, isSuper ? 1 : (isCoord || isDocente ? 1 : 0), 1, isSuper ? 1 : 1, isSuper ? 1 : 0]);
      }
    }

    // 5. Bloques (Pabellones / Edificios)
    if (!apartadosPresentes.has('BLOQUE')) {
      const bloques = await queryAll('SELECT id_bloque as id, codigo, nombre FROM bloque WHERE estado = "ACTIVO"');
      for (const b of bloques) {
        await runQuery(`
          INSERT OR IGNORE INTO asignacion_academica 
          (rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar)
          VALUES (?, ?, 'BLOQUE', ?, ?, ?, ?, ?, ?, ?)
        `, [rol, grupo, b.id, b.codigo, b.nombre, isSuper ? 1 : (isCoord ? 1 : 0), 1, isSuper ? 1 : (isCoord ? 1 : 0), isSuper ? 1 : 0]);
      }
    }

    // Limpiar apartados retirados si existen en la base de datos
    await runQuery(`
      DELETE FROM asignacion_academica 
      WHERE apartado IN ('PARALELO', 'HORARIO', 'JORNADA', 'NIVEL', 'DOCENTE', 'ASIGNATURA')
    `);

    // Recargar registros existentes válidos
    existing = await queryAll(
      'SELECT * FROM asignacion_academica WHERE rol_codigo = ? AND grupo_nombre = ?',
      [rol, grupo]
    );

    // Filtrar por apartado si no es 'TODOS'
    let data = existing;
    if (apartado && apartado !== 'TODOS') {
      data = existing.filter((item: any) => item.apartado === apartado.toUpperCase());
    }

    // Resumen de conteos
    const counts = {
      sedes: existing.filter((item: any) => item.apartado === 'SEDE').length,
      escuelas: existing.filter((item: any) => item.apartado === 'ESCUELA').length,
      carreras: existing.filter((item: any) => item.apartado === 'CARRERA').length,
      aulas: existing.filter((item: any) => item.apartado === 'AULA').length,
      bloques: existing.filter((item: any) => item.apartado === 'BLOQUE').length
    };

    res.json({
      success: true,
      data,
      counts,
      rol,
      grupo
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Conmutar un permiso individual de asignación académica
router.post('/seguridad/asignacion-academica/toggle', async (req, res) => {
  try {
    const { runQuery, queryAll } = await import('../db/database.ts');
    const { id_asignacion, campo, valor } = req.body;

    if (!['crear', 'leer', 'actualizar', 'eliminar'].includes(campo)) {
      return res.status(400).json({ success: false, message: 'Campo inválido' });
    }

    const current = await queryAll('SELECT * FROM asignacion_academica WHERE id_asignacion = ?', [id_asignacion]);
    if (!current || current.length === 0) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    }

    const nuevoValor = valor !== undefined ? (valor ? 1 : 0) : (current[0][campo] === 1 ? 0 : 1);
    await runQuery(`UPDATE asignacion_academica SET ${campo} = ?, fecha_actualizacion = datetime('now') WHERE id_asignacion = ?`, [nuevoValor, id_asignacion]);

    // Registrar en auditoría
    await runQuery(`
      INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha)
      VALUES (1, 'ACADEMICO', 'ASIGNACION_CAMBIO', ?, '127.0.0.1', datetime('now'))
    `, [`Modificado permiso '${campo.toUpperCase()}' a ${nuevoValor} en entidad ${current[0].nombre_entidad} (${current[0].apartado}) para ${current[0].rol_codigo}/${current[0].grupo_nombre}`]);

    const updated = await queryAll('SELECT * FROM asignacion_academica WHERE id_asignacion = ?', [id_asignacion]);
    res.json({ success: true, data: updated[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Crear nueva asignación académica
router.post('/seguridad/asignacion-academica/nueva', async (req, res) => {
  try {
    const { runQuery, queryAll } = await import('../db/database.ts');
    const { rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar } = req.body;

    await runQuery(`
      INSERT OR REPLACE INTO asignacion_academica 
      (rol_codigo, grupo_nombre, apartado, id_entidad, codigo_entidad, nombre_entidad, crear, leer, actualizar, eliminar, fecha_actualizacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      rol_codigo,
      grupo_nombre,
      apartado.toUpperCase(),
      id_entidad || Date.now(),
      codigo_entidad || '',
      nombre_entidad,
      crear ? 1 : 0,
      leer ? 1 : 0,
      actualizar ? 1 : 0,
      eliminar ? 1 : 0
    ]);

    res.json({ success: true, message: 'Asignación académica guardada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Restablecer asignaciones académicas por defecto
router.post('/seguridad/asignacion-academica/reset', async (req, res) => {
  try {
    const { runQuery } = await import('../db/database.ts');
    const { rol, grupo } = req.body;
    if (rol && grupo) {
      await runQuery('DELETE FROM asignacion_academica WHERE rol_codigo = ? AND grupo_nombre = ?', [rol, grupo]);
    } else {
      await runQuery('DELETE FROM asignacion_academica');
    }
    res.json({ success: true, message: 'Asignaciones restablecidas' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reportes
router.get('/reportes/estadisticas', ReporteController.getEstadisticas);

export default router;
