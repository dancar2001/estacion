import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, Thermometer, Droplets, Wind, Sun, Activity, CloudRain, Database, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PredictorCultivos from './PredictorCultivos';
import Papa from 'papaparse';

// ============================================================================
// URL DE FIREBASE
// ============================================================================
const FIREBASE_URL = "https://bdclimatico-cdb27-default-rtdb.firebaseio.com/sensores.json";

const EstudiantesView = ({ user, apiBaseUrl, onLogout }) => {
  // ⭐ Estados para datos combinados (CSV + Firebase)
  const [datos, setDatos] = useState([]);
  const [datosCSV, setDatosCSV] = useState([]);
  const [datosFirebaseArray, setDatosFirebaseArray] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el último registro de Firebase (tiempo real)
  const [ultimoFirebase, setUltimoFirebase] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(false);
  const [errorFirebase, setErrorFirebase] = useState(null);

  // ⭐ Estado para recibir predicciones desde PredictorCultivos
  const [prediccionesML, setPrediccionesML] = useState([]);

  // ========================================================================
  // FUNCIÓN PARA CALCULAR VIABILIDAD DE CULTIVOS
  // ========================================================================
  const calcularViabilidad = (temp, humedad, lluvia) => {
    return {
      tomate: (temp >= 24 && temp <= 27 && lluvia >= 3 && lluvia <= 10 && humedad >= 80) ? 'Sí' : 'No',
      banana: (temp >= 24 && temp <= 28 && lluvia >= 5 && lluvia <= 30) ? 'Sí' : 'No',
      cacao: (temp >= 23 && temp <= 28 && lluvia < 40) ? 'Sí' : 'No',
      arroz: (temp >= 24 && temp <= 27 && lluvia >= 3 && lluvia <= 25) ? 'Sí' : 'No',
      maiz: (temp >= 24 && temp <= 27 && lluvia >= 3 && lluvia <= 15) ? 'Sí' : 'No',
    };
  };

  // ========================================================================
  // ⭐ CALLBACK PARA RECIBIR PREDICCIONES DESDE PredictorCultivos
  // ========================================================================
  const handlePrediccionesActualizadas = useCallback((predicciones) => {
    if (predicciones && predicciones.length > 0) {
      const formateadas = predicciones.map(pred => ({
        nombre: pred.cultivo,
        viabilidad: pred.confianza,
        esViable: pred.viabilidad,
        esOptimoEnCluster: pred.es_optimo_en_cluster
      })).sort((a, b) => {
        if (a.esViable !== b.esViable) return a.esViable ? -1 : 1;
        return b.viabilidad - a.viabilidad;
      });
      
      setPrediccionesML(formateadas);
    }
  }, []);

  // ========================================================================
  // CARGAR DATOS DE FIREBASE
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

        registros.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (registros[0]) {
          setUltimoFirebase({
            temperatura: registros[0].temperatura || 0,
            humedad: registros[0].humedad || 0,
            humedad_suelo: registros[0].humedad_suelo || 0,
            lluvia: registros[0].lluvia < 0 ? 0 : registros[0].lluvia || 0,
            uvIndex: registros[0].uvIndex || 0,
            timestamp: registros[0].timestamp || 0,
            totalRegistros: registros.length
          });
        }

        const firebaseComoCSV = registros.map((r) => {
          const temp = r.temperatura || 0;
          const humedad = r.humedad || 0;
          const humedadSuelo = r.humedad_suelo || 0;
          const lluvia = r.lluvia < 0 ? 0 : r.lluvia || 0;
          const uvIndex = r.uvIndex || 0;
          
          let fecha = new Date().toISOString().slice(0, 10);
          if (r.timestamp) {
            if (typeof r.timestamp === 'string') {
              const partes = r.timestamp.split('/');
              if (partes.length === 3) {
                const año = partes[0].length === 2 ? '20' + partes[0] : partes[0];
                fecha = `${año}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
              }
            } else if (typeof r.timestamp === 'number') {
              const ts = r.timestamp > 10000000000 ? r.timestamp / 1000 : r.timestamp;
              fecha = new Date(ts * 1000).toISOString().slice(0, 10);
            }
          }

          let radiacion = 0;
          if (uvIndex === 0) {
            radiacion = 0;
          } else if (uvIndex <= 2) {
            radiacion = 4.5;
          } else if (uvIndex <= 5) {
            radiacion = 4.8;
          } else {
            radiacion = 5.0;
          }

          const viabilidad = calcularViabilidad(temp, humedad, lluvia);

          return {
            date: fecha,
            temperatura: temp,
            radiacion_solar: radiacion,
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
  const fetchDatosCSV = useCallback(async () => {
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
            radiacion_solar: parseFloat(row.RadiacionsolarpromediokWm2) || 0,
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
        },
        error: (error) => {
          console.error('❌ Error parsing CSV:', error);
          setError('Error al cargar CSV');
        }
      });
    } catch (err) {
      console.error('Error cargando CSV:', err);
      setError('Error al cargar datos históricos');
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================================================
  // COMBINAR CSV + FIREBASE
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
    fetchDatosCSV();
    fetchFirebase();
    const intervalFirebase = setInterval(fetchFirebase, 30000);
    return () => clearInterval(intervalFirebase);
  }, [fetchDatosCSV, fetchFirebase]);

  // ========================================================================
  // ESTADÍSTICAS
  // ========================================================================
  const ultimoRegistro = datos.length > 0 ? datos[datos.length - 1] : null;

  const calcularEstadisticas = () => {
    if (datos.length === 0) return null;

    const temps = datos.map((d) => d.temperatura);
    const humeds = datos.map((d) => d.humedad);
    const radiaciones = datos.map((d) => d.radiacion_solar);
    const precips = datos.map((d) => d.precipitacion);

    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      temperatura: {
        actual: temps[temps.length - 1],
        max: Math.max(...temps),
        min: Math.min(...temps),
        promedio: average(temps).toFixed(2),
      },
      humedad: {
        actual: humeds[humeds.length - 1],
        max: Math.max(...humeds),
        min: Math.min(...humeds),
        promedio: average(humeds).toFixed(2),
      },
      radiacion: {
        actual: radiaciones[radiaciones.length - 1],
        max: Math.max(...radiaciones),
        min: Math.min(...radiaciones),
        promedio: average(radiaciones).toFixed(2),
      },
      precipitacion: {
        total: precips.reduce((a, b) => a + b, 0).toFixed(2),
        promedio: average(precips).toFixed(2),
      },
    };
  };

  const stats = calcularEstadisticas();

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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={28} />
            📊 Datos Meteorológicos
          </h2>
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
              onClick={() => { fetchDatosCSV(); fetchFirebase(); }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
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
          <span className="text-gray-500">📁 {datosCSV.length} CSV</span>
          <span className="text-gray-500">🔥 {datosFirebaseArray.length} Firebase</span>
          <span className="text-purple-600 font-bold">📊 {datos.length} TOTAL</span>
        </div>
      </div>

      {/* TIEMPO REAL FIREBASE */}
      {ultimoFirebase && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database size={24} />
            🔥 Sensores en Tiempo Real
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={20} />
                <span className="text-sm">Temperatura</span>
              </div>
              <p className="text-3xl font-bold">{ultimoFirebase.temperatura}°C</p>
            </div>

            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={20} />
                <span className="text-sm">Humedad</span>
              </div>
              <p className="text-3xl font-bold">{ultimoFirebase.humedad}%</p>
            </div>

            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={20} />
                <span className="text-sm">Hum. Suelo</span>
              </div>
              <p className="text-3xl font-bold">{ultimoFirebase.humedad_suelo}%</p>
            </div>

            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain size={20} />
                <span className="text-sm">Lluvia</span>
              </div>
              <p className="text-3xl font-bold">{ultimoFirebase.lluvia} mm</p>
            </div>

            <div className="bg-white/20 backdrop-blur p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sun size={20} />
                <span className="text-sm">UV</span>
              </div>
              <p className="text-3xl font-bold">{ultimoFirebase.uvIndex}</p>
            </div>
          </div>
        </div>
      )}

      {/* ESTADÍSTICAS */}
      {stats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Estadísticas Totales (CSV + Firebase)</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="text-red-600" size={32} />
                <span className="text-sm font-medium text-red-700">Temperatura</span>
              </div>
              <p className="text-4xl font-bold text-red-700">{stats.temperatura.actual}°C</p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span>Máx:</span><span className="font-bold">{stats.temperatura.max}°C</span></div>
                <div className="flex justify-between"><span>Mín:</span><span className="font-bold">{stats.temperatura.min}°C</span></div>
                <div className="flex justify-between"><span>Prom:</span><span className="font-bold">{stats.temperatura.promedio}°C</span></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Droplets className="text-blue-600" size={32} />
                <span className="text-sm font-medium text-blue-700">Humedad</span>
              </div>
              <p className="text-4xl font-bold text-blue-700">{stats.humedad.actual}%</p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span>Máx:</span><span className="font-bold">{stats.humedad.max}%</span></div>
                <div className="flex justify-between"><span>Mín:</span><span className="font-bold">{stats.humedad.min}%</span></div>
                <div className="flex justify-between"><span>Prom:</span><span className="font-bold">{stats.humedad.promedio}%</span></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Sun className="text-yellow-600" size={32} />
                <span className="text-sm font-medium text-yellow-700">Radiación</span>
              </div>
              <p className="text-4xl font-bold text-yellow-700">{stats.radiacion.actual}</p>
              <p className="text-xs text-yellow-600">kW/m²</p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span>Máx:</span><span className="font-bold">{stats.radiacion.max} kW/m²</span></div>
                <div className="flex justify-between"><span>Mín:</span><span className="font-bold">{stats.radiacion.min} kW/m²</span></div>
                <div className="flex justify-between"><span>Prom:</span><span className="font-bold">{stats.radiacion.promedio} kW/m²</span></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg border border-cyan-200">
              <CloudRain className="text-cyan-600" size={32} />
              <p className="text-3xl font-bold text-cyan-700 mt-2">{stats.precipitacion.total} mm</p>
              <p className="text-xs text-cyan-600">Precipitación total</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <Activity className="text-green-600" size={32} />
              <p className="text-3xl font-bold text-green-700 mt-2">{ultimoRegistro?.humedad_suelo || 0}%</p>
              <p className="text-xs text-green-600">Humedad Suelo</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <BarChart3 className="text-purple-600" size={32} />
              <p className="text-3xl font-bold text-purple-700 mt-2">{datos.length}</p>
              <p className="text-xs text-purple-600">Registros totales</p>
            </div>
          </div>
        </div>
      )}

      {/* PREDICTOR - Ahora pasa las predicciones hacia arriba */}
      {(ultimoFirebase || ultimoRegistro) && (
        <PredictorCultivos
          temperatura={ultimoFirebase?.temperatura || ultimoRegistro?.temperatura || 0}
          radiacion={ultimoFirebase ? (ultimoFirebase.uvIndex <= 2 ? 4.5 : ultimoFirebase.uvIndex <= 5 ? 4.8 : 5.0) : (ultimoRegistro?.radiacion_solar || 0)}
          humedadSuelo={ultimoFirebase?.humedad_suelo || ultimoRegistro?.humedad_suelo || 0}
          humedadRelativa={ultimoFirebase?.humedad || ultimoRegistro?.humedad || 0}
          pluviometria={ultimoFirebase?.lluvia || ultimoRegistro?.precipitacion || 0}
          onPrediccionesChange={handlePrediccionesActualizadas}
        />
      )}

      {/* ⭐ CULTIVOS VIABLES HOY - USA DATOS DEL MODELO K-MEANS */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          🌾 Cultivos Viables Hoy
          <span className="text-sm font-normal text-gray-500">(Modelo K-Means)</span>
        </h3>
        
        {prediccionesML.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prediccionesML.map((cultivo, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  cultivo.esViable 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    {cultivo.nombre}
                    {cultivo.esOptimoEnCluster && (
                      <span className="text-yellow-500" title="Óptimo en este perfil climático">⭐</span>
                    )}
                  </h4>
                  {cultivo.esViable ? (
                    <span className="text-green-600 text-sm font-semibold">✓ VIABLE</span>
                  ) : (
                    <span className="text-red-600 text-sm font-semibold">✗ NO VIABLE</span>
                  )}
                </div>
                <div className="bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full ${
                      cultivo.esViable ? 'bg-green-600' : 'bg-red-400'
                    }`}
                    style={{ width: `${cultivo.viabilidad}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Confianza: <span className="font-semibold">{cultivo.viabilidad}%</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
            <p>Cargando predicciones...</p>
          </div>
        )}

        {/* Leyenda */}
        {prediccionesML.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded"></span> Viable
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-400 rounded"></span> No viable
            </span>
            <span className="flex items-center gap-1">
              ⭐ Óptimo en perfil climático actual
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstudiantesView;
