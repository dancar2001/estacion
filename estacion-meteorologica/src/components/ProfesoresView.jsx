import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Zap, RefreshCw, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import PredictorCultivos from './PredictorCultivos';
import ModalDescargarPDF from './Modaldescargarpdf';
import AnalisisKMeans from './AnalisisKMeans';
import Papa from 'papaparse';

const ProfesoresView = ({ user, apiBaseUrl, onLogout }) => {
  const [activeTab, setActiveTab] = useState('analisis');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalDescargaOpen, setModalDescargaOpen] = useState(false)
  
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // ========================================================================
  // CARGAR CSV
  // ========================================================================

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ Cargar CSV desde public
      const response = await fetch('/cultivos_viabilidad_FINAL.csv');
      const csvText = await response.text();
      
      // Parsear con PapaParse
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Convertir datos del CSV al formato esperado
          const datosParseados = results.data.map((row) => ({
            date: row.date || '',
            temperatura: parseFloat(row.Temperatura) || 0,
            radiacion_solar: parseFloat(row.RadiacionsolarpromediokWm2) || 0,
            humedad_suelo: parseFloat(row.HumedadSuelo) || 0,
            humedad: parseFloat(row.Humedadrelativa) || 0,
            precipitacion: parseFloat(row.Pluviometria) || 0,
            tomate: row.Tomate || 'No',
            banana: row.Banana || 'No',
            cacao: row.Cacao || 'No',
            arroz: row.Arroz || 'No',
            maiz: row.Maiz || 'No',
          }));

          setDatos(datosParseados);
          setError(null);
          setPaginaActual(1);
          console.log(`✅ CSV cargado: ${datosParseados.length} registros`);
        },
        error: (error) => {
          console.error('❌ Error parsing CSV:', error);
          setError('Error al cargar CSV');
        }
      });
    } catch (err) {
      console.error('Error cargando CSV:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ========================================================================
  // CALCULAR ESTADÍSTICAS
  // ========================================================================

  const calcularEstadisticas = () => {
    if (datos.length === 0) return null;

    const temps = datos.map((d) => d.temperatura);
    const humeds = datos.map((d) => d.humedad);
    const radiaciones = datos.map((d) => d.radiacion_solar);

    return {
      totalRegistros: datos.length,
      tempPromedio: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2),
      humedadPromedio: (humeds.reduce((a, b) => a + b, 0) / humeds.length).toFixed(2),
      radiacionPromedio: (radiaciones.reduce((a, b) => a + b, 0) / radiaciones.length).toFixed(0),
      tempMax: Math.max(...temps).toFixed(2),
      humedadMax: Math.max(...humeds).toFixed(2),
    };
  };

  const stats = calcularEstadisticas();

  // ========================================================================
  // PREPARAR DATOS PARA GRÁFICOS
  // ========================================================================

  const datosGrafico = datos.slice(-30).map((d) => ({
    fecha: d.date,
    temp: d.temperatura,
    hum: d.humedad,
    rad: Math.round(d.radiacion_solar / 10),
    precip: d.precipitacion,
  }));

  const mockCropRecommendations = [
    { cultivo: 'Tomate', viabilidad: 72 },
    { cultivo: 'Banana', viabilidad: 88 },
    { cultivo: 'Cacao', viabilidad: 92 },
    { cultivo: 'Arroz', viabilidad: 80 },
    { cultivo: 'Maíz', viabilidad: 78 },
  ];

  // ========================================================================
  // CONTEO DE CULTIVOS VIABLES
  // ========================================================================

  const contarCultivosViables = () => {
    const cultivos = {
      tomate: datos.filter(d => d.tomate === 'Sí').length,
      banana: datos.filter(d => d.banana === 'Sí').length,
      cacao: datos.filter(d => d.cacao === 'Sí').length,
      arroz: datos.filter(d => d.arroz === 'Sí').length,
      maiz: datos.filter(d => d.maiz === 'Sí').length,
    };
    return cultivos;
  };

  const cultivosViables = contarCultivosViables();

  const datosporFuente = [
    { name: 'Cacao', value: cultivosViables.cacao },
    { name: 'Arroz', value: cultivosViables.arroz },
    { name: 'Banana', value: cultivosViables.banana },
    { name: 'Maíz', value: cultivosViables.maiz },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  // ========================================================================
  // LÓGICA DE PAGINACIÓN
  // ========================================================================

  const datosInvertidos = [...datos].reverse();
  const totalPaginas = Math.ceil(datosInvertidos.length / registrosPorPagina);
  
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const datosPaginados = datosInvertidos.slice(indiceInicio, indiceFin);

  const irPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const irPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const irPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  // ========================================================================
  // RENDERIZADO
  // ========================================================================

  if (loading && datos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-600 mt-4">Cargando datos del CSV...</p>
      </div>
    );
  }

  if (error && datos.length === 0) {
    return (
      <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl">
        {error}
        <button
          onClick={fetchAll}
          className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            👨‍🏫 Panel Avanzado de Profesor
          </h2>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS */}
      {stats && (
        <div className="grid md:grid-cols-5 gap-4">
          <div className="bg-blue-100 rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-700">Total Registros</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalRegistros}</p>
          </div>
          <div className="bg-red-100 rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-700">Temp Promedio</p>
            <p className="text-3xl font-bold text-red-600">{stats.tempPromedio}°C</p>
          </div>
          <div className="bg-purple-100 rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-700">Humedad Prom</p>
            <p className="text-3xl font-bold text-purple-600">{stats.humedadPromedio}%</p>
          </div>
          <div className="bg-yellow-100 rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-700">Radiación Prom</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.radiacionPromedio} W/m²</p>
          </div>
          <div className="bg-green-100 rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-700">Cacao Viable</p>
            <p className="text-3xl font-bold text-green-600">{cultivosViables.cacao} días</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex gap-2 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('analisis')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'analisis'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Análisis
          </button>
          <button
            onClick={() => setActiveTab('datos')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'datos'
                ? 'text-green-600 border-b-4 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Datos
          </button>
          <button
            onClick={() => setActiveTab('predictor')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'predictor'
                ? 'text-orange-600 border-b-4 border-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🌾 Predictor
          </button>
          <button
            onClick={() => setActiveTab('viabilidad')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'viabilidad'
                ? 'text-purple-600 border-b-4 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎯 Viabilidad
          </button>
          <button
            onClick={() => setActiveTab('kmeans')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'kmeans'
                ? 'text-indigo-600 border-b-4 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📚 K-Means
          </button>
        </div>
      </div>

      {/* TAB: ANÁLISIS */}
      {activeTab === 'analisis' && (
        <div className="space-y-6">
          {/* GRÁFICO LÍNEAS */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Tendencias Climáticas (Últimos 30)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temp" stroke="#ef4444" name="Temperatura (°C)" strokeWidth={2} />
                <Line type="monotone" dataKey="hum" stroke="#3b82f6" name="Humedad (%)" strokeWidth={2} />
                <Line type="monotone" dataKey="rad" stroke="#f59e0b" name="Radiación (×10 W/m²)" strokeWidth={2} />
                <Line type="monotone" dataKey="precip" stroke="#06b6d4" name="Precipitación (mm)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* GRÁFICOS DOBLES */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* RADAR */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Viabilidad de Cultivos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={mockCropRecommendations}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="cultivo" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Viabilidad %" dataKey="viabilidad" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* PASTEL */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Cultivos Viables por Año</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosporFuente}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosporFuente.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DATOS HISTÓRICOS CON PAGINACIÓN */}
      {activeTab === 'datos' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* ENCABEZADO CON BOTÓN DE DESCARGA A LA DERECHA */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">📋 Registros ({datosInvertidos.length} total)</h3>
            <button
              onClick={() => setModalDescargaOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              📥 Descargar
            </button>
          </div>

          {/* TABLA CON PAGINACIÓN */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Temp</th>
                  <th className="px-4 py-3 text-left font-semibold">Humedad</th>
                  <th className="px-4 py-3 text-left font-semibold">Radiación</th>
                  <th className="px-4 py-3 text-left font-semibold">Precip.</th>
                  <th className="px-4 py-3 text-left font-semibold">Cultivos Viables</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {datosPaginados.map((d, idx) => {
                  const viables = [
                    d.tomate === 'Sí' && 'Tomate',
                    d.banana === 'Sí' && 'Banana',
                    d.cacao === 'Sí' && 'Cacao',
                    d.arroz === 'Sí' && 'Arroz',
                    d.maiz === 'Sí' && 'Maíz',
                  ].filter(Boolean).join(', ');

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{d.date}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{d.temperatura}°C</td>
                      <td className="px-4 py-3 text-blue-600">{d.humedad}%</td>
                      <td className="px-4 py-3 text-yellow-600">{Math.round(d.radiacion_solar)} W/m²</td>
                      <td className="px-4 py-3 text-cyan-600">{d.precipitacion} mm</td>
                      <td className="px-4 py-3 text-sm font-semibold">{viables || 'Ninguno'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <button
              onClick={irPaginaAnterior}
              disabled={paginaActual === 1}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>

            <div className="flex gap-2 flex-wrap justify-center">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => irPagina(num)}
                  className={`px-3 py-2 rounded-lg font-semibold transition ${
                    paginaActual === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={irPaginaSiguiente}
              disabled={paginaActual === totalPaginas}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-600">
            Mostrando {indiceInicio + 1} a {Math.min(indiceFin, datosInvertidos.length)} de {datosInvertidos.length} registros
            <br />
            Página {paginaActual} de {totalPaginas}
          </div>
        </div>
      )}

      {/* TAB: PREDICTOR */}
      {activeTab === 'predictor' && datos.length > 0 && (
        <PredictorCultivos
          temperatura={datos[datos.length - 1]?.temperatura || 0}
          radiacion={datos[datos.length - 1]?.radiacion_solar / 100 || 0}
          humedadSuelo={datos[datos.length - 1]?.humedad_suelo || 0}
          humedadRelativa={datos[datos.length - 1]?.humedad || 0}
          pluviometria={datos[datos.length - 1]?.precipitacion || 0}
        />
      )}

      {/* TAB: VIABILIDAD */}
      {activeTab === 'viabilidad' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🌾 Análisis de Viabilidad por Cultivo</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(cultivosViables).map(([cultivo, dias]) => {
              const total = datos.length;
              const porcentaje = ((dias / total) * 100).toFixed(1);

              return (
                <div key={cultivo} className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-300">
                  <h4 className="font-bold text-gray-800 mb-3 capitalize">{cultivo}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-3xl font-bold text-green-600">{dias}</div>
                      <p className="text-xs text-gray-600">días viables</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">Porcentaje</p>
                      <p className="text-lg font-bold text-green-600">{porcentaje}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: K-MEANS */}
      {activeTab === 'kmeans' && (
        <AnalisisKMeans 
          variante="profesor"
          imagenClusters="/centroides.png"
          imagenCodo="/codo.png"
        />
      )}

      <ModalDescargarPDF
        isOpen={modalDescargaOpen}
        onClose={() => setModalDescargaOpen(false)}
        datos={datos}
      />
    </div>
  );
};

export default ProfesoresView;