import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import mlService from '../services/mlService';

/**
 * PredictorCultivos - Componente MEJORADO
 * Combina:
 * 1. Tarjeta simplificada (como en la imagen) - SIEMPRE VISIBLE
 * 2. Panel expandible con K-Means + análisis completo
 * 3. ⭐ NUEVO: Callback para pasar predicciones al componente padre
 */

const PredictorCultivos = ({ 
  temperatura = 26.5, 
  radiacion = 4.8, 
  humedadSuelo = 82, 
  humedadRelativa = 81, 
  pluviometria = 1.0,
  onPrediccionesChange = null  // ⭐ NUEVO: Callback opcional
}) => {
  const [predicciones, setPredicciones] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandido, setExpandido] = useState(false);

  // ⭐ Ref para evitar llamadas duplicadas
  const ultimaLlamada = useRef('');

  useEffect(() => {
    // Crear una key única para estos parámetros
    const key = `${temperatura}-${radiacion}-${humedadSuelo}-${humedadRelativa}-${pluviometria}`;
    
    // Solo cargar si los parámetros cambiaron
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

      // ⭐ NUEVO: Notificar al padre si hay callback
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        <p className="text-gray-600 mt-3">Cargando predicciones...</p>
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

  return (
    <div className="space-y-4">
 
      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║ PARTE 2: PANEL EXPANDIBLE CON K-MEANS + ANÁLISIS COMPLETO   ║ */}
      {/* ║ COLAPSABLE - El usuario decide si quiere ver los detalles   ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      {resultado && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* BOTÓN PARA EXPANDIR/CONTRAER */}
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              {expandido ? '▼' : '▶'} 📊 Análisis Detallado con K-Means (Clustering)
            </span>
            {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* CONTENIDO EXPANDIBLE - SOLO SE MUESTRA CUANDO expandido = true */}
          {expandido && (
            <div className="p-6 space-y-6 border-t-2 border-gray-200">
              
              {/* ⭐ INFORMACIÓN DEL CLUSTER (K-MEANS) */}
              <div
                style={{
                  backgroundColor: resultado.cluster.color + '20',
                  borderLeft: `4px solid ${resultado.cluster.color}`,
                  padding: '15px',
                  borderRadius: '8px'
                }}
              >
                <h3
                  style={{
                    margin: '0 0 10px 0',
                    color: resultado.cluster.color,
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  {resultado.cluster.cluster_nombre}
                </h3>

                <p
                  style={{
                    margin: '5px 0',
                    fontSize: '14px',
                    color: '#666'
                  }}
                >
                  {resultado.cluster.cluster_descripcion}
                </p>

                <div
                  style={{
                    marginTop: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <strong>📊 Confianza del Cluster:</strong> {resultado.cluster.confianza}%
                  </div>
                  <div>
                    <strong>🎯 Cultivos Óptimos:</strong>{' '}
                    {resultado.cluster.cultivos_optimos.join(', ')}
                  </div>
                </div>

                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#999'
                  }}
                >
                  ℹ️ Este perfil climático ocurre en ~{resultado.cluster.tamaño_cluster} días del año
                </p>
              </div>

              {/* 📈 VIABILIDAD DE CULTIVOS CON CONTEXTO K-MEANS */}
              <div>
                <h4
                  style={{
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '12px',
                    fontSize: '16px'
                  }}
                >
                  📈 Viabilidad Contextualizada (según perfil K-Means):
                </h4>

                <div className="space-y-3">
                  
{resultado.predicciones.map((pred) => {
  const esViableVisual = pred.viabilidad || pred.es_optimo_en_cluster;

  return (
    <div
      key={pred.cultivo}
      style={{
        padding: '12px',
        backgroundColor: esViableVisual ? '#f0fdf4' : '#fef2f2',
        borderRadius: '6px',
        borderLeft: `3px solid ${esViableVisual ? '#10b981' : '#ef4444'}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <strong>{pred.cultivo}</strong>
          {pred.es_optimo_en_cluster && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '12px',
                color: '#10b981',
                fontWeight: 'bold'
              }}
            >
              ⭐ Óptimo en este perfil
            </span>
          )}
        </div>

        <span
          style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: esViableVisual ? '#10b981' : '#ef4444'
          }}
        >
          {esViableVisual ? '✅ Viable' : '❌ No viable'} ({pred.confianza}%)
        </span>
      </div>
    </div>
  );
})}

                </div>
              </div>

              {/* 📊 RESUMEN CONTEXTUAL */}
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  borderLeft: '4px solid #f59e0b',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <strong style={{ fontSize: '14px' }}>📊 Resumen Contextual:</strong>
                <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {resultado.resumen}
                </p>
              </div>

              {/* INFORMACIÓN TÉCNICA DEL MODELO */}
              <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded">
                <p>
                  <strong>Distancia mínima al centroide:</strong> {resultado.distanciaMinima}
                </p>
                <p>
                  <strong>Modelo:</strong> {resultado.predicciones[0]?.modelo_version} | K-Means entrenado con {resultado.cluster.tamaño_cluster} registros históricos
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictorCultivos;
