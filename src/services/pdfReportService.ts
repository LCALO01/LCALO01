import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PlanificacionCompleta, AulaLaboratorio } from '../types.ts';

export interface WeeklyMatrixDay {
  dayId: number;
  dayName: string;
  formattedDate: string;
  isoDate: string;
}

export interface WeeklyMatrixCellData {
  wd: WeeklyMatrixDay;
  totalHours: number;
  classes: PlanificacionCompleta[];
  semaforo: 'DISPONIBLE' | 'EN_PROCESO' | 'OCUPADO';
  slotKey: string;
}

export interface WeeklyMatrixRowData {
  aula: AulaLaboratorio;
  dayData: WeeklyMatrixCellData[];
  totalAulaHours: number;
}

export interface SemaforoStats {
  verdeCount: number;
  amarilloCount: number;
  rojoCount: number;
  total: number;
}

export interface ExportMatrixPdfOptions {
  matrixData: WeeklyMatrixRowData[];
  weekDays: WeeklyMatrixDay[];
  columnTotals: number[];
  totalGridHours: number;
  semaforoStats: SemaforoStats;
  filtros?: {
    bloque?: string;
    tipo?: string;
    semaforo?: string;
    busqueda?: string;
  };
  filename?: string;
}

export interface ExportPlanificacionesDetallePdfOptions {
  planificaciones: PlanificacionCompleta[];
  titulo?: string;
  subtitulo?: string;
  filtrosAplicados?: Record<string, string>;
  filename?: string;
}

export class PdfReportService {
  /**
   * Genera y descarga el reporte oficial en PDF de la Planificación Semanal de Aulas
   * con la cuadrícula de días y colores de semaforización (Rojo, Amarillo, Verde).
   */
  static exportPlanificacionSemanalPDF(options: ExportMatrixPdfOptions) {
    const {
      matrixData,
      weekDays,
      columnTotals,
      totalGridHours,
      semaforoStats,
      filtros,
      filename = `planificacion_aulas_semana_${weekDays[0]?.formattedDate || 'actual'}.pdf`
    } = options;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;

    // 1. BANNER INSTITUCIONAL SUPERIOR (Color morado corporativo)
    doc.setFillColor(40, 7, 64); // #280740
    doc.rect(0, 0, pageWidth, 54, 'F');

    // Barra dorada de acento
    doc.setFillColor(229, 168, 0); // #e5a800
    doc.rect(0, 52, pageWidth, 3, 'F');

    // Título institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('INSTITUTO SUPERIOR UNIVERSITARIO - SISTEMA DE GESTIÓN DE AULAS', margin, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(253, 230, 138); // amber-200
    doc.text(
      `REPORTE DE PLANIFICACIÓN SEMANAL DE AULAS CON SEMAFORIZACIÓN • SEDE MATRIZ • PERIODO 2026-1`,
      margin,
      40
    );

    // Fecha / Rango
    const fechaInicio = weekDays[0]?.formattedDate || '';
    const fechaFin = weekDays[6]?.formattedDate || '';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Semana: ${fechaInicio} al ${fechaFin}`, pageWidth - margin - 150, 32);

    // 2. CINTA INFORMATIVA Y REGLAS DE SEMAFORIZACIÓN
    const ribbonY = 64;

    // Caja de filtros activos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    let filterText = `Aulas mostradas: ${matrixData.length} | Horas Totales: ${totalGridHours.toFixed(1)} :Hrs`;
    if (filtros?.bloque && filtros.bloque !== 'TODOS') filterText += ` | Bloque: ${filtros.bloque}`;
    if (filtros?.tipo && filtros.tipo !== 'TODOS') filterText += ` | Tipo: ${filtros.tipo}`;
    if (filtros?.semaforo && filtros.semaforo !== 'TODOS') filterText += ` | Semáforo: ${filtros.semaforo}`;
    if (filtros?.busqueda) filterText += ` | Filtro: "${filtros.busqueda}"`;

    doc.text(filterText, margin, ribbonY + 8);

    // Indicadores visuales de semáforo en el encabezado
    const kpiStartX = pageWidth - margin - 320;
    const kpiWidth = 100;
    const kpiHeight = 16;

    // ROJO: OCUPADO
    doc.setFillColor(248, 215, 218); // #f8d7da
    doc.roundedRect(kpiStartX, ribbonY - 2, kpiWidth, kpiHeight, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(132, 32, 41); // #842029
    doc.text(`* Rojo: Ocupado (${semaforoStats.rojoCount})`, kpiStartX + 6, ribbonY + 9);

    // AMARILLO: EN PROCESO
    doc.setFillColor(255, 243, 205); // #fff3cd
    doc.roundedRect(kpiStartX + kpiWidth + 6, ribbonY - 2, kpiWidth, kpiHeight, 3, 3, 'F');
    doc.setTextColor(102, 77, 3); // #664d03
    doc.text(`* Amarillo: Proceso (${semaforoStats.amarilloCount})`, kpiStartX + kpiWidth + 10, ribbonY + 9);

    // VERDE: DISPONIBLE
    doc.setFillColor(212, 248, 211); // #d4f8d3
    doc.roundedRect(kpiStartX + (kpiWidth * 2) + 12, ribbonY - 2, kpiWidth - 8, kpiHeight, 3, 3, 'F');
    doc.setTextColor(15, 81, 50); // #0f5132
    doc.text(`* Verde: Libre (${semaforoStats.verdeCount})`, kpiStartX + (kpiWidth * 2) + 16, ribbonY + 9);

    // 3. TABLA DE LA MATRIZ SEMANAL
    const headColumns = [
      'AULA / ESPACIO',
      ...weekDays.map(wd => `${wd.formattedDate}\n${wd.dayName.toUpperCase()}`)
    ];

    const bodyRows = matrixData.map(row => {
      const aulaText = `${row.aula.codigo} - ${row.aula.tipo === 'LABORATORIO' ? 'LAB' : 'AULA'}\nCap. ${row.aula.capacidad} est.`;
      
      const dayCols = row.dayData.map(d => {
        let label = 'Disponible';
        if (d.semaforo === 'OCUPADO') label = 'Ocupado';
        else if (d.semaforo === 'EN_PROCESO') label = 'En Proceso';

        if (d.totalHours > 0) {
          return `${d.totalHours.toFixed(1)} :Hrs\n(${label})`;
        }
        return `0.0 :Hrs\n(${label})`;
      });

      return [aulaText, ...dayCols];
    });

    // Fila de totales
    const totalsRow = [
      `TOTALES (${matrixData.length} Aulas)\n${totalGridHours.toFixed(1)} :Hrs Totales`,
      ...columnTotals.map(t => `${t.toFixed(1)} :Hrs\nProgramadas`)
    ];

    autoTable(doc, {
      startY: 86,
      head: [headColumns],
      body: [...bodyRows, totalsRow],
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 3.5,
        halign: 'center',
        valign: 'middle',
        lineColor: [203, 213, 225], // slate-300
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [40, 7, 64], // #280740 morado
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 7.5
      },
      columnStyles: {
        0: {
          halign: 'left',
          fontStyle: 'bold',
          cellWidth: 100,
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42]
        }
      },
      margin: { left: margin, right: margin, bottom: 35 },
      didParseCell: (data) => {
        // Estilización de la fila de totales
        if (data.row.index === bodyRows.length) {
          data.cell.styles.fillColor = [241, 245, 249]; // slate-100
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontStyle = 'bold';
          return;
        }

        // Colorear cada celda de día según el semáforo
        if (data.section === 'body' && data.column.index > 0 && data.row.index < matrixData.length) {
          const rowData = matrixData[data.row.index];
          const cellDay = rowData?.dayData[data.column.index - 1];

          if (cellDay) {
            if (cellDay.semaforo === 'OCUPADO') {
              // ROJO
              data.cell.styles.fillColor = [248, 215, 218]; // #f8d7da
              data.cell.styles.textColor = [132, 32, 41];   // #842029
              data.cell.styles.fontStyle = 'bold';
            } else if (cellDay.semaforo === 'EN_PROCESO') {
              // AMARILLO
              data.cell.styles.fillColor = [255, 243, 205]; // #fff3cd
              data.cell.styles.textColor = [102, 77, 3];    // #664d03
              data.cell.styles.fontStyle = 'bold';
            } else {
              // VERDE
              data.cell.styles.fillColor = [212, 248, 211]; // #d4f8d3
              data.cell.styles.textColor = [15, 81, 50];    // #0f5132
              data.cell.styles.fontStyle = 'normal';
            }
          }
        }
      }
    });

    // 4. PIE DE PÁGINA EN TODAS LAS HOJAS
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Línea divisoria inferior
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      
      const fechaEmision = new Date().toLocaleString('es-EC');
      doc.text(
        `Emitido el: ${fechaEmision} • Sistema de Gestión y Planificación de Aulas • Instituto Superior Universitario`,
        margin,
        pageHeight - 12
      );

      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin - 50,
        pageHeight - 12
      );
    }

    // 5. Descargar el archivo PDF
    doc.save(filename);
  }

  /**
   * Genera y descarga el reporte oficial en PDF con la lista detallada
   * de planificaciones académicas y asignaciones de aulas.
   */
  static exportPlanificacionesDetallePDF(options: ExportPlanificacionesDetallePdfOptions) {
    const {
      planificaciones,
      titulo = 'REPORTE DETALLADO DE ASIGNACIONES Y PLANIFICACIÓN DE AULAS',
      subtitulo = 'Periodo Académico 2026-1 • Sede Matriz Quito • Instituto Superior Universitario',
      filtrosAplicados,
      filename = 'reporte_planificaciones_aulas_detalle.pdf'
    } = options;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;

    // 1. BANNER INSTITUCIONAL
    doc.setFillColor(40, 7, 64); // #280740
    doc.rect(0, 0, pageWidth, 52, 'F');

    doc.setFillColor(229, 168, 0); // #e5a800
    doc.rect(0, 50, pageWidth, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, margin, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(253, 230, 138);
    doc.text(subtitulo, margin, 40);

    // Metadatos
    const totalHoras = planificaciones.reduce((s, p) => s + (p.numero_horas || 0), 0);
    const totalEstudiantes = planificaciones.reduce((s, p) => s + (p.numero_estudiantes || 0), 0);
    const unificadosCount = planificaciones.filter(p => p.curso_unificado === 1).length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Total Asignaciones: ${planificaciones.length}`, pageWidth - margin - 150, 24);
    doc.text(`Estudiantes: ${totalEstudiantes} | Horas: ${totalHoras}`, pageWidth - margin - 150, 40);

    // 2. BARRA DE RESUMEN EJECUTIVO
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 60, pageWidth - (margin * 2), 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, 60, pageWidth - (margin * 2), 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    let resumenStr = `Registros activos: ${planificaciones.length} | Horas semanales: ${totalHoras} :Hrs | Cursos unificados: ${unificadosCount}`;
    if (filtrosAplicados) {
      const fEntries = Object.entries(filtrosAplicados).filter(([_, v]) => Boolean(v));
      if (fEntries.length > 0) {
        resumenStr += ` | Filtros: ${fEntries.map(([k, v]) => `${k}=${v}`).join(', ')}`;
      }
    }
    doc.text(resumenStr, margin + 8, 74);

    // 3. CUERPO DE LA TABLA
    const head = [
      [
        '#',
        'ESPACIO / AULA',
        'BLOQUE/PISO',
        'CARRERA',
        'ASIGNATURA',
        'DOCENTE',
        'NIVEL/PAR.',
        'DÍA',
        'HORARIO',
        'EST./CAP.',
        'ESTADO'
      ]
    ];

    const body = planificaciones.map((p, idx) => {
      const docente = `${p.docente_nombres?.split(' ')[0] || ''} ${p.docente_apellidos?.split(' ')[0] || ''}`;
      const ocupacionPct = p.aula_capacidad > 0 ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) : 0;
      const estadoStr = p.curso_unificado === 1 ? 'UNIFICADO' : (p.estado || 'ACTIVO');

      return [
        idx + 1,
        `${p.aula_codigo}\n(${p.aula_tipo === 'LABORATORIO' ? 'LAB' : 'AULA'})`,
        `${p.bloque_codigo}\nPiso ${p.aula_piso}`,
        (p.carrera_nombre || '').slice(0, 22),
        `${p.asignatura_codigo ? `[${p.asignatura_codigo}] ` : ''}${p.asignatura_nombre || ''}`.slice(0, 30),
        docente,
        `${p.nivel_nombre || `Nivel ${p.id_nivel}`}\nPar. ${p.paralelo_codigo || 'A'}`,
        p.dia_nombre ? p.dia_nombre.slice(0, 3).toUpperCase() : 'N/A',
        `${p.hora_inicio || ''} - ${p.hora_fin || ''}`,
        `${p.numero_estudiantes}/${p.aula_capacidad}\n(${ocupacionPct}%)`,
        estadoStr
      ];
    });

    autoTable(doc, {
      startY: 88,
      head: head,
      body: body,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [40, 7, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 7.5
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 55 },
        2: { halign: 'center', cellWidth: 50 },
        3: { fontStyle: 'bold', cellWidth: 85 },
        4: { cellWidth: 120 },
        5: { fontStyle: 'bold', cellWidth: 75 },
        6: { halign: 'center', cellWidth: 45 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
        8: { halign: 'center', cellWidth: 65 },
        9: { halign: 'center', cellWidth: 45 },
        10: { halign: 'center', fontStyle: 'bold', cellWidth: 55 }
      },
      margin: { left: margin, right: margin, bottom: 35 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 10) {
          const val = String(data.cell.raw || '').toUpperCase();
          if (val.includes('UNIFICADO') || val.includes('PROCESO') || val.includes('PENDIENTE')) {
            data.cell.styles.fillColor = [255, 243, 205]; // amarillo pastel
            data.cell.styles.textColor = [102, 77, 3];
          } else if (val.includes('ACTIVO') || val.includes('OCUPADO')) {
            data.cell.styles.fillColor = [248, 215, 218]; // rojo pastel
            data.cell.styles.textColor = [132, 32, 41];
          } else {
            data.cell.styles.fillColor = [212, 248, 211]; // verde pastel
            data.cell.styles.textColor = [15, 81, 50];
          }
        }
      }
    });

    // 4. PIE DE PÁGINA
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      
      const fechaEmision = new Date().toLocaleString('es-EC');
      doc.text(
        `Emitido el: ${fechaEmision} • Reporte Oficial de Planificaciones Académicas • Instituto Superior Universitario`,
        margin,
        pageHeight - 12
      );

      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin - 50,
        pageHeight - 12
      );
    }

    doc.save(filename);
  }
}
