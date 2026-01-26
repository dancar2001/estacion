import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Zap, RefreshCw, BarChart3, ChevronLeft, ChevronRight, Database, Thermometer, Droplets, CloudRain, Sun, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import PredictorCultivos from './PredictorCultivos';
import ModalDescargarPDF from './Modaldescargarpdf';
import AnalisisKMeans from './AnalisisKMeans';
import Papa from 'papaparse';

// ============================================================================
// URL DE FIREBASE
// ============================================================================
const FIREBASE_URL = "https://bdclimatico-cdb27-default-rtdb.firebaseio.com/sensores.json";

const ProfesoresView = ({ user, apiBaseUrl, onLogout }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  
  // ⭐ Estados para datos COMBINADOS
  const [datos, setDatos] = useState([]);           // COMBINADOS (CSV + Firebase) - para PDF
  const [datosCSV, setDatosCSV] = useState([]);     // Solo CSV
  const [datosFirebaseArray, setDatosFirebaseArray] = useState([]); // Firebase como array
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalDescargaOpen, setModalDescargaOpen] = useState(false);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // Estado para el último registro de Firebase (tiempo real)
  const [ultimoFirebase, setUltimoFirebase] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(false);
  const [errorFirebase, setErrorFirebase] = useState(null);

  // ========================================================================
  // FUNCIÓN PARA CALCULAR VIABILIDAD
  // ========================================================================
const calcularViabilidad = (temp, humedad, lluvia) => {
  return {
    // Tomate: 20-32°C, humedad 50-80%, lluvia moderada
    tomate: (temp >= 20 && temp <= 32 && lluvia >= 1 && lluvia <= 15 && humedad >= 50 && humedad <= 85) ? 'Sí' : 'No',
    
    // Banana: 20-32°C, lluvia moderada-alta
    banana: (temp >= 20 && temp <= 32 && lluvia >= 2 && lluvia <= 35) ? 'Sí' : 'No',
    
    // Cacao: 21-32°C, lluvia < 45mm (muy tolerante)
    cacao: (temp >= 21 && temp <= 32 && lluvia < 45) ? 'Sí' : 'No',
    
    // Arroz: 22-32°C, necesita más agua
    arroz: (temp >= 22 && temp <= 32 && lluvia >= 2 && lluvia <= 30) ? 'Sí' : 'No',
    
    // Maíz: 20-32°C, lluvia moderada
    maiz: (temp >= 20 && temp <= 32 && lluvia >= 1 && lluvia <= 20) ? 'Sí' : 'No',
  };
};

  // ========================================================================
  // ⭐ CARGAR DATOS DE FIREBASE Y CONVERTIR A FORMATO CSV
  // ========================================================================
  const fetchFirebase = useCallback(async () => {
    try {
      setLoadingFirebase(true);
      setErrorFirebase(null);

      const response = await fetch(FIREBASE_URL);
      const data = await response.json();

      if (data) {
        const registros = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));

const registrosObj = data;

// Obtener última key insertada (Firebase las ordena por tiempo)
const keys = Object.keys(registrosObj);

if (keys.length > 0) {
  const lastKey = keys[keys.length - 1];
  const ultimo = registrosObj[lastKey];

  setUltimoFirebase({
    temperatura: ultimo.temperatura || 0,
    humedad: ultimo.humedad || 0,
    humedad_suelo: ultimo.humedad_suelo || 0,
    lluvia: ultimo.lluvia < 0 ? 0 : ultimo.lluvia || 0,
    uvIndex: ultimo.uvIndex || 0,
    timestamp: ultimo.timestamp || '',
    totalRegistros: keys.length
  });
}


        // ⭐ CONVERTIR Firebase al formato del CSV
        const firebaseComoCSV = registros.map((r) => {
          const temp = r.temperatura || 0;
          const humedad = r.humedad || 0;
          const humedadSuelo = r.humedad_suelo || 0;
          const lluvia = r.lluvia < 0 ? 0 : r.lluvia || 0;  // Valores negativos = 0
          const uvIndex = r.uvIndex || 0;
          
          // ⭐ PARSEAR TIMESTAMP - puede ser número o string "YY/MM/DD"
          let fecha = new Date().toISOString().slice(0, 10);
          if (r.timestamp) {
if (typeof r.timestamp === 'string') {
  // Formato "DD/MM/YY HH:MM" → "26/01/25 14:40"
  const soloFecha = r.timestamp.split(' ')[0]; // Quita la hora, deja "26/01/25"
  const partes = soloFecha.split('/');
  if (partes.length === 3) {
fecha = r.timestamp;
  }
}else if (typeof r.timestamp === 'number') {
              const ts = r.timestamp > 10000000000 ? r.timestamp / 1000 : r.timestamp;
              fecha = new Date(ts * 1000).toISOString().slice(0, 10);
            }
          }

          const viabilidad = calcularViabilidad(temp, humedad, lluvia);

          return {
            date: fecha,
            temperatura: temp,
            radiacion_solar: uvIndex ,
            humedad_suelo: humedadSuelo,
            humedad: humedad,
            precipitacion: lluvia,
            tomate: viabilidad.tomate,
            banana: viabilidad.banana,
            cacao: viabilidad.cacao,
            arroz: viabilidad.arroz,
            maiz: viabilidad.maiz,
            fuente: 'firebase'
          };
        });

        setDatosFirebaseArray(firebaseComoCSV);
      }
    } catch (err) {
      console.error('Error Firebase:', err);
      setErrorFirebase('Error al conectar con sensores');
    } finally {
      setLoadingFirebase(false);
    }
  }, []);

  // ========================================================================
  // CARGAR CSV
  // ========================================================================
  const fetchCSV = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/cultivos_viabilidad_FINAL.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const datosParseados = results.data.map((row) => ({
            date: row.date || '',
            temperatura: parseFloat(row.Temperatura) || 0,
            radiacion_solar: (parseFloat(row.RadiacionsolarpromediokWm2) || 0),
            humedad_suelo: parseFloat(row.HumedadSuelo) || 0,
            humedad: parseFloat(row.Humedadrelativa) || 0,
            precipitacion: parseFloat(row.Pluviometria) || 0,
            tomate: row.Tomate || 'No',
            banana: row.Banana || 'No',
            cacao: row.Cacao || 'No',
            arroz: row.Arroz || 'No',
            maiz: row.Maiz || 'No',
            fuente: 'csv'
          }));

          setDatosCSV(datosParseados);
          setError(null);
          setPaginaActual(1);
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

  // ========================================================================
  // ⭐ COMBINAR CSV + FIREBASE
  // ========================================================================
  useEffect(() => {
    const fechasCSV = new Set(datosCSV.map(d => d.date));
    const firebaseNuevos = datosFirebaseArray.filter(d => !fechasCSV.has(d.date));
    
    const combinados = [...datosCSV, ...firebaseNuevos];
    combinados.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setDatos(combinados);

  }, [datosCSV, datosFirebaseArray]);

  // ========================================================================
  // EFECTOS
  // ========================================================================
  useEffect(() => {
    fetchCSV();
    fetchFirebase();

    const intervalFirebase = setInterval(fetchFirebase, 30000);
    return () => clearInterval(intervalFirebase);
  }, [fetchCSV, fetchFirebase]);

  // ========================================================================
  // ESTADÍSTICAS
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
  // GRÁFICOS
  // ========================================================================
  const datosGrafico = datos.slice(-30).map((d) => ({
    fecha: d.date,
    temp: d.temperatura,
    hum: d.humedad,
    rad: d.radiacion_solar,
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
    return {
      tomate: datos.filter(d => d.tomate === 'Sí').length,
      banana: datos.filter(d => d.banana === 'Sí').length,
      cacao: datos.filter(d => d.cacao === 'Sí').length,
      arroz: datos.filter(d => d.arroz === 'Sí').length,
      maiz: datos.filter(d => d.maiz === 'Sí').length,
    };
  };

  const cultivosViables = contarCultivosViables();

const datosporFuente = [
  { name: 'Tomate', value: cultivosViables.tomate },
  { name: 'Banana', value: cultivosViables.banana },
  { name: 'Cacao', value: cultivosViables.cacao },
  { name: 'Arroz', value: cultivosViables.arroz },
  { name: 'Maíz', value: cultivosViables.maiz },
];

const COLORS = ['#ef4444', '#f59e0b', '#8B4513', '#22c55e', '#eab308'];

  // ========================================================================
  // ⭐ DATOS PARA DASHBOARD RESUMEN
  // ========================================================================
  const datosDashboardResumen = useMemo(() => {
    if (datos.length === 0) return null;

    const totalDias = datos.length;
    
    // Calcular viabilidad por cultivo
    const viabilidadCultivos = {
      tomate: { dias: cultivosViables.tomate, porcentaje: ((cultivosViables.tomate / totalDias) * 100).toFixed(1) },
      banana: { dias: cultivosViables.banana, porcentaje: ((cultivosViables.banana / totalDias) * 100).toFixed(1) },
      cacao: { dias: cultivosViables.cacao, porcentaje: ((cultivosViables.cacao / totalDias) * 100).toFixed(1) },
      arroz: { dias: cultivosViables.arroz, porcentaje: ((cultivosViables.arroz / totalDias) * 100).toFixed(1) },
      maiz: { dias: cultivosViables.maiz, porcentaje: ((cultivosViables.maiz / totalDias) * 100).toFixed(1) },
    };

    // Datos para gráfico de pie de viabilidad promedio
    const totalViabilidad = Object.values(viabilidadCultivos).reduce((sum, c) => sum + parseFloat(c.porcentaje), 0);
    const datosViabilidadPie = [
      { name: 'Tomate', value: parseFloat(viabilidadCultivos.tomate.porcentaje), color: '#ef4444' },
      { name: 'Banana', value: parseFloat(viabilidadCultivos.banana.porcentaje), color: '#f59e0b' },
      { name: 'Cacao', value: parseFloat(viabilidadCultivos.cacao.porcentaje), color: '#8B4513' },
      { name: 'Arroz', value: parseFloat(viabilidadCultivos.arroz.porcentaje), color: '#22c55e' },
      { name: 'Maíz', value: parseFloat(viabilidadCultivos.maiz.porcentaje), color: '#eab308' },
    ];

    // Datos para gráfico de barras
    const datosBarra = [
      { cultivo: 'Tomate', dias: cultivosViables.tomate, color: '#ef4444' },
      { cultivo: 'Banana', dias: cultivosViables.banana, color: '#f59e0b' },
      { cultivo: 'Cacao', dias: cultivosViables.cacao, color: '#8B4513' },
      { cultivo: 'Arroz', dias: cultivosViables.arroz, color: '#22c55e' },
      { cultivo: 'Maíz', dias: cultivosViables.maiz, color: '#eab308' },
    ];

    // Clasificar perfiles climáticos
    let condicionesSecas = 0;
    let condicionesModeradas = 0;
    let excesoLluvias = 0;

    datos.forEach(d => {
      if (d.precipitacion < 5) condicionesSecas++;
      else if (d.precipitacion >= 5 && d.precipitacion <= 20) condicionesModeradas++;
      else excesoLluvias++;
    });

    const datosPerfilClimatico = [
      { name: 'Condiciones Secas', value: condicionesSecas, porcentaje: ((condicionesSecas / totalDias) * 100).toFixed(1), color: '#f59e0b' },
      { name: 'Condiciones Moderadas', value: condicionesModeradas, porcentaje: ((condicionesModeradas / totalDias) * 100).toFixed(1), color: '#22c55e' },
      { name: 'Exceso de Lluvias', value: excesoLluvias, porcentaje: ((excesoLluvias / totalDias) * 100).toFixed(1), color: '#3b82f6' },
    ];

    // Tendencia mensual de viabilidad
    const datosPorMes = {};
    datos.forEach(d => {
      const fecha = new Date(d.date);
      const mes = fecha.getMonth();
      if (!datosPorMes[mes]) {
        datosPorMes[mes] = { total: 0, tomate: 0, banana: 0, cacao: 0, arroz: 0, maiz: 0 };
      }
      datosPorMes[mes].total++;
      if (d.tomate === 'Sí') datosPorMes[mes].tomate++;
      if (d.banana === 'Sí') datosPorMes[mes].banana++;
      if (d.cacao === 'Sí') datosPorMes[mes].cacao++;
      if (d.arroz === 'Sí') datosPorMes[mes].arroz++;
      if (d.maiz === 'Sí') datosPorMes[mes].maiz++;
    });

    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tendenciaMensual = Object.entries(datosPorMes).map(([mes, data]) => ({
      mes: nombresMeses[parseInt(mes)],
      mesNum: parseInt(mes),
      tomate: data.total > 0 ? ((data.tomate / data.total) * 100).toFixed(1) : 0,
      banana: data.total > 0 ? ((data.banana / data.total) * 100).toFixed(1) : 0,
      cacao: data.total > 0 ? ((data.cacao / data.total) * 100).toFixed(1) : 0,
      arroz: data.total > 0 ? ((data.arroz / data.total) * 100).toFixed(1) : 0,
      maiz: data.total > 0 ? ((data.maiz / data.total) * 100).toFixed(1) : 0,
    })).sort((a, b) => a.mesNum - b.mesNum);

    // Encontrar mejor mes por cultivo
    const mejorMesPorCultivo = {};
    ['tomate', 'banana', 'cacao', 'arroz', 'maiz'].forEach(cultivo => {
      let mejorMes = tendenciaMensual[0];
      tendenciaMensual.forEach(m => {
        if (parseFloat(m[cultivo]) > parseFloat(mejorMes[cultivo])) {
          mejorMes = m;
        }
      });
      mejorMesPorCultivo[cultivo] = mejorMes.mes;
    });

    return {
      totalDias,
      viabilidadCultivos,
      datosViabilidadPie,
      datosBarra,
      datosPerfilClimatico,
      tendenciaMensual,
      mejorMesPorCultivo
    };
  }, [datos, cultivosViables]);

  // ========================================================================
  // PAGINACIÓN
  // ========================================================================
  const datosInvertidos = [...datos].reverse();
  const totalPaginas = Math.ceil(datosInvertidos.length / registrosPorPagina);
  
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const datosPaginados = datosInvertidos.slice(indiceInicio, indiceFin);

  const irPaginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const irPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
  };

  const irPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  // ========================================================================
  // COLORES PARA DASHBOARD RESUMEN
  // ========================================================================
  const COLORES_CULTIVOS = {
    tomate: '#ef4444',
    banana: '#f59e0b', 
    cacao: '#8B4513',
    arroz: '#22c55e',
    maiz: '#eab308'
  };

  const COLORES_CLIMA = ['#f59e0b', '#22c55e', '#3b82f6'];

  // ========================================================================
  // RENDER
  // ========================================================================
  if (loading && datos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-600 mt-4">Cargando datos...</p>
      </div>
    );
  }

  if (error && datos.length === 0) {
    return (
      <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl">
        {error}
        <button onClick={fetchCSV} className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
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
          <h2 className="text-2xl font-bold text-gray-800">👨‍🏫 Panel Avanzado de Profesor</h2>
          <div className="flex gap-2">
            <button
              onClick={fetchFirebase}
              disabled={loadingFirebase}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Database size={18} className={loadingFirebase ? 'animate-pulse' : ''} />
              {loadingFirebase ? 'Cargando...' : 'Firebase'}
            </button>
            <button
              onClick={() => { fetchCSV(); fetchFirebase(); }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refrescar
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className={`flex items-center gap-1 ${ultimoFirebase ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${ultimoFirebase ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {ultimoFirebase ? '🔴 EN VIVO' : 'Sin conexión'}
          </span>
          <span className="text-gray-500">📁 {datosCSV.length} CSV</span>
          <span className="text-gray-500">🔥 {datosFirebaseArray.length} Firebase</span>
          <span className="text-purple-600 font-bold">📊 {datos.length} TOTAL</span>
        </div>
      </div>

      {/* FIREBASE TIEMPO REAL */}
      {ultimoFirebase && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database size={24} />
            🔥 Sensores en Tiempo Real
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <Thermometer size={20} />
              <p className="text-3xl font-bold mt-2">{ultimoFirebase.temperatura}°C</p>
              <span className="text-sm">Temperatura</span>
            </div>
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <Droplets size={20} />
              <p className="text-3xl font-bold mt-2">{ultimoFirebase.humedad}%</p>
              <span className="text-sm">Humedad</span>
            </div>
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <Activity size={20} />
              <p className="text-3xl font-bold mt-2">{ultimoFirebase.humedad_suelo}%</p>
              <span className="text-sm">Hum. Suelo</span>
            </div>
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <CloudRain size={20} />
              <p className="text-3xl font-bold mt-2">{ultimoFirebase.lluvia} mm</p>
              <span className="text-sm">Lluvia</span>
            </div>
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <Sun size={20} />
              <p className="text-3xl font-bold mt-2">{ultimoFirebase.uvIndex}</p>
              <span className="text-sm">UV</span>
            </div>
          </div>
        </div>
      )}

      {/* ESTADÍSTICAS */}
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
          {['resumen','datos', 'predictor', 'kmeans'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'datos' && '📋 Datos'}
              {tab === 'predictor' && '🌾 Predictor'}
              {tab === 'kmeans' && '📚 K-Means'}
              {tab === 'resumen' && '📈 Dashboard Resumen'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: DATOS */}
      {activeTab === 'datos' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">📋 Registros ({datos.length} total)</h3>
            <button
              onClick={() => setModalDescargaOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
            >
              📥 Descargar PDF
            </button>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Temp</th>
                  <th className="px-4 py-3 text-left">Humedad</th>
                  <th className="px-4 py-3 text-left">Radiación</th>
                  <th className="px-4 py-3 text-left">Precip.</th>
                  <th className="px-4 py-3 text-left">Viables</th>
                  <th className="px-4 py-3 text-left">Fuente</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {datosPaginados.map((d, idx) => {
                  const viables = [
                    d.tomate === 'Sí' && '🍅',
                    d.banana === 'Sí' && '🍌',
                    d.cacao === 'Sí' && '🌰',
                    d.arroz === 'Sí' && '🌾',
                    d.maiz === 'Sí' && '🌽',
                  ].filter(Boolean).join(' ');

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{d.date}</td>
                      <td className="px-4 py-3 text-red-600 font-semibold">{d.temperatura}°C</td>
                      <td className="px-4 py-3 text-blue-600">{d.humedad}%</td>
                      <td className="px-4 py-3 text-yellow-600">{d.radiacion_solar.toFixed(1)} kW/m²</td>
                      <td className="px-4 py-3 text-cyan-600">{d.precipitacion} mm</td>
                      <td className="px-4 py-3 text-lg">{viables || '❌'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${d.fuente === 'firebase' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                          {d.fuente === 'firebase' ? '🔥' : '📁'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={irPaginaAnterior} disabled={paginaActual === 1}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ChevronLeft size={18} /> Anterior
            </button>
            <span className="text-gray-600">Página {paginaActual} de {totalPaginas}</span>
            <button onClick={irPaginaSiguiente} disabled={paginaActual === totalPaginas}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

{/* TAB: PREDICTOR */}
{activeTab === 'predictor' && (
  <PredictorCultivos
    temperatura={ultimoFirebase?.temperatura || datos[datos.length - 1]?.temperatura || 0}
    radiacion={ultimoFirebase ? (ultimoFirebase.uvIndex / 10) : (datos[datos.length - 1]?.radiacion_solar || 0)}
    humedadSuelo={ultimoFirebase?.humedad_suelo || datos[datos.length - 1]?.humedad_suelo || 0}
    humedadRelativa={ultimoFirebase?.humedad || datos[datos.length - 1]?.humedad || 0}
    pluviometria={ultimoFirebase ? (ultimoFirebase.lluvia / 10) : (datos[datos.length - 1]?.precipitacion || 0)}
  />
)}



      {/* TAB: K-MEANS */}
      {activeTab === 'kmeans' && (
        <AnalisisKMeans variante="profesor" imagenClusters="/centroides.png" imagenCodo="/codo.png" />
      )}

      {/* ⭐ TAB: DASHBOARD RESUMEN */}
      {activeTab === 'resumen' && datosDashboardResumen && (
        <div className="space-y-6">
          {/* Título principal */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              📊 DASHBOARD: Análisis de Viabilidad de Cultivos
            </h2>
            <p className="text-center text-gray-500 mt-2">
              Análisis completo de {datosDashboardResumen.totalDias} días de datos
            </p>
          </div>

          {/* Fila superior: 3 gráficos */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Gráfico PIE - Viabilidad Promedio General */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Viabilidad Promedio General (%)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datosDashboardResumen.datosViabilidadPie}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {datosDashboardResumen.datosViabilidadPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico BARRAS - Total de Días Viables */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Total de Días Viables (de {datosDashboardResumen.totalDias} días)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datosDashboardResumen.datosBarra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cultivo" />
                  <YAxis label={{ value: 'Días Viables', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="dias" name="Días Viables">
                    {datosDashboardResumen.datosBarra.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico PIE - Distribución de Perfiles Climáticos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Distribución de Perfiles Climáticos
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datosDashboardResumen.datosPerfilClimatico}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, porcentaje }) => `${porcentaje}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {datosDashboardResumen.datosPerfilClimatico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_CLIMA[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} días (${props.payload.porcentaje}%)`, props.payload.name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fila inferior: Gráfico de tendencia y tabla */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gráfico de líneas - Tendencia de Viabilidad */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Tendencia de Viabilidad a lo Largo del Tiempo
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={datosDashboardResumen.tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis 
                    label={{ value: '% Viabilidad', angle: -90, position: 'insideLeft' }}
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="tomate" stroke="#ef4444" name="Tomate" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="banana" stroke="#f59e0b" name="Banana" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="cacao" stroke="#8B4513" name="Cacao" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="arroz" stroke="#22c55e" name="Arroz" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="maiz" stroke="#eab308" name="Maíz" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla Resumen Estadístico */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                📋 Resumen Estadístico
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Cultivo</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">% Viabilidad</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Días Viables</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Mejor Mes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['tomate', 'banana', 'cacao', 'arroz', 'maiz'].map((cultivo) => (
                      <tr key={cultivo} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 capitalize font-medium">
                          <span className="flex items-center gap-2">
                            {cultivo === 'tomate' && '🍅'}
                            {cultivo === 'banana' && '🍌'}
                            {cultivo === 'cacao' && '🌰'}
                            {cultivo === 'arroz' && '🌾'}
                            {cultivo === 'maiz' && '🌽'}
                            {cultivo.charAt(0).toUpperCase() + cultivo.slice(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span 
                            className="font-bold px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: `${COLORES_CULTIVOS[cultivo]}20`,
                              color: COLORES_CULTIVOS[cultivo]
                            }}
                          >
                            {datosDashboardResumen.viabilidadCultivos[cultivo].porcentaje}%
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                          {datosDashboardResumen.viabilidadCultivos[cultivo].dias}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                            {datosDashboardResumen.mejorMesPorCultivo[cultivo]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda de perfiles climáticos */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">📌 Perfiles Climáticos:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {datosDashboardResumen.datosPerfilClimatico.map((perfil, idx) => (
                    <div key={perfil.name} className="flex items-center gap-2">
                      <span 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORES_CLIMA[idx] }}
                      ></span>
                      <span className="font-medium">{perfil.name}:</span>
                      <span>{perfil.value} días ({perfil.porcentaje}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Insights adicionales */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">💡 Insights Clave</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
                <p className="text-sm opacity-90">Cultivo más viable</p>
                <p className="text-2xl font-bold">🌰 Cacao</p>
                <p className="text-sm">{datosDashboardResumen.viabilidadCultivos.cacao.porcentaje}% de los días</p>
              </div>
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
                <p className="text-sm opacity-90">Condición climática dominante</p>
                <p className="text-2xl font-bold">
                  {datosDashboardResumen.datosPerfilClimatico.reduce((max, p) => 
                    p.value > max.value ? p : max
                  ).name}
                </p>
                <p className="text-sm">
                  {datosDashboardResumen.datosPerfilClimatico.reduce((max, p) => 
                    p.value > max.value ? p : max
                  ).porcentaje}% del período
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
                <p className="text-sm opacity-90">Total días analizados</p>
                <p className="text-2xl font-bold">{datosDashboardResumen.totalDias}</p>
                <p className="text-sm">registros procesados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ MODAL PDF - Recibe datos COMBINADOS */}
      <ModalDescargarPDF
        isOpen={modalDescargaOpen}
        onClose={() => setModalDescargaOpen(false)}
        datos={datos}  
      />
    </div>
  );
};

export default ProfesoresView;
