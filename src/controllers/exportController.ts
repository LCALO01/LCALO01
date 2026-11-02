import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PlanificacionCompleta, AulaLaboratorio } from '../types.ts';
import { PdfReportService } from '../services/pdfReportService.ts';

export { PdfReportService };

export class ExportController {
  // Servicio especializado de reportes en PDF utilizando jsPDF
  static exportPlanificacionSemanalPDF = PdfReportService.exportPlanificacionSemanalPDF;
  static exportPlanificacionesDetallePDF = PdfReportService.exportPlanificacionesDetallePDF;
  // ==========================================
  // EXPORTAR ASIGNACIONES: CSV
  // ==========================================
  static exportAsignacionesCSV(items: PlanificacionCompleta[], filename = 'asignaciones_aulas_isuj.csv') {
    const headers = [
      '#',
      'Sede',
      'Escuela',
      'Carrera',
      'Nivel',
      'Asignatura',
      'Docente',
      'Docente CI',
      'Paralelo',
      'Jornada',
      'Bloque',
      'Piso',
      'Aula / Lab.',
      'Capacidad del aula',
      'Número de estudiantes',
      'Aforo / Ocupación %',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
      'Fecha inicio',
      'Fecha fin',
      'Total clases',
      'Estado / Unificado'
    ];

    const getDaySchedule = (p: PlanificacionCompleta, dayNum: number, dayKey: string) => {
      const diaUpper = (p.dia_nombre || '').toUpperCase();
      if ((p.id_dia === dayNum || diaUpper.includes(dayKey)) && p.hora_inicio && p.hora_fin) {
        return `${p.hora_inicio} - ${p.hora_fin}`;
      }
      return '-';
    };

    const rows = items.map((p, idx) => {
      const fullSede = (p.sede_nombre || 'UIO_NORTE').toUpperCase().replace(/\s*ISPADE/g, '').trim();
      const fullEscuela = p.escuela_nombre 
        ? (p.escuela_nombre.toUpperCase().startsWith('ESCUELA') ? p.escuela_nombre.toUpperCase() : `ESCUELA DE ${p.escuela_nombre.toUpperCase()}`)
        : 'ESCUELA DE TECNOLOGIAS';
      const percent = p.aula_capacidad > 0 
        ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) 
        : 0;
      const estadoUnif = p.curso_unificado === 1 
        ? `Unificado (${p.unificada_carrera || 'Sección unificada'})` 
        : 'Regular (Sin Duplicado)';

      return [
        idx + 1,
        `"${fullSede}"`,
        `"${fullEscuela}"`,
        `"${p.carrera_nombre || ''}"`,
        `"${p.nivel_nombre || `NIVEL ${p.id_nivel || 1}`}"`,
        `"${p.asignatura_codigo ? `[${p.asignatura_codigo}] ` : ''}${p.asignatura_nombre}"`,
        `"${p.docente_nombres} ${p.docente_apellidos}"`,
        `"${p.docente_ci || ''}"`,
        `"${p.paralelo_codigo || 'A'}"`,
        `"${p.jornada_nombre || 'MATUTINA'}"`,
        `"${p.bloque_nombre || 'BLOQUE A'}"`,
        `"${p.aula_piso === 0 ? 'PB' : p.aula_piso ? `Piso ${p.aula_piso}` : 'Piso 1'}"`,
        `"${p.aula_codigo} - ${p.aula_nombre || p.aula_tipo}"`,
        p.aula_capacidad,
        p.numero_estudiantes,
        `"${percent}%"`,
        `"${getDaySchedule(p, 1, 'LUN')}"`,
        `"${getDaySchedule(p, 2, 'MAR')}"`,
        `"${getDaySchedule(p, 3, 'MIE')}"`,
        `"${getDaySchedule(p, 4, 'JUE')}"`,
        `"${getDaySchedule(p, 5, 'VIE')}"`,
        `"${getDaySchedule(p, 6, 'SAB')}"`,
        `"${getDaySchedule(p, 7, 'DOM')}"`,
        `"${p.id_periodo === 2 ? '2026-09-01' : '2026-03-01'}"`,
        `"${p.id_periodo === 2 ? '2027-02-28' : '2026-08-31'}"`,
        p.total_clases || 16,
        `"${estadoUnif}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  // ==========================================
  // EXPORTAR ASIGNACIONES: XLSX
  // ==========================================
  static exportAsignacionesXLSX(items: PlanificacionCompleta[], filename = 'asignaciones_aulas_isuj.xlsx') {
    const getDaySchedule = (p: PlanificacionCompleta, dayNum: number, dayKey: string) => {
      const diaUpper = (p.dia_nombre || '').toUpperCase();
      if ((p.id_dia === dayNum || diaUpper.includes(dayKey)) && p.hora_inicio && p.hora_fin) {
        return `${p.hora_inicio} - ${p.hora_fin}`;
      }
      return '-';
    };

    const data = items.map((p, idx) => {
      const fullSede = (p.sede_nombre || 'UIO_NORTE').toUpperCase().replace(/\s*ISPADE/g, '').trim();
      const fullEscuela = p.escuela_nombre 
        ? (p.escuela_nombre.toUpperCase().startsWith('ESCUELA') ? p.escuela_nombre.toUpperCase() : `ESCUELA DE ${p.escuela_nombre.toUpperCase()}`)
        : 'ESCUELA DE TECNOLOGIAS';
      const percent = p.aula_capacidad > 0 
        ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) 
        : 0;

      return {
        '#': idx + 1,
        'Sede': fullSede,
        'Escuela': fullEscuela,
        'Carrera': p.carrera_nombre,
        'Nivel': p.nivel_nombre || `NIVEL ${p.id_nivel || 1}`,
        'Asignatura': `${p.asignatura_codigo ? `[${p.asignatura_codigo}] ` : ''}${p.asignatura_nombre}`,
        'Docente': `${p.docente_nombres} ${p.docente_apellidos}`,
        'Docente CI': p.docente_ci || '',
        'Paralelo': p.paralelo_codigo || 'A',
        'Jornada': p.jornada_nombre || 'MATUTINA',
        'Bloque': p.bloque_nombre || 'BLOQUE A',
        'Piso': p.aula_piso === 0 ? 'PB' : p.aula_piso ? `Piso ${p.aula_piso}` : 'Piso 1',
        'Aula / Lab.': `${p.aula_codigo} - ${p.aula_nombre || p.aula_tipo}`,
        'Capacidad del aula': p.aula_capacidad,
        'Número de estudiantes': p.numero_estudiantes,
        'Aforo / Ocupación': `${percent}%`,
        'Lunes': getDaySchedule(p, 1, 'LUN'),
        'Martes': getDaySchedule(p, 2, 'MAR'),
        'Miércoles': getDaySchedule(p, 3, 'MIE'),
        'Jueves': getDaySchedule(p, 4, 'JUE'),
        'Viernes': getDaySchedule(p, 5, 'VIE'),
        'Sábado': getDaySchedule(p, 6, 'SAB'),
        'Domingo': getDaySchedule(p, 7, 'DOM'),
        'Fecha inicio': p.id_periodo === 2 ? '2026-09-01' : '2026-03-01',
        'Fecha fin': p.id_periodo === 2 ? '2027-02-28' : '2026-08-31',
        'Total clases': p.total_clases || 16,
        'Estado / Unificado': p.curso_unificado === 1 ? `Unificado (${p.unificada_carrera || ''})` : 'Regular'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaciones Aulas');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR ASIGNACIONES: PDF
  // ==========================================
  static exportAsignacionesPDF(items: PlanificacionCompleta[], filename = 'reporte_asignacion_aulas_isuj.pdf') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // Encabezado institucional ISUJ
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 842, 60, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('INSTITUTO SUPERIOR UNIVERSITARIO JAPÓN - GESTIÓN DE AULAS', 40, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('REPORTE OFICIAL DE ASIGNACIÓN DE AULAS Y ESPACIOS EDUCATIVOS - PERIODO ACADÉMICO 2026-1', 40, 44);

    // Meta información
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC')}`, 40, 80);
    doc.text(`Total registros asignados: ${items.length}`, 400, 80);
    doc.text(`Base de datos: Relacional SQLite (Modelo-Vista-Controlador)`, 600, 80);

    const tableBody = items.map(p => [
      `${p.bloque_codigo}\nP.${p.aula_piso}`,
      `${p.aula_codigo}\n(${p.aula_tipo === 'LABORATORIO' ? 'LAB' : 'AULA'})`,
      `${p.numero_estudiantes} / ${p.aula_capacidad}\n(${Math.round((p.numero_estudiantes / p.aula_capacidad) * 100)}%)`,
      `${p.dia_nombre || ''}\n${p.hora_inicio}-${p.hora_fin}`,
      `${p.carrera_codigo}\n${p.carrera_nombre.slice(0, 24)}...`,
      `${p.asignatura_nombre.slice(0, 32)}${p.curso_unificado ? ' [UNIF]' : ''}`,
      `${p.docente_nombres ? p.docente_nombres.split(' ')[0] : ''} ${p.docente_apellidos ? p.docente_apellidos.split(' ')[0] : ''}\nCI: ${p.docente_ci || ''}`,
      p.jornada_nombre
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Bloque/Piso', 'Aula', 'Est./Cap.', 'Día / Horario', 'Carrera', 'Asignatura', 'Docente', 'Jornada']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 40, right: 40 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${i} de ${pageCount} - Sistema MVC de Gestión y Asignación de Aulas ISUJ`, 40, 575);
    }

    doc.save(filename);
  }

  // ==========================================
  // EXPORTAR DISPONIBILIDAD DE AULAS: PDF
  // ==========================================
  static exportAulasPDF(aulas: AulaLaboratorio[], filename = 'reporte_registros_aulas_isuj.pdf') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 842, 58, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('INSTITUTO SUPERIOR UNIVERSITARIO JAPÓN - GESNET ACADÉMICO', 40, 24);
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('REPORTE OFICIAL DE REGISTROS: INVENTARIO DE AULAS Y LABORATORIOS INSTITUCIONAL', 40, 42);

    const body = aulas.map((a, idx) => {
      const estudiantes = a.max_estudiantes || a.total_estudiantes || 0;
      const isCoworking = a.codigo === 'B5' || a.tipo === 'COWORKING';
      const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(a.codigo);
      const isNoDisponible = a.estado === 'INACTIVO' || isC1toC4;
      const capText = isCoworking ? 'Coworking' : isC1toC4 ? 'N/A' : isNoDisponible ? 'N/A' : `${a.capacidad} est.`;
      const tipoText = isCoworking ? 'COWORKING' : a.tipo === 'LABORATORIO' ? 'Laboratorio' : 'Aula Regular';
      const estadoText = isC1toC4 ? 'N/A' : isNoDisponible ? 'NO DISPONIBLE' : a.estado;

      return [
        idx + 1,
        a.sede_nombre || 'UIO_NORTE',
        a.bloque_nombre || 'BLOQUE',
        `Piso ${a.piso}`,
        a.codigo,
        a.nombre,
        capText,
        tipoText,
        estadoText
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Sede', 'Bloque', 'Piso', 'Código', 'Nombre del Espacio', 'Capacidad', 'Tipología', 'Estado']],
      body: body,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 3.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 30, right: 30 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { cellWidth: 45 },
        3: { halign: 'center', cellWidth: 35 },
        4: { fontStyle: 'bold', cellWidth: 45 },
        6: { halign: 'center', fontStyle: 'bold', cellWidth: 50 },
        7: { halign: 'center', cellWidth: 55 },
        8: { halign: 'center', fontStyle: 'bold', cellWidth: 60 }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${i} de ${pageCount} • Verificación Minuciosa de Espacios Físicos ISUJ • Total: ${aulas.length} registros`, 30, 565);
    }

    doc.save(filename);
  }

  // ==========================================
  // EXPORTAR DISPONIBILIDAD DE AULAS: XLSX
  // ==========================================
  static exportAulasXLSX(aulas: AulaLaboratorio[], filename = 'reporte_registros_aulas_isuj.xlsx') {
    const data = aulas.map((a, idx) => {
      const isCoworking = a.codigo === 'B5' || a.tipo === 'COWORKING';
      const isNoDisponible = a.estado === 'INACTIVO' || ['C1', 'C2', 'C3', 'C4'].includes(a.codigo);
      const capDesc = isCoworking 
        ? 'Coworking (No es aula)' 
        : isNoDisponible 
        ? 'N/A' 
        : `${a.capacidad} puestos`;

      const dictamen = isCoworking 
        ? 'Espacio Coworking Colaborativo (No es aula regular)'
        : isNoDisponible
        ? 'Aula No Disponible (N/A - Fuera de servicio / En adecuación)'
        : a.estado === 'OCUPADO'
        ? 'Aula Ocupada con clases vigentes'
        : a.estado === 'MANTENIMIENTO'
        ? 'En Mantenimiento Técnico'
        : 'Aula Disponible y Verificada';

      return {
        'Nº': idx + 1,
        'Sede': a.sede_nombre || 'UIO_NORTE (Campus Matriz)',
        'Bloque': a.bloque_nombre,
        'Piso': a.piso === 0 ? 'Planta Baja (PB)' : `Piso ${a.piso}`,
        'Código Aula': a.codigo,
        'Nombre Espacio': a.nombre,
        'Tipología': isCoworking ? 'COWORKING' : a.tipo,
        'Capacidad Aula (Puestos)': (['C1', 'C2', 'C3', 'C4'].includes(a.codigo) || isNoDisponible) ? 'N/A' : isCoworking ? 'Coworking' : a.capacidad,
        'Capacidad Detallada': capDesc,
        'Estado Operativo': ['C1', 'C2', 'C3', 'C4'].includes(a.codigo) ? 'N/A' : isNoDisponible ? 'NO DISPONIBLE' : a.estado,
        'Diagnóstico Verificación': dictamen,
        'Recursos / Equipamiento': a.recursos || 'Pizarra, mobiliario y proyección',
        'Clases Asignadas': a.clases_activas_count || 0
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aulas y Laboratorios');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR BLOQUES INSTITUCIONALES: XLSX
  // ==========================================
  static exportBloquesXLSX(
    bloques: any[], 
    aulas: AulaLaboratorio[] = [], 
    filename = 'bloques_institucionales_isuj.xlsx'
  ) {
    const dataBloques = bloques.map((b, idx) => {
      const aulasDelBloque = aulas.filter(a => a.id_bloque === b.id_bloque || a.bloque_nombre === b.nombre);
      const capTotal = aulasDelBloque.reduce((acc, a) => acc + (a.capacidad || 0), 0);
      return {
        'Nº': idx + 1,
        'Código Bloque': b.codigo,
        'Nombre del Bloque': b.nombre,
        'Sede Institucional': b.sede_nombre || 'UIO_NORTE',
        'Plantas / Pisos': b.pisos || 1,
        'Total Espacios / Aulas': aulasDelBloque.length,
        'Capacidad Instalada (Puestos)': capTotal,
        'Estado': b.estado || 'ACTIVO',
        'Descripción': b.descripcion || 'Bloque arquitectónico institucional'
      };
    });

    const dataDistribucion = aulas.map((a, idx) => ({
      'ORD': idx + 1,
      'Bloque': a.bloque_nombre || 'N/A',
      'Aula / Espacio': a.nombre,
      'Código': a.codigo,
      'Capacidad (Puestos)': ['C1', 'C2', 'C3', 'C4'].includes(a.codigo) ? 'N/A' : (a.codigo === 'B5' || a.tipo === 'COWORKING') ? 'Coworking' : a.capacidad,
      'Piso': a.piso === 0 ? 'PB' : `Piso ${a.piso}`,
      'Sede': a.sede_nombre || 'UIO_NORTE',
      'Tipo': a.tipo,
      'Estado': ['C1', 'C2', 'C3', 'C4'].includes(a.codigo) ? 'N/A' : (a.estado === 'INACTIVO' ? 'NO DISPONIBLE' : a.estado)
    }));

    const wb = XLSX.utils.book_new();
    const wsBloques = XLSX.utils.json_to_sheet(dataBloques);
    XLSX.utils.book_append_sheet(wb, wsBloques, 'Bloques');

    if (dataDistribucion.length > 0) {
      const wsDist = XLSX.utils.json_to_sheet(dataDistribucion);
      XLSX.utils.book_append_sheet(wb, wsDist, 'Distribución Aulas');
    }

    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR CATÁLOGO ACADÉMICO COMPLETO: XLSX (Multi-Hoja)
  // ==========================================
  static exportCatalogoAcademicoCompletoXLSX(
    catalogos: any, 
    aulas: AulaLaboratorio[] = [], 
    filename = 'catalogo_academico_completo_isuj.xlsx'
  ) {
    const wb = XLSX.utils.book_new();

    // 1. Sedes
    if (catalogos.sedes && catalogos.sedes.length > 0) {
      const dataSedes = catalogos.sedes.map((s: any, idx: number) => ({
        'Nº': idx + 1,
        'Código': s.codigo,
        'Nombre': s.nombre,
        'Dirección': s.direccion || 'Av. Principal',
        'Ciudad': s.ciudad || 'Quito',
        'Campus': s.campus || 'Norte',
        'Teléfono': s.telefono || 'N/A',
        'Estado': s.estado || 'ACTIVO'
      }));
      const wsSedes = XLSX.utils.json_to_sheet(dataSedes);
      XLSX.utils.book_append_sheet(wb, wsSedes, '1_Sedes');
    }

    // 2. Bloques
    if (catalogos.bloques && catalogos.bloques.length > 0) {
      const dataBloques = catalogos.bloques.map((b: any, idx: number) => {
        const aulasDelBloque = aulas.filter(a => a.id_bloque === b.id_bloque);
        return {
          'Nº': idx + 1,
          'Código': b.codigo,
          'Nombre': b.nombre,
          'Sede': b.sede_nombre || 'UIO_NORTE',
          'Pisos': b.pisos || 1,
          'Total Aulas': aulasDelBloque.length,
          'Estado': b.estado || 'ACTIVO',
          'Descripción': b.descripcion || ''
        };
      });
      const wsBloques = XLSX.utils.json_to_sheet(dataBloques);
      XLSX.utils.book_append_sheet(wb, wsBloques, '2_Bloques');
    }

    // 3. Aulas y Laboratorios
    if (aulas && aulas.length > 0) {
      const dataAulas = aulas.map((a, idx) => ({
        'Nº': idx + 1,
        'Código': a.codigo,
        'Nombre': a.nombre,
        'Bloque': a.bloque_nombre,
        'Piso': a.piso === 0 ? 'PB' : `Piso ${a.piso}`,
        'Tipo': a.tipo,
        'Capacidad': a.capacidad,
        'Recursos': a.recursos || '',
        'Estado': a.estado
      }));
      const wsAulas = XLSX.utils.json_to_sheet(dataAulas);
      XLSX.utils.book_append_sheet(wb, wsAulas, '3_Aulas_y_Laboratorios');
    }

    // 4. Escuelas
    if (catalogos.escuelas && catalogos.escuelas.length > 0) {
      const dataEscuelas = catalogos.escuelas.map((e: any, idx: number) => ({
        'Nº': idx + 1,
        'Código': e.codigo,
        'Nombre': e.nombre,
        'Decano / Director': e.decano || e.director || 'Por Asignar',
        'Estado': e.estado || 'ACTIVO'
      }));
      const wsEscuelas = XLSX.utils.json_to_sheet(dataEscuelas);
      XLSX.utils.book_append_sheet(wb, wsEscuelas, '4_Escuelas');
    }

    // 5. Carreras
    if (catalogos.carreras && catalogos.carreras.length > 0) {
      const dataCarreras = catalogos.carreras.map((c: any, idx: number) => ({
        'Nº': idx + 1,
        'Código': c.codigo,
        'Nombre': c.nombre,
        'Escuela': c.escuela_nombre || 'N/A',
        'Modalidad': c.modalidad || 'PRESENCIAL',
        'Duración (Semestres)': c.duracion_semestres || 5,
        'Estado': c.estado || 'ACTIVO'
      }));
      const wsCarreras = XLSX.utils.json_to_sheet(dataCarreras);
      XLSX.utils.book_append_sheet(wb, wsCarreras, '5_Carreras');
    }

    // 6. Periodos Lectivos
    if (catalogos.periodos && catalogos.periodos.length > 0) {
      const dataPeriodos = catalogos.periodos.map((p: any, idx: number) => ({
        'Nº': idx + 1,
        'Código': p.codigo,
        'Nombre': p.nombre,
        'Fecha Inicio': p.fecha_inicio || '',
        'Fecha Fin': p.fecha_fin || '',
        'Estado': p.estado || 'ACTIVO'
      }));
      const wsPeriodos = XLSX.utils.json_to_sheet(dataPeriodos);
      XLSX.utils.book_append_sheet(wb, wsPeriodos, '6_Periodos_Lectivos');
    }

    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR SEDES: XLSX
  // ==========================================
  static exportSedesXLSX(sedes: any[], filename = 'sedes_institucionales_isuj.xlsx') {
    const data = sedes.map((s, idx) => ({
      'Nº': idx + 1,
      'Código': s.codigo,
      'Nombre de la Sede': s.nombre,
      'Dirección': s.direccion || 'N/A',
      'Ciudad': s.ciudad || 'Quito',
      'Campus': s.campus || 'Principal',
      'Teléfono': s.telefono || 'N/A',
      'Estado': s.estado || 'ACTIVO'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sedes');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR ESCUELAS: XLSX
  // ==========================================
  static exportEscuelasXLSX(escuelas: any[], filename = 'escuelas_institucionales_isuj.xlsx') {
    const data = escuelas.map((e, idx) => ({
      'Nº': idx + 1,
      'Código': e.codigo,
      'Nombre de la Escuela': e.nombre,
      'Decano / Director': e.decano || e.director || 'Por Asignar',
      'Estado': e.estado || 'ACTIVO'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Escuelas');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR CARRERAS: XLSX
  // ==========================================
  static exportCarrerasXLSX(carreras: any[], filename = 'carreras_institucionales_isuj.xlsx') {
    const data = carreras.map((c, idx) => ({
      'Nº': idx + 1,
      'Código': c.codigo,
      'Nombre de la Carrera': c.nombre,
      'Escuela': c.escuela_nombre || 'N/A',
      'Modalidad': c.modalidad || 'PRESENCIAL',
      'Duración': c.duracion_semestres ? `${c.duracion_semestres} Semestres` : '5 Semestres',
      'Estado': c.estado || 'ACTIVO'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Carreras');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR ASIGNATURAS POR NIVEL: XLSX
  // ==========================================
  static exportAsignaturasNivelXLSX(
    asignaturas: any[],
    carreras: any[] = [],
    planificaciones: any[] = [],
    filename = 'asignaturas_por_nivel_isuj.xlsx'
  ) {
    const carreraMap = new Map<number, string>();
    carreras.forEach(c => carreraMap.set(c.id_carrera, c.nombre));

    const getNivel = (asig: any): string => {
      if (asig.id_nivel) return `Nivel ${asig.id_nivel}`;
      if (asig.nivel_nombre) return asig.nivel_nombre;
      const plan = planificaciones.find(p => p.id_asignatura === asig.id_asignatura && p.nivel_nombre);
      if (plan && plan.nivel_nombre) return plan.nivel_nombre;
      const code = (asig.codigo_asignatura || '').toUpperCase().trim();
      const match = code.match(/([1-6])\d{2}/);
      if (match && match[1]) return `Nivel ${match[1]}`;
      return 'Nivel 1';
    };

    const getCarrera = (asig: any): string => {
      if (asig.carrera_nombre) return asig.carrera_nombre;
      if (asig.id_carrera && carreraMap.has(asig.id_carrera)) return carreraMap.get(asig.id_carrera)!;
      const plan = planificaciones.find(p => p.id_asignatura === asig.id_asignatura && p.carrera_nombre);
      if (plan && plan.carrera_nombre) return plan.carrera_nombre;
      return 'TRONCO COMÚN';
    };

    const data = asignaturas.map((a, idx) => ({
      'Nº': idx + 1,
      'Sede': a.sede || 'UIO_NORTE',
      'Escuela': a.escuela || 'TIC',
      'Carrera': getCarrera(a),
      'Nivel / Semestre': getNivel(a),
      'Código': a.codigo_asignatura || `ASIG_${idx + 1}`,
      'Nombre de la Asignatura': a.nombre || a.asignatura || 'Sin Asignar',
      'Número de Estudiantes': a.numero_estudiantes ?? a['Número de Estudiantes'] ?? 30,
      'Jornada': a.jornada || 'MATUTINA',
      'Aulas no disponibles': a.aulas_no_disponibles || a['Aulas no disponibles'] || 'C1, C2, C3, C4',
      'Horas Totales': a.horas_totales || 0,
      'Créditos': a.creditos || 0,
      'Disponibilidad': a.estado === 'NO DISPONIBLE' || a.disponible === false ? 'NO DISPONIBLE' : 'DISPONIBLE',
      'Estado': a.estado || 'ACTIVA'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaturas_Por_Nivel');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR PERIODOS: XLSX
  // ==========================================
  static exportPeriodosXLSX(periodos: any[], filename = 'periodos_lectivos_isuj.xlsx') {
    const data = periodos.map((p, idx) => ({
      'Nº': idx + 1,
      'Código': p.codigo,
      'Nombre del Periodo': p.nombre,
      'Fecha Inicio': p.fecha_inicio || '',
      'Fecha Fin': p.fecha_fin || '',
      'Estado': p.estado || 'ACTIVO'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Periodos');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR SEMÁFORO DE AULAS: XLSX
  // ==========================================
  static exportSemaforoAulasXLSX(
    aulas: AulaLaboratorio[],
    planificaciones: PlanificacionCompleta[],
    filtroEstado = 'TODOS',
    filename = 'semaforo_aulas_isuj.xlsx'
  ) {
    const data = aulas
      .filter(a => filtroEstado === 'TODOS' || a.estado === filtroEstado)
      .map((a, idx) => {
        const plans = planificaciones.filter(p => p.id_aula_laboratorio === a.id_aula_laboratorio && p.estado === 'ACTIVO');
        const materias = plans.map(p => p.asignatura_nombre).join(', ') || 'Sin clases asignadas';
        const docentes = plans.map(p => `${p.docente_nombres} ${p.docente_apellidos}`).join(', ') || 'N/A';
        const maxEst = Math.max(...plans.map(p => p.numero_estudiantes), 0);
        const ocupPct = a.capacidad > 0 ? Math.round((maxEst / a.capacidad) * 100) : 0;

        return {
          'Nº': idx + 1,
          'Código': a.codigo,
          'Espacio': a.nombre,
          'Bloque': a.bloque_nombre,
          'Piso': a.piso === 0 ? 'PB' : `Piso ${a.piso}`,
          'Tipo': a.tipo,
          'Capacidad': a.capacidad,
          'Estudiantes Ocupando': maxEst,
          'Ocupación %': `${ocupPct}%`,
          'Estado Semáforo': a.estado,
          'Clases Activas': plans.length,
          'Asignaturas Asignadas': materias,
          'Docentes': docentes
        };
      });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Semáforo Aulas');
    XLSX.writeFile(wb, filename);
  }

  // ==========================================
  // EXPORTAR DISPONIBILIDAD DE AULAS: CSV
  // ==========================================
  static exportAulasCSV(aulas: AulaLaboratorio[], filename = 'reporte_registros_aulas_isuj.csv') {
    const headers = ['Nro', 'Codigo', 'Nombre_Espacio', 'Bloque', 'Piso', 'Tipo', 'Capacidad_Aula', 'Numero_Estudiantes', 'Estado', 'Clases_Asignadas'];
    const rows = aulas.map((a, idx) => [
      idx + 1,
      `"${a.codigo}"`,
      `"${a.nombre}"`,
      `"${a.bloque_nombre}"`,
      a.piso,
      `"${a.tipo}"`,
      a.capacidad,
      a.max_estudiantes || a.total_estudiantes || 0,
      `"${a.estado}"`,
      a.clases_activas_count || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
