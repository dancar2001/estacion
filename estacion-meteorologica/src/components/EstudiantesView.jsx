import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, Thermometer, Droplets, Wind, Sun, Activity, CloudRain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PredictorCultivos from './PredictorCultivos';

const EstudiantesView = ({ user, apiBaseUrl, onLogout }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========================================================================
  // CARGAR Y PARSEAR CSV
  // ========================================================================

  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/cultivos_viabilidad_FINAL.csv');
      const text = await response.text();
      
      // Parsear CSV
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',');
      
      const datosParseados = lines.slice(1).map((line) => {
        const values = line.split(',');
        return {
          date: values[0],
          temperatura: parseFloat(values[1]),
          radiacion_solar: parseFloat(values[2]) * 1000, // Convertir a W/m²
          humedad_suelo: parseFloat(values[3]),
          humedad: parseFloat(values[4]),
          precipitacion: parseFloat(values[5]),
          tomate: values[6].trim(),
          banana: values[7].trim(),
          cacao: values[8].trim(),
          arroz: values[9].trim(),
          maiz: values[10].trim(),
        };
      });

      setDatos(datosParseados);
      setError(null);
    } catch (err) {
      console.error('Error cargando CSV:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatos();
    const interval = setInterval(fetchDatos, 60000);
    return () => clearInterval(interval);
  }, [fetchDatos]);

  // ========================================================================
  // CALCULAR ESTADÍSTICAS
  // ========================================================================

  const obtenerUltimoRegistro = () => datos.length > 0 ? datos[datos.length - 1] : null;
  const ultimoRegistro = obtenerUltimoRegistro();

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
        promedio: average(radiaciones).toFixed(0),
      },
      precipitacion: {
        total: precips.reduce((a, b) => a + b, 0).toFixed(2),
        promedio: average(precips).toFixed(2),
      },
    };
  };

  const stats = calcularEstadisticas();

  // ========================================================================
  // GRÁFICO (ÚLTIMOS 30 REGISTROS)
  // ========================================================================

  const datosGrafico = datos.slice(-30).map((d) => ({
    fecha: d.date,
    temp: d.temperatura,
    hum: d.humedad,
    rad: Math.round(d.radiacion_solar / 10),
    precip: d.precipitacion,
  }));

  // ========================================================================
  // RECOMENDACIONES DE CULTIVOS
  // ========================================================================

  const obtenerRecomendaciones = () => {
    if (!ultimoRegistro) return [];

    const cultivos = [
      { nombre: 'Tomate', viabilidad: ultimoRegistro.tomate === 'Sí' ? 85 : 40 },
      { nombre: 'Banana', viabilidad: ultimoRegistro.banana === 'Sí' ? 88 : 35 },
      { nombre: 'Cacao', viabilidad: ultimoRegistro.cacao === 'Sí' ? 92 : 30 },
      { nombre: 'Arroz', viabilidad: ultimoRegistro.arroz === 'Sí' ? 80 : 45 },
      { nombre: 'Maíz', viabilidad: ultimoRegistro.maiz === 'Sí' ? 78 : 50 },
    ];

    return cultivos.sort((a, b) => b.viabilidad - a.viabilidad);
  };

  const recomendaciones = obtenerRecomendaciones();

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
          onClick={fetchDatos}
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
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={28} />
            📊 Datos Meteorológicos en Tiempo Real
          </h2>
          <button
            onClick={fetchDatos}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>
        {ultimoRegistro && (
          <p className="text-sm text-gray-500">
            Última actualización: {ultimoRegistro.date}
          </p>
        )}
      </div>

      {/* TARJETAS DE VARIABLES */}
      {stats && (
        <div className="space-y-6">
          {/* FILA 1 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* TEMPERATURA */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="text-red-600" size={32} />
                <span className="text-sm font-medium text-red-700">Temperatura</span>
              </div>
              <p className="text-4xl font-bold text-red-700">{stats.temperatura.actual}°C</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Máx:</span>
                  <span className="font-bold">{stats.temperatura.max}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Mín:</span>
                  <span className="font-bold">{stats.temperatura.min}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Prom:</span>
                  <span className="font-bold">{stats.temperatura.promedio}°C</span>
                </div>
              </div>
            </div>

            {/* HUMEDAD */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Droplets className="text-blue-600" size={32} />
                <span className="text-sm font-medium text-blue-700">Humedad Relativa</span>
              </div>
              <p className="text-4xl font-bold text-blue-700">{stats.humedad.actual}%</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Máx:</span>
                  <span className="font-bold">{stats.humedad.max}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Mín:</span>
                  <span className="font-bold">{stats.humedad.min}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Prom:</span>
                  <span className="font-bold">{stats.humedad.promedio}%</span>
                </div>
              </div>
            </div>

            {/* RADIACIÓN */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Sun className="text-yellow-600" size={32} />
                <span className="text-sm font-medium text-yellow-700">Radiación Solar</span>
              </div>
              <p className="text-4xl font-bold text-yellow-700">{Math.round(stats.radiacion.actual)}</p>
              <p className="text-xs text-yellow-600 mt-2">W/m²</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Prom:</span>
                  <span className="font-bold">{stats.radiacion.promedio} W/m²</span>
                </div>
              </div>
            </div>
          </div>

          {/* FILA 2 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PRECIPITACIÓN */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg border border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <CloudRain className="text-cyan-600" size={32} />
                <span className="text-sm font-medium text-cyan-700">Precipitación</span>
              </div>
              <p className="text-4xl font-bold text-cyan-700">{stats.precipitacion.total}</p>
              <p className="text-xs text-cyan-600 mt-2">mm total</p>
            </div>

            {/* HUMEDAD SUELO */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="text-green-600" size={32} />
                <span className="text-sm font-medium text-green-700">Humedad Suelo</span>
              </div>
              <p className="text-4xl font-bold text-green-700">{ultimoRegistro?.humedad_suelo}%</p>
              <p className="text-xs text-green-600 mt-2">Nivel adecuado</p>
            </div>

            {/* REGISTROS TOTAL */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="text-purple-600" size={32} />
                <span className="text-sm font-medium text-purple-700">Registros</span>
              </div>
              <p className="text-4xl font-bold text-purple-700">{datos.length}</p>
              <p className="text-xs text-purple-600 mt-2">datos históricos</p>
            </div>
          </div>
        </div>
      )}

      {/* GRÁFICO
      {datosGrafico.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Tendencias (Últimos 30 registros)</h3>
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
      )} */}

      {/* PREDICTOR */}
      {ultimoRegistro && (
        <PredictorCultivos
          temperatura={ultimoRegistro.temperatura}
          radiacion={ultimoRegistro.radiacion_solar / 100}
          humedadSuelo={ultimoRegistro.humedad_suelo}
          humedadRelativa={ultimoRegistro.humedad}
          pluviometria={ultimoRegistro.precipitacion}
        />
      )}

      {/* RECOMENDACIONES */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🌾 Cultivos Viables Hoy</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recomendaciones.map((cultivo, idx) => {
            const esViable = ultimoRegistro && 
              (cultivo.nombre === 'Tomate' && ultimoRegistro.tomate === 'Sí' ||
               cultivo.nombre === 'Banana' && ultimoRegistro.banana === 'Sí' ||
               cultivo.nombre === 'Cacao' && ultimoRegistro.cacao === 'Sí' ||
               cultivo.nombre === 'Arroz' && ultimoRegistro.arroz === 'Sí' ||
               cultivo.nombre === 'Maíz' && ultimoRegistro.maiz === 'Sí');

            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  esViable ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-gray-800">{cultivo.nombre}</h4>
                  {esViable && <span className="text-green-600 text-sm font-semibold">✓ VIABLE</span>}
                </div>
                <div className="mb-2">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${esViable ? 'bg-green-600' : 'bg-yellow-500'}`}
                      style={{ width: `${cultivo.viabilidad}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">Viabilidad: {cultivo.viabilidad}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABLA HISTÓRICA */}
      {/* {datos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Últimos 20 registros</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Temp</th>
                <th className="px-4 py-3 text-left font-semibold">Humedad</th>
                <th className="px-4 py-3 text-left font-semibold">H.Suelo</th>
                <th className="px-4 py-3 text-left font-semibold">Radiación</th>
                <th className="px-4 py-3 text-left font-semibold">Precip.</th>
                <th className="px-4 py-3 text-left font-semibold">Cultivos Viables</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {datos.slice(-20).reverse().map((d, idx) => {
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
                    <td className="px-4 py-3 text-red-600 font-semibold">{d.temperatura}°C</td>
                    <td className="px-4 py-3 text-blue-600">{d.humedad}%</td>
                    <td className="px-4 py-3 text-green-600">{d.humedad_suelo}%</td>
                    <td className="px-4 py-3 text-yellow-600">{Math.round(d.radiacion_solar)} W/m²</td>
                    <td className="px-4 py-3 text-cyan-600">{d.precipitacion} mm</td>
                    <td className="px-4 py-3 text-sm font-semibold">{viables || 'Ninguno'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )} */}
    </div>
  );
};

export default EstudiantesView;