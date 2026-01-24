import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import mlService from '../services/mlService';

/**
 * PredictorCultivos - VERSIÓN 3.0 CORREGIDA
 * 
 * CORRECCIONES:
 * 1. ✅ Muestra confianza INDIVIDUAL por cultivo
 * 2. ✅ Muestra razón de NO viabilidad
 * 3. ✅ Resumen sincronizado con resultados reales
 * 4. ✅ Mejor visualización de métricas
 */

const PredictorCultivos = ({ 
  temperatura = 26.5, 
  radiacion = 4.8, 
  humedadSuelo = 82, 
  humedadRelativa = 81, 
  pluviometria = 1.0,
  onPrediccionesChange = null
}) => {
  const [predicciones, setPredicciones] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandido, setExpandido] = useState(false);

  const ultimaLlamada = useRef('');

  useEffect(() => {
    const key = `${temperatura}-${radiacion}-${humedadSuelo}-${humedadRelativa}-${pluviometria}`;
    
    if (key !== ultimaLlamada.current) {
      ultimaLlamada.current = key;
      cargarPredicciones();
    }
  }, [temperatura, radiacion, humedadSuelo, humedadRelativa, pluviometria]);

  const cargarPredicciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await mlService.predecirCultivos(
        temperatura,
        radiacion,
        humedadSuelo,
        humedadRelativa,
        pluviometria
      );

      setPredicciones(res.predicciones);
      setResultado(res);

      if (onPrediccionesChange && res.predicciones) {
        onPrediccionesChange(res.predicciones);
      }
    } catch (err) {
      setError('Error cargando predicciones');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Función para obtener el color de la barra de confianza
  const getColorConfianza = (confianza) => {
    if (confianza >= 80) return '#10b981'; // Verde
    if (confianza >= 60) return '#f59e0b'; // Amarillo
    if (confianza >= 40) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  // ⭐ Función para obtener el emoji del cultivo
  const getEmojiCultivo = (cultivo) => {
    const emojis = {
      'Tomate': '🍅',
      'Banana': '🍌',
      'Cacao': '🌰',
      'Arroz': '🌾',
      'Maiz': '🌽'
    };
    return emojis[cultivo] || '🌱';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        <p className="text-gray-600 mt-3">Analizando condiciones climáticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  // Contar viables y no viables
  const cultivosViables = predicciones.filter(p => p.viabilidad);
  const cultivosNoViables = predicciones.filter(p => !p.viabilidad);

  return (
    <div className="space-y-4">
      
      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║ TARJETA RESUMEN RÁPIDO - SIEMPRE VISIBLE                     ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          🌾 Predicción de Cultivos
          <span className="text-sm font-normal text-gray-500">
            (Modelo v{predicciones[0]?.modelo_version || '3.0'})
          </span>
        </h3>

        {/* Condiciones actuales */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="text-center">
            <span className="text-gray-500">🌡️ Temp</span>
            <p className="font-bold text-red-600">{temperatura}°C</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500">💧 Humedad</span>
            <p className="font-bold text-blue-600">{humedadRelativa}%</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500">🌧️ Lluvia</span>
            <p className="font-bold text-cyan-600">{pluviometria} mm</p>
          </div>
        </div>

        {/* Resumen de viabilidad */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{cultivosViables.length}</p>
            <p className="text-sm text-green-700">Viables</p>
          </div>
          <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{cultivosNoViables.length}</p>
            <p className="text-sm text-red-700">No Viables</p>
          </div>
        </div>

        {/* Lista rápida de cultivos con confianza INDIVIDUAL */}
        <div className="space-y-2">
          {predicciones.map((pred) => (
            <div
              key={pred.cultivo}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                pred.viabilidad 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{getEmojiCultivo(pred.cultivo)}</span>
                <span className="font-medium">{pred.cultivo}</span>
                {pred.es_optimo_en_cluster && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                    ⭐ Óptimo
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* ⭐ Barra de confianza visual */}
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${pred.confianza}%`,
                      backgroundColor: getColorConfianza(pred.confianza)
                    }}
                  />
                </div>
                
                {/* ⭐ Badge con confianza INDIVIDUAL */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    pred.viabilidad ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {pred.viabilidad ? '✅' : '❌'} {pred.confianza.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║ PANEL EXPANDIBLE CON ANÁLISIS DETALLADO K-MEANS              ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      {resultado && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              📊 Análisis Detallado con K-Means
            </span>
            {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandido && (
            <div className="p-6 space-y-6 border-t-2 border-gray-200">
              
              {/* ⭐ INFORMACIÓN DEL CLUSTER */}
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: resultado.cluster.color + '15',
                  borderLeft: `4px solid ${resultado.cluster.color}`,
                }}
              >
                <h4 
                  className="text-lg font-bold mb-2"
                  style={{ color: resultado.cluster.color }}
                >
                  {resultado.cluster.cluster_nombre}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {resultado.cluster.cluster_descripcion}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="text-gray-500">📊 Confianza Cluster:</span>
                    <span className="font-bold ml-2">{resultado.cluster.confianza}%</span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="text-gray-500">🎯 Cultivos Óptimos:</span>
                    <span className="font-bold ml-2">{resultado.cluster.cultivos_optimos.join(', ')}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  ℹ️ Este perfil climático ocurre en ~{resultado.cluster.tamaño_cluster} días del año
                </p>
              </div>

              {/* ⭐ DETALLE POR CULTIVO CON RAZONES */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">
                  📈 Viabilidad Detallada por Cultivo:
                </h4>

                <div className="space-y-3">
                  {resultado.predicciones.map((pred) => (
                    <div
                      key={pred.cultivo}
                      className={`p-4 rounded-lg border-l-4 ${
                        pred.viabilidad
                          ? 'bg-green-50 border-green-500'
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getEmojiCultivo(pred.cultivo)}</span>
                            <strong className="text-lg">{pred.cultivo}</strong>
                            {pred.es_optimo_en_cluster && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-bold">
                                ⭐ Óptimo en este perfil
                              </span>
                            )}
                          </div>
                          
                          {/* ⭐ Mostrar razón si NO es viable */}
                          {!pred.viabilidad && pred.razon_no_viable && (
                            <p className="text-sm text-red-600 mt-2">
                              ⚠️ {pred.razon_no_viable}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${
                              pred.viabilidad ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          >
                            {pred.viabilidad ? '✅ Viable' : '❌ No Viable'}
                          </span>
                          <p className="text-sm mt-1 font-medium" style={{ color: getColorConfianza(pred.confianza) }}>
                            Confianza: {pred.confianza.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Barra de confianza visual */}
                      <div className="mt-3">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700"
                            style={{ 
                              width: `${pred.confianza}%`,
                              backgroundColor: getColorConfianza(pred.confianza)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⭐ RESUMEN CONTEXTUAL MEJORADO */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                <strong className="text-amber-800">📊 Resumen:</strong>
                <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {resultado.resumen}
                </pre>
              </div>

              {/* Info técnica */}
              <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded-lg">
                <p><strong>Distancia mínima al centroide:</strong> {resultado.distanciaMinima}</p>
                <p><strong>Modelo:</strong> v{resultado.predicciones[0]?.modelo_version} | Datos: {resultado.cluster.tamaño_cluster} registros históricos</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictorCultivos;
