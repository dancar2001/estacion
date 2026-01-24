import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Zap, RefreshCw, BarChart3, ChevronLeft, ChevronRight, Database, Thermometer, Droplets, CloudRain, Sun, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PredictorCultivos from './PredictorCultivos';
import ModalDescargarPDF from './Modaldescargarpdf';
import AnalisisKMeans from './AnalisisKMeans';
import Papa from 'papaparse';

const FIREBASE_URL = "https://bdclimatico-cdb27-default-rtdb.firebaseio.com/sensores.json";

const ProfesoresView = ({ user, apiBaseUrl, onLogout }) => {
  const [activeTab, setActiveTab] = useState('analisis');
  const [datos, setDatos] = useState([]);
  const [datosCSV, setDatosCSV] = useState([]);
  const [datosFirebaseArray, setDatosFirebaseArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalDescargaOpen, setModalDescargaOpen] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;
  const [ultimoFirebase, setUltimoFirebase] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(false);
  const [errorFirebase, setErrorFirebase] = useState(null);

  const calcularViabilidad = (temp, humedad, lluvia) => {
    return {
      tomate: (temp >= 20 && temp <= 32 && lluvia >= 1 && lluvia <= 15 && humedad >= 50 && humedad <= 85) ? 'Sí' : 'No',
      banana: (temp >= 20 && temp <= 32 && lluvia >= 2 && lluvia <= 35) ? 'Sí' : 'No',
      cacao: (temp >= 21 && temp <= 32 && lluvia < 45) ? 'Sí' : 'No',
      arroz: (temp >= 22 && temp <= 32 && lluvia >= 2 && lluvia <= 30) ? 'Sí' : 'No',
      maiz: (temp >= 20 && temp <= 32 && lluvia >= 1 && lluvia <= 20) ? 'Sí' : 'No',
    };
  };

  // ⭐ FUNCIÓN MEJORADA PARA CARGAR FIREBASE
  const fetchFirebase = useCallback(async () => {
    try {
      setLoadingFirebase(true);
      setErrorFirebase(null);

      const response = await fetch(FIREBASE_URL);
      const data = await response.json();

      if (data) {
        // Usar Map para GARANTIZAR unicidad por fecha
        const registrosPorFecha = new Map();
        const totalRegistrosFirebase = Object.keys(data).length;

        Object.entries(data).forEach(([key, value]) => {
          const temp = value.temperatura || 0;
          const humedad = value.humedad || 0;
          const humedadSuelo = value.humedad_suelo || 0;
          const lluvia = value.lluvia < 0 ? 0 : value.lluvia || 0;
          const uvIndex = value.uvIndex || 0;

          let fecha = new Date().toISOString().slice(0, 10);
          if (value.timestamp) {
            if (typeof value.timestamp === 'string') {
              const partes = value.timestamp.split(' ')[0].split('/');
              if (partes.length === 3) {
                const año = '20' + partes[0];
                const mes = partes[1].padStart(2, '0');
                const dia = partes[2].padStart(2, '0');
                fecha = `${año}-${mes}-${dia}`;
              }
            } else if (typeof value.timestamp === 'number') {
              const ts = value.timestamp > 10000000000 ? value.timestamp / 1000 : value.timestamp;
              fecha = new Date(ts * 1000).toISOString().slice(0, 10);
            }
          }

          if (!registrosPorFecha.has(fecha)) {
            registrosPorFecha.set(fecha, {
              temperaturas: [],
              humedades: [],
              humedadesSuelo: [],
              lluvias: [],
              uvIndexes: []
            });
          }

          const registro = registrosPorFecha.get(fecha);
          registro.temperaturas.push(temp);
          registro.humedades.push(humedad);
          registro.humedadesSuelo.push(humedadSuelo);
          registro.lluvias.push(lluvia);
          registro.uvIndexes.push(uvIndex);
        });

        const firebaseComoCSV = Array.from(registrosPorFecha.entries())
          .map(([fecha, valores]) => {
            const temp = valores.temperaturas.reduce((a, b) => a + b, 0) / valores.temperaturas.length;
            const humedad = valores.humedades.reduce((a, b) => a + b, 0) / valores.humedades.length;
            const humedadSuelo = valores.humedadesSuelo.reduce((a, b) => a + b, 0) / valores.humedadesSuelo.length;
            const lluvia = valores.lluvias.reduce((a, b) => a + b, 0) / valores.lluvias.length;
            const uvIndex = valores.uvIndexes.reduce((a, b) => a + b, 0) / valores.uvIndexes.length;

            const viabilidad = calcularViabilidad(temp, humedad, lluvia);

            return {
              date: fecha,
              temperatura: parseFloat(temp.toFixed(1)),
              radiacion_solar: parseFloat(uvIndex.toFixed(2)),
              humedad_suelo: parseFloat(humedadSuelo.toFixed(1)),
              humedad: parseFloat(humedad.toFixed(1)),
              precipitacion: parseFloat(lluvia.toFixed(2)),
              tomate: viabilidad.tomate,
              banana: viabilidad.banana,
              cacao: viabilidad.cacao,
              arroz: viabilidad.arroz,
              maiz: viabilidad.maiz,
              fuente: 'firebase'
            };
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║        ANÁLISIS DE FIREBASE                       ║');
        console.log('╚════════════════════════════════════════════════════╝');
        console.log(`✅ Total registros CRUDOS: ${totalRegistrosFirebase}`);
        console.log(`✅ Fechas ÚNICAS: ${firebaseComoCSV.length}`);
        console.log(`✅ Promedio por fecha: ${Math.round(totalRegistrosFirebase / firebaseComoCSV.length)}`);

        setDatosFirebaseArray(firebaseComoCSV);

        if (firebaseComoCSV.length > 0) {
          const ultimoRegistro = firebaseComoCSV[firebaseComoCSV.length - 1];
          setUltimoFirebase({
            temperatura: ultimoRegistro.temperatura,
            humedad: ultimoRegistro.humedad,
            humedad_suelo: ultimoRegistro.humedad_suelo,
            lluvia: ultimoRegistro.precipitacion,
            uvIndex: ultimoRegistro.radiacion_solar,
            timestamp: ultimoRegistro.date,
            totalRegistros: totalRegistrosFirebase
          });
        }
      }
    } catch (err) {
      console.error('❌ Error Firebase:', err);
      setErrorFirebase('Error al conectar con sensores');
    } finally {
      setLoadingFirebase(false);
    }
  }, []);

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

  useEffect(() => {
    const fechasCSV = new Set(datosCSV.map(d => d.date));
    const firebaseNuevos = datosFirebaseArray.filter(d => !fechasCSV.has(d.date));
    
    const combinados = [...datosCSV, ...firebaseNuevos];
    combinados.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`📊 TOTAL COMBINADO: CSV(${datosCSV.length}) + Firebase(${firebaseNuevos.length}) = ${combinados.length}`);
    setDatos(combinados);
  }, [datosCSV, datosFirebaseArray]);

  useEffect(() => {
    fetchCSV();
    fetchFirebase();

    const intervalFirebase = setInterval(fetchFirebase, 30000);
    return () => clearInterval(intervalFirebase);
  }, [fetchCSV, fetchFirebase]);

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

  const datosGrafico = datos.slice(-30).map((d) => ({
    fecha: d.date,
    temp: d.temperatura,
    hum: d.humedad,
    rad: d.radiacion_solar,
    precip: d.precipitacion,
  }));

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

  const datosInvertidos = [...datos].reverse();
  const totalPaginas = Math.ceil(datosInvertidos.length / registrosPorPagina);
  
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const datosPaginados = datosInvertidos.slice(indiceInicio, indiceFin);

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
          <h2 className="text-2xl font-bold text-gray-800">👨‍🏫 Panel de Profesor</h2>
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

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className={`flex items-center gap-1 ${ultimoFirebase ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${ultimoFirebase ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {ultimoFirebase ? '🔴 EN VIVO' : 'Sin conexión'}
          </span>
          <span className="text-gray-500 border-l pl-4">📁 CSV: {datosCSV.length}</span>
          <span className="text-gray-500 border-l pl-4">🔥 Firebase: {datosFirebaseArray.length} fechas ({ultimoFirebase?.totalRegistros || 0} muestras)</span>
          <span className="text-purple-600 font-bold border-l pl-4">📊 Total: {datos.length}</span>
        </div>
      </div>

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
          {['analisis', 'datos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'analisis' && '📊 Análisis'}
              {tab === 'datos' && '📋 Datos'}
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
                      <td className="px-4 py-3 text-yellow-600">{d.radiacion_solar.toFixed(1)}</td>
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
            <button onClick={() => paginaActual > 1 && setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ChevronLeft size={18} /> Anterior
            </button>
            <span className="text-gray-600">Página {paginaActual} de {totalPaginas}</span>
            <button onClick={() => paginaActual < totalPaginas && setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>
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
