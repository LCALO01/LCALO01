import { Catalogos, AulaLaboratorio, AulaRecomendada, PlanificacionCompleta, UserSession, ValidationCrucesResult } from '../types.ts';

export class ApiClient {
  static async getCatalogos(): Promise<Catalogos> {
    const res = await fetch('/api/catalogos');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error cargando catálogos');
    return json.data;
  }

  static async getAulas(filters: Record<string, any> = {}): Promise<AulaLaboratorio[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const res = await fetch(`/api/aulas?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error cargando aulas');
    return json.data;
  }

  static async getAulasRecomendadas(filters: Record<string, any> = {}): Promise<AulaRecomendada[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const res = await fetch(`/api/aulas/recomendadas?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error cargando aulas recomendadas');
    return json.data;
  }

  static async updateAulaEstado(id: number, estado: string): Promise<boolean> {
    const res = await fetch(`/api/aulas/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error actualizando estado del aula');
    return true;
  }

  static async getPlanificaciones(filters: Record<string, any> = {}): Promise<PlanificacionCompleta[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const res = await fetch(`/api/planificaciones?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error cargando planificaciones');
    return json.data;
  }

  static async validarCruces(data: any): Promise<ValidationCrucesResult> {
    const res = await fetch('/api/planificaciones/validar-cruces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  }

  static async createPlanificacion(data: any): Promise<PlanificacionCompleta> {
    const res = await fetch('/api/planificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Error al guardar la asignación');
    }
    return json.data;
  }

  static async updatePlanificacion(id: number, data: any): Promise<PlanificacionCompleta> {
    const res = await fetch(`/api/planificaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Error al actualizar la asignación');
    }
    return json.data;
  }

  static async deletePlanificacion(id: number): Promise<boolean> {
    const res = await fetch(`/api/planificaciones/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error eliminando asignación');
    return true;
  }

  static async deleteAllPlanificaciones(): Promise<boolean> {
    const res = await fetch('/api/planificaciones/all', {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error eliminando todos los registros');
    return true;
  }

  static async asignacionAutomatica(payload: {
    id_periodo?: number;
    id_carrera?: number;
    id_sede?: number;
    simulacion?: boolean;
  }): Promise<any> {
    const res = await fetch('/api/planificaciones/asignacion-automatica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error en la asignación automática');
    return json;
  }

  static async syncEstadosAulas(): Promise<AulaLaboratorio[]> {
    const res = await fetch('/api/aulas/sync-estados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error sincronizando estados de aulas');
    return json.data;
  }

  static async getEstadisticas(): Promise<any> {
    const res = await fetch('/api/reportes/estadisticas');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error cargando estadísticas');
    return json.data;
  }

  static async login(username: string, password?: string): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error de autenticación');
    return json.user;
  }

  static async switchRole(rol: string): Promise<any> {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol }),
    });
    const json = await res.json();
    return json;
  }

  // Métodos CRUD para Catálogos Maestros (Módulo 2)
  static async getCatalogEntity(entity: string): Promise<any[]> {
    const res = await fetch(`/api/catalogos/${entity}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || `Error al obtener ${entity}`);
    return json.data;
  }

  static async createCatalogItem(entity: string, data: any): Promise<any> {
    const res = await fetch(`/api/catalogos/${entity}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || `Error al crear registro en ${entity}`);
    return json.data;
  }

  static async updateCatalogItem(entity: string, id: number, data: any): Promise<any> {
    const res = await fetch(`/api/catalogos/${entity}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || `Error al actualizar registro en ${entity}`);
    return json.data;
  }

  static async toggleCatalogItemEstado(entity: string, id: number, estado?: string): Promise<string> {
    const res = await fetch(`/api/catalogos/${entity}/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || `Error al cambiar estado en ${entity}`);
    return json.nuevoEstado;
  }

  static async deleteCatalogItem(entity: string, id: number): Promise<boolean> {
    const res = await fetch(`/api/catalogos/${entity}/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || `Error al eliminar registro de ${entity}`);
    return true;
  }

  // Métodos de asignación de Asignaturas por Carrera
  static async getCarreraAsignaturas(): Promise<any[]> {
    const res = await fetch('/api/carrera-asignaturas');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al obtener asignaciones');
    return json.data;
  }

  static async assignAsignaturaToCarrera(id_carrera: number, id_asignatura: number): Promise<any> {
    const res = await fetch('/api/carrera-asignaturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_carrera, id_asignatura }),
    });
    const json = await res.json();
    if (!json.success) {
      const err: any = new Error(json.message || 'Error al asignar asignatura a carrera');
      err.errorCode = json.error_code;
      err.details = json;
      throw err;
    }
    return json;
  }

  static async unassignAsignaturaFromCarrera(id_carrera: number, id_asignatura: number): Promise<any> {
    const res = await fetch('/api/carrera-asignaturas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_carrera, id_asignatura }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al retirar asignatura');
    return json;
  }

  static async unassignAllAsignaturasFromCarrera(id_carrera: number): Promise<any> {
    const res = await fetch(`/api/carrera-asignaturas/carrera/${id_carrera}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al retirar asignaturas');
    return json;
  }

  // Métodos directos de asignación de Aula (Drag & Drop)
  static async asignarAulaDirecta(data: { id_planificacion?: number; id_asignatura?: number; id_aula_laboratorio: number }): Promise<any> {
    const res = await fetch('/api/planificaciones/asignar-aula-directa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      const err: any = new Error(json.message || 'Error al asignar aula');
      err.errorCode = json.error_code;
      err.details = json;
      throw err;
    }
    return json;
  }

  static async retirarAulaDirecta(data: { id_planificacion?: number; id_asignatura?: number }): Promise<any> {
    const res = await fetch('/api/planificaciones/retirar-aula-directa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al retirar aula');
    return json;
  }
}
