import React, { useState, useEffect } from 'react';
import {
  UserPlus, Users, BarChart3, TrendingUp, Thermometer, Droplets,
  Sun, CloudRain, Wind, Activity, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import Papa from 'papaparse';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import PredictorCultivos from './PredictorCultivos';
import AnalisisKMeans from './AnalisisKMeans';

// ============================================================================
// ✅ COMPONENTES EXTRAÍDOS FUERA
// ============================================================================

const CrearUsuarioTab = ({ formData, handleInputChange, handleSubmit, loading, error, success }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
      <UserPlus className="text-blue-600" size={28} />
      ➕ Crear Nuevo Usuario
    </h2>

    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    {success && (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {success}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre Completo"
          value={formData.nombre}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo Electrónico"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña (mín 8 caracteres)"
          value={formData.password}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          name="password_confirm"
          placeholder="Confirmar Contraseña"
          value={formData.password_confirm}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <select
          name="rol"
          value={formData.rol}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="estudiante">Estudiante</option>
          <option value="profesor">Profesor</option>
          <option value="administrativo">Administrativo</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-lg transition"
      >
        {loading ? 'Creando...' : '✅ Crear Usuario'}
      </button>
    </form>
  </div>
);

const DashboardEstudiante = ({ ultimoRegistro, stats, datos, mockCropRecommendations }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="text-green-600" size={28} />
        📊 Variables Meteorológicas en Tiempo Real
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Última actualización: {ultimoRegistro?.date || 'N/A'}
      </p>

      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <Thermometer className="text-red-600" size={32} />
              <span className="text-sm font-medium text-red-700">Temperatura</span>
            </div>
            <p className="text-4xl font-bold text-red-700">{stats.temperature}°C</p>
            <p className="text-xs text-red-600 mt-2">Rango óptimo: 22-30°C</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="text-blue-600" size={32} />
              <span className="text-sm font-medium text-blue-700">Humedad Relativa</span>
            </div>
            <p className="text-4xl font-bold text-blue-700">{stats.humidity}%</p>
            <p className="text-xs text-blue-600 mt-2">Rango óptimo: 70-85%</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <Sun className="text-yellow-600" size={32} />
              <span className="text-sm font-medium text-yellow-700">Radiación Solar</span>
            </div>
            <p className="text-4xl font-bold text-yellow-700">{Math.round(stats.solarRadiation)}</p>
            <p className="text-xs text-yellow-600 mt-2">W/m² - 6-8h luz/día</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-green-600" size={32} />
              <span className="text-sm font-medium text-green-700">Humedad del Suelo</span>
            </div>
            <p className="text-4xl font-bold text-green-700">{stats.soilMoisture}%</p>
            <p className="text-xs text-green-600 mt-2">Nivel adecuado</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg border border-cyan-200">
            <div className="flex items-center justify-between mb-2">
              <CloudRain className="text-cyan-600" size={32} />
              <span className="text-sm font-medium text-cyan-700">Precipitación</span>
            </div>
            <p className="text-4xl font-bold text-cyan-700">{stats.precipitation}</p>
            <p className="text-xs text-cyan-600 mt-2">mm acumulados hoy</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Wind className="text-purple-600" size={32} />
              <span className="text-sm font-medium text-purple-700">Registros CSV</span>
            </div>
            <p className="text-4xl font-bold text-purple-700">{datos.length}</p>
            <p className="text-xs text-purple-600 mt-2">datos históricos</p>
          </div>
        </div>
      )}
    </div>

    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🌾 Recomendaciones de Cultivo</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {mockCropRecommendations.map((crop, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border-2 ${
              crop.optimo ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-gray-800">{crop.cultivo}</h4>
              {crop.optimo && (
                <span className="text-green-600 text-sm font-semibold">✓ ÓPTIMO</span>
              )}
            </div>
            <div className="mb-2">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    crop.optimo ? 'bg-green-600' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${crop.viabilidad}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">Viabilidad: {crop.viabilidad}%</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DashboardProfesor = ({ mockHistoricalData, stats, mockCropRecommendations, ultimoRegistro, datos }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 className="text-blue-600" size={28} />
        📈 Análisis de Datos Históricos
      </h2>

      {mockHistoricalData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            📊 Tendencias de Variables Climáticas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temp" stroke="#ef4444" name="Temperatura (°C)" strokeWidth={2} />
              <Line type="monotone" dataKey="hum" stroke="#3b82f6" name="Humedad (%)" strokeWidth={2} />
              <Line type="monotone" dataKey="rad" stroke="#f59e0b" name="Radiación (W/m²)" strokeWidth={2} />
              <Line type="monotone" dataKey="precip" stroke="#06b6d4" name="Precipitación (mm)" strokeWidth={2} />
              <Line type="monotone" dataKey="viento" stroke="#8b5cf6" name="Viento (m/s)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">🎯 Viabilidad por Cultivo</h3>
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

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Estadísticas del Período</h3>
            <div className="space-y-4">
              <div className="flex justify-between bg-white p-3 rounded">
                <span className="text-gray-700">Temperatura Promedio:</span>
                <span className="font-bold text-gray-900">{stats.tempPromedio}°C</span>
              </div>
              <div className="flex justify-between bg-white p-3 rounded">
                <span className="text-gray-700">Humedad Promedio:</span>
                <span className="font-bold text-gray-900">{stats.humedadPromedio}%</span>
              </div>
              <div className="flex justify-between bg-white p-3 rounded">
                <span className="text-gray-700">Radiación Promedio:</span>
                <span className="font-bold text-gray-900">{stats.radiacionPromedio} W/m²</span>
              </div>
              <div className="flex justify-between bg-white p-3 rounded">
                <span className="text-gray-700">Total Registros:</span>
                <span className="font-bold text-gray-900">{datos.length}</span>
              </div>
              <div className="flex justify-between bg-white p-3 rounded">
                <span className="text-gray-700">Período:</span>
                <span className="font-bold text-gray-900">{datos.length > 0 ? `${datos[0].date} a ${datos[datos.length - 1].date}` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {ultimoRegistro && (
      <PredictorCultivos
        temperatura={ultimoRegistro.temperatura}
        radiacion={ultimoRegistro.radiacion_solar / 100}
        humedadSuelo={ultimoRegistro.humedad_suelo}
        humedadRelativa={ultimoRegistro.humedad}
        pluviometria={ultimoRegistro.precipitacion}
      />
    )}
  </div>
);

const GestionUsuarios = ({ usuarios, apiBaseUrl, onRefresh }) => {
  const [eliminando, setEliminando] = useState(false);
  const [mensajeEliminar, setMensajeEliminar] = useState(null);

  const handleEliminarUsuario = async (usuarioId, usuarioNombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${usuarioNombre}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setEliminando(true);
      setMensajeEliminar(null);

      await axios.delete(`${apiBaseUrl}/usuarios/${usuarioId}/`);

      setMensajeEliminar({
        tipo: 'success',
        mensaje: `✅ ${usuarioNombre} eliminado exitosamente`
      });

      if (onRefresh) {
        await onRefresh();
      }

      setTimeout(() => setMensajeEliminar(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error al eliminar usuario';
      setMensajeEliminar({
        tipo: 'error',
        mensaje: `❌ ${errorMsg}`
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Users className="text-green-600" size={28} />
        👥 Usuarios del Sistema
      </h2>

      {mensajeEliminar && (
        <div
          className={`mb-4 px-4 py-3 rounded border ${
            mensajeEliminar.tipo === 'success'
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}
        >
          {mensajeEliminar.mensaje}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Creado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm text-gray-600">{usuario.id}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                  {usuario.username}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{usuario.email}</td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {usuario.first_name || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      usuario.rol_display === 'Administrativo'
                        ? 'bg-red-100 text-red-800'
                        : usuario.rol_display === 'Profesor'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {usuario.rol_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(usuario.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleEliminarUsuario(usuario.id, usuario.first_name || usuario.username)}
                    disabled={eliminando}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-xs font-semibold rounded transition"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No hay usuarios todavía
        </p>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AdministrativosView = ({ user, apiBaseUrl, onLogout }) => {
  const [activeTab, setActiveTab] = useState('crear-usuario');
  const [usuarios, setUsuarios] = useState([]);
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    password_confirm: '',
    rol: 'estudiante',
  });

  useEffect(() => {
    fetchUsuarios();
    fetchDatos();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/usuarios/`);
      setUsuarios(response.data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  // ✅ CARGAR CSV CON PAPAPARSE
  const fetchDatos = async () => {
    try {
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
          }));
          setDatos(datosParseados);
          console.log(`✅ CSV cargado: ${datosParseados.length} registros`);
        },
        error: (error) => {
          console.error('❌ Error parsing CSV:', error);
        }
      });
    } catch (err) {
      console.error('Error cargando CSV:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.nombre || !formData.email || !formData.password) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${apiBaseUrl}/crear-usuario/`, {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
      });

      setSuccess(`✅ ${response.data.mensaje}`);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        password_confirm: '',
        rol: 'estudiante',
      });

      await fetchUsuarios();
      setTimeout(() => setActiveTab('usuarios'), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error al crear usuario';
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const obtenerUltimoRegistro = () => datos.length > 0 ? datos[datos.length - 1] : null;
  const ultimoRegistro = obtenerUltimoRegistro();

  const calcularStats = () => {
    if (datos.length === 0) return null;
    const temps = datos.map((d) => d.temperatura);
    const humeds = datos.map((d) => d.humedad);
    const radiaciones = datos.map((d) => d.radiacion_solar);
    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      temperature: ultimoRegistro?.temperatura || 0,
      humidity: ultimoRegistro?.humedad || 0,
      soilMoisture: ultimoRegistro?.humedad_suelo || 0,
      solarRadiation: ultimoRegistro?.radiacion_solar || 0,
      precipitation: ultimoRegistro?.precipitacion || 0,
      windSpeed: 0,
      tempPromedio: average(temps).toFixed(2),
      humedadPromedio: average(humeds).toFixed(2),
      radiacionPromedio: average(radiaciones).toFixed(0),
    };
  };

  const stats = calcularStats();

  const mockHistoricalData = datos.slice(-5).map((d) => ({
    fecha: d.date,
    temp: d.temperatura,
    hum: d.humedad,
    rad: Math.round(d.radiacion_solar / 100),
    precip: d.precipitacion,
    viento: 0,
  }));

  const obtenerRecomendaciones = () => {
    if (!ultimoRegistro) return [];
    return [
      { cultivo: 'Arroz', viabilidad: ultimoRegistro.arroz === 'Sí' ? 85 : 40, optimo: ultimoRegistro.arroz === 'Sí' },
      { cultivo: 'Maíz', viabilidad: ultimoRegistro.maiz === 'Sí' ? 78 : 45, optimo: ultimoRegistro.maiz === 'Sí' },
      { cultivo: 'Cacao', viabilidad: ultimoRegistro.cacao === 'Sí' ? 92 : 30, optimo: ultimoRegistro.cacao === 'Sí' },
      { cultivo: 'Banana', viabilidad: ultimoRegistro.banana === 'Sí' ? 88 : 35, optimo: ultimoRegistro.banana === 'Sí' },
    ];
  };

  const mockCropRecommendations = obtenerRecomendaciones();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex gap-2 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('crear-usuario')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'crear-usuario'
                ? 'border-b-4 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ Crear Usuario
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-b-4 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Dashboard Estudiante
          </button>
          <button
            onClick={() => setActiveTab('analisis')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'analisis'
                ? 'border-b-4 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📈 Análisis Profesor
          </button>
          <button
            onClick={() => setActiveTab('analisis-kmeans')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'analisis-kmeans'
                ? 'border-b-4 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📚 Análisis K-Means
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-6 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'usuarios'
                ? 'border-b-4 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 Usuarios
          </button>
        </div>
      </div>

      {activeTab === 'crear-usuario' && (
        <CrearUsuarioTab 
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          loading={loading}
          error={error}
          success={success}
        />
      )}
      {activeTab === 'dashboard' && (
        <DashboardEstudiante 
          ultimoRegistro={ultimoRegistro}
          stats={stats}
          datos={datos}
          mockCropRecommendations={mockCropRecommendations}
        />
      )}
      {activeTab === 'analisis' && (
        <DashboardProfesor 
          mockHistoricalData={mockHistoricalData}
          stats={stats}
          mockCropRecommendations={mockCropRecommendations}
          ultimoRegistro={ultimoRegistro}
          datos={datos}
        />
      )}
      {activeTab === 'analisis-kmeans' && (
        <div className="space-y-6">
          <AnalisisKMeans 
            variante="profesor"
            imagenClusters="/centroides.png"
            imagenCodo="/codo.png"
          />
        </div>
      )}
      {activeTab === 'usuarios' && (
        <GestionUsuarios 
          usuarios={usuarios}
          apiBaseUrl={apiBaseUrl}
          onRefresh={fetchUsuarios}
        />
      )}
    </div>
  );
};

export default AdministrativosView;