import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ModalDescargarPDF = ({ isOpen, onClose, datos }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descargando, setDescargando] = useState(false);

  // ========================================================================
  // FUNCIÓN PARA FILTRAR DATOS POR RANGO DE FECHAS
  // ========================================================================

  const filtrarPorFechas = (datos, inicio, fin) => {
    if (!inicio || !fin) return datos;
    
    return datos.filter((d) => {
      const fecha = new Date(d.date);
      const desde = new Date(inicio);
      const hasta = new Date(fin);
      return fecha >= desde && fecha <= hasta;
    });
  };

  // ========================================================================
  // FUNCIÓN PARA DESCARGAR PDF
  // ========================================================================

  const descargarPDF = async (tipoDescarga) => {
    try {
      setDescargando(true);

      // Filtrar datos según tipo
      let datosADescargar = datos;
      let nombreArchivo = 'reporte-cultivos';

      if (tipoDescarga === 'rango') {
        if (!fechaInicio || !fechaFin) {
          alert('Por favor selecciona ambas fechas');
          return;
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
          alert('La fecha inicio debe ser menor que la fecha fin');
          return;
        }

        datosADescargar = filtrarPorFechas(datos, fechaInicio, fechaFin);
        nombreArchivo = `reporte-cultivos-${fechaInicio}-${fechaFin}`;

        if (datosADescargar.length === 0) {
          alert('No hay registros en ese rango de fechas');
          return;
        }
      } else {
        nombreArchivo = `reporte-cultivos-completo-${new Date().toISOString().slice(0, 10)}`;
      }

      // Crear documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // ENCABEZADO
      doc.setFontSize(16);
      doc.text(' Reporte de Viabilidad de Cultivos', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 22, { align: 'center' });

      // RESUMEN
      if (tipoDescarga === 'rango') {
        doc.text(`Período: ${fechaInicio} a ${fechaFin}`, 15, 30);
      } else {
        doc.text(`Período: Todos los registros (${datos.length} total)`, 15, 30);
      }
      doc.text(`Registros a mostrar: ${datosADescargar.length}`, 15, 37);

      // TABLA
      const columnasTabla = ['Fecha', 'Temp (°C)', 'Humedad (%)', 'Radiación (W/m²)', 'Precip. (mm)', 'Cultivos Viables'];

      const filasTabla = datosADescargar.map((d) => {
        const viables = [
          d.tomate === 'Sí' && 'Tomate',
          d.banana === 'Sí' && 'Banana',
          d.cacao === 'Sí' && 'Cacao',
          d.arroz === 'Sí' && 'Arroz',
          d.maiz === 'Sí' && 'Maíz',
        ].filter(Boolean).join(', ');

        return [
          d.date,
          d.temperatura.toFixed(1),
          d.humedad,
          Math.round(d.radiacion_solar),
          d.precipitacion,
          viables || 'Ninguno',
        ];
      });

      autoTable(doc, {
        head: [columnasTabla],
        body: filasTabla,
        startY: 45,
        margin: 10,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 144, 255], // Azul
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255], // Azul muy claro
        },
        didDrawPage: (data) => {
          // Pie de página
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.getHeight();
          const pageWidth = pageSize.getWidth();

          doc.setFontSize(8);
          doc.text(
            `Página ${data.pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        },
      });

      // DESCARGAR
      doc.save(`${nombreArchivo}.pdf`);
      
      // Cerrar modal después de descargar
      setTimeout(() => {
        onClose();
        setFechaInicio('');
        setFechaFin('');
      }, 1000);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar PDF. Verifica la consola.');
    } finally {
      setDescargando(false);
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <>
      {/* OVERLAY (fondo oscuro) */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in">
          {/* ENCABEZADO DEL MODAL */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Download className="text-blue-600" size={28} />
              Descargar PDF
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* CONTENIDO DEL MODAL */}
          <div className="space-y-4">
            {/* OPCIÓN 1: RANGO DE FECHAS */}
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-gray-800 mb-3">📅 Descargar por Rango</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Desde:</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hasta:</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  onClick={() => descargarPDF('rango')}
                  disabled={descargando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {descargando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Descargar Rango
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SEPARADOR */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500 font-semibold">O</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* OPCIÓN 2: DESCARGAR TODO */}
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-gray-800 mb-3">📊 Descargar Todo</h3>
              
              <p className="text-sm text-gray-600 mb-3">
                Descargar todos los {datos.length} registros en un PDF
              </p>

              <button
                onClick={() => descargarPDF('todo')}
                disabled={descargando}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {descargando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Descargar Completo
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-2">
                ⏱️ Esto puede tardar 5-10 segundos
              </p>
            </div>
          </div>

          {/* BOTÓN CERRAR */}
          <button
            onClick={onClose}
            className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalDescargarPDF;