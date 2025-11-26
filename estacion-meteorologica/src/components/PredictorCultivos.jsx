// import React, { useState, useEffect } from 'react';
// import { TrendingUp, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
// import mlService from '../services/mlService';

// /**
//  * PredictorCultivos - Componente MEJORADO
//  * Combina:
//  * 1. Tarjeta simplificada (como en la imagen) - SIEMPRE VISIBLE
//  * 2. Panel expandible con K-Means + análisis completo
//  */

// const PredictorCultivos = ({ 
//   temperatura = 26.5, 
//   radiacion = 4.8, 
//   humedadSuelo = 82, 
//   humedadRelativa = 81, 
//   pluviometria = 1.0 
// }) => {
//   const [predicciones, setPredicciones] = useState([]);
//   const [resultado, setResultado] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [expandido, setExpandido] = useState(false);

//   useEffect(() => {
//     cargarPredicciones();
//   }, [temperatura, radiacion, humedadSuelo, humedadRelativa, pluviometria]);

//   const cargarPredicciones = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await mlService.predecirCultivos(
//         temperatura,
//         radiacion,
//         humedadSuelo,
//         humedadRelativa,
//         pluviometria
//       );

//       setPredicciones(res.predicciones);
//       setResultado(res);
//     } catch (err) {
//       setError('Error cargando predicciones');
//       console.error('Error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white rounded-xl shadow-lg p-8 text-center">
//         <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
//         <p className="text-gray-600 mt-3">Cargando predicciones...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl">
//         {error}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {/* ╔══════════════════════════════════════════════════════════════╗ */}
//       {/* ║ PARTE 1: TARJETA SIMPLIFICADA (como en la imagen)           ║ */}
//       {/* ║ SIEMPRE VISIBLE - No se puede contraer                      ║ */}
//       {/* ╚══════════════════════════════════════════════════════════════╝ */}
//       <div className="bg-white rounded-xl shadow-lg p-6">
//         <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//           <TrendingUp className="text-green-600" />
//           🌾 Predicciones de Cultivos (Modelo CSV)
//         </h3>

//         {/* CONDICIONES ACTUALES */}
//         <div className="bg-blue-50 p-4 rounded-lg mb-6 border-2 border-blue-200">
//           <p className="text-sm font-semibold text-gray-700 mb-3">Condiciones Actuales:</p>
//           <div className="grid grid-cols-5 gap-2">
//             <div className="bg-white p-2 rounded text-center">
//               <p className="text-xs text-gray-600">Temp</p>
//               <p className="text-lg font-bold text-red-600">{temperatura}°C</p>
//             </div>
//             <div className="bg-white p-2 rounded text-center">
//               <p className="text-xs text-gray-600">Rad</p>
//               <p className="text-lg font-bold text-yellow-600">{radiacion.toFixed(1)} kW/m²</p>
//             </div>
//             <div className="bg-white p-2 rounded text-center">
//               <p className="text-xs text-gray-600">H. Suelo</p>
//               <p className="text-lg font-bold text-amber-600">{humedadSuelo}%</p>
//             </div>
//             <div className="bg-white p-2 rounded text-center">
//               <p className="text-xs text-gray-600">H. Rel</p>
//               <p className="text-lg font-bold text-blue-600">{humedadRelativa}%</p>
//             </div>
//             <div className="bg-white p-2 rounded text-center">
//               <p className="text-xs text-gray-600">Pluvia</p>
//               <p className="text-lg font-bold text-cyan-600">{pluviometria} mm</p>
//             </div>
//           </div>
//         </div>

//         {/* PREDICCIONES - TARJETAS SIMPLIFICADAS (COMO EN LA IMAGEN) */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
//           {predicciones.map((pred, idx) => (
//             <div
//               key={idx}
//               className={`p-4 rounded-lg border-2 ${
//                 pred.viabilidad
//                   ? 'bg-green-50 border-green-300'
//                   : 'bg-red-50 border-red-300'
//               }`}
//             >
//               {/* TÍTULO Y ICONO */}
//               <div className="flex items-center gap-2 mb-3">
//                 {pred.viabilidad ? (
//                   <CheckCircle className="text-green-600" size={20} />
//                 ) : (
//                   <AlertCircle className="text-red-600" size={20} />
//                 )}
//                 <h4 className="font-bold text-gray-800 text-sm">{pred.cultivo}</h4>
//               </div>

//               {/* ESTADO */}
//               <p className={`text-xs font-bold mb-2 ${
//                 pred.viabilidad ? 'text-green-600' : 'text-red-600'
//               }`}>
//                 {pred.viabilidad ? '✓ VIABLE' : '✗ NO VIABLE'}
//               </p>

//               {/* BARRA DE CONFIANZA */}
//               <div className="mb-2">
//                 <div className="flex justify-between text-xs mb-1">
//                   <span className="text-gray-600">Confianza</span>
//                   <span className="font-semibold">{pred.confianza}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className={`h-2 rounded-full transition-all ${
//                       pred.viabilidad ? 'bg-green-600' : 'bg-red-600'
//                     }`}
//                     style={{ width: `${pred.confianza}%` }}
//                   />
//                 </div>
//               </div>

//               {/* INFO PEQUEÑA */}
//               <div className="text-xs text-gray-600 space-y-0.5">
//                 <div>T°: {pred.prediccion_temperatura}°C</div>
//                 <div>H°: {pred.prediccion_humedad}%</div>
//                 <div>P°: {pred.prediccion_precipitacion}mm</div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* PIE DE PÁGINA */}
//         <div className="mt-4 text-xs text-gray-500 text-center">
//           Modelo basado en análisis de CSV histórico - v{predicciones[0]?.modelo_version}
//         </div>
//       </div>

//       {/* ╔══════════════════════════════════════════════════════════════╗ */}
//       {/* ║ PARTE 2: PANEL EXPANDIBLE CON K-MEANS + ANÁLISIS COMPLETO   ║ */}
//       {/* ║ COLAPSABLE - El usuario decide si quiere ver los detalles   ║ */}
//       {/* ╚══════════════════════════════════════════════════════════════╝ */}
//       {resultado && (
//         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//           {/* BOTÓN PARA EXPANDIR/CONTRAER */}
//           <button
//             onClick={() => setExpandido(!expandido)}
//             className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold flex items-center justify-between transition"
//           >
//             <span className="flex items-center gap-2">
//               {expandido ? '▼' : '▶'} 📊 Análisis Detallado con K-Means (Clustering)
//             </span>
//             {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
//           </button>

//           {/* CONTENIDO EXPANDIBLE - SOLO SE MUESTRA CUANDO expandido = true */}
//           {expandido && (
//             <div className="p-6 space-y-6 border-t-2 border-gray-200">
              
//               {/* ⭐ INFORMACIÓN DEL CLUSTER (K-MEANS) */}
//               <div
//                 style={{
//                   backgroundColor: resultado.cluster.color + '20',
//                   borderLeft: `4px solid ${resultado.cluster.color}`,
//                   padding: '15px',
//                   borderRadius: '8px'
//                 }}
//               >
//                 <h3
//                   style={{
//                     margin: '0 0 10px 0',
//                     color: resultado.cluster.color,
//                     fontSize: '18px',
//                     fontWeight: 'bold'
//                   }}
//                 >
//                   {resultado.cluster.cluster_nombre}
//                 </h3>

//                 <p
//                   style={{
//                     margin: '5px 0',
//                     fontSize: '14px',
//                     color: '#666'
//                   }}
//                 >
//                   {resultado.cluster.cluster_descripcion}
//                 </p>

//                 <div
//                   style={{
//                     marginTop: '10px',
//                     display: 'grid',
//                     gridTemplateColumns: '1fr 1fr',
//                     gap: '10px',
//                     fontSize: '13px'
//                   }}
//                 >
//                   <div>
//                     <strong>📊 Confianza del Cluster:</strong> {resultado.cluster.confianza}%
//                   </div>
//                   <div>
//                     <strong>🎯 Cultivos Óptimos:</strong>{' '}
//                     {resultado.cluster.cultivos_optimos.join(', ')}
//                   </div>
//                 </div>

//                 <p
//                   style={{
//                     margin: '8px 0 0 0',
//                     fontSize: '12px',
//                     color: '#999'
//                   }}
//                 >
//                   ℹ️ Este perfil climático ocurre en ~{resultado.cluster.tamaño_cluster} días del año
//                 </p>
//               </div>

//               {/* 📈 VIABILIDAD DE CULTIVOS CON CONTEXTO K-MEANS */}
//               <div>
//                 <h4
//                   style={{
//                     fontWeight: 'bold',
//                     color: '#333',
//                     marginBottom: '12px',
//                     fontSize: '16px'
//                   }}
//                 >
//                   📈 Viabilidad Contextualizada (según perfil K-Means):
//                 </h4>

//                 <div className="space-y-3">
//                   {resultado.predicciones.map((pred) => (
//                     <div
//                       key={pred.cultivo}
//                       style={{
//                         padding: '12px',
//                         backgroundColor: pred.es_optimo_en_cluster
//                           ? '#f0fdf4'
//                           : '#f9fafb',
//                         borderRadius: '6px',
//                         borderLeft: `3px solid ${
//                           pred.viabilidad ? '#10b981' : '#ef4444'
//                         }`
//                       }}
//                     >
//                       <div
//                         style={{
//                           display: 'flex',
//                           justifyContent: 'space-between',
//                           alignItems: 'center'
//                         }}
//                       >
//                         <div>
//                           <strong>{pred.cultivo}</strong>
//                           {pred.es_optimo_en_cluster && (
//                             <span
//                               style={{
//                                 marginLeft: '8px',
//                                 fontSize: '12px',
//                                 color: '#10b981',
//                                 fontWeight: 'bold'
//                               }}
//                             >
//                               ⭐ Óptimo en este perfil
//                             </span>
//                           )}
//                         </div>

//                         <span
//                           style={{
//                             padding: '4px 12px',
//                             borderRadius: '20px',
//                             fontSize: '12px',
//                             fontWeight: 'bold',
//                             color: '#fff',
//                             backgroundColor: pred.viabilidad
//                               ? '#10b981'
//                               : '#ef4444'
//                           }}
//                         >
//                           {pred.viabilidad ? '✅ Viable' : '❌ No viable'} (
//                           {pred.confianza}%)
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* 📊 RESUMEN CONTEXTUAL */}
//               <div
//                 style={{
//                   backgroundColor: '#fffbeb',
//                   borderLeft: '4px solid #f59e0b',
//                   padding: '12px',
//                   borderRadius: '6px',
//                   fontSize: '13px'
//                 }}
//               >
//                 <strong style={{ fontSize: '14px' }}>📊 Resumen Contextual:</strong>
//                 <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
//                   {resultado.resumen}
//                 </p>
//               </div>

//               {/* INFORMACIÓN TÉCNICA DEL MODELO */}
//               <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded">
//                 <p>
//                   <strong>Distancia mínima al centroide:</strong> {resultado.distanciaMinima}
//                 </p>
//                 <p>
//                   <strong>Modelo:</strong> {resultado.predicciones[0]?.modelo_version} | K-Means entrenado con {resultado.cluster.tamaño_cluster} registros históricos
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PredictorCultivos;

import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import mlService from '../services/mlService';

/**
 * PredictorCultivos - Componente MEJORADO
 * Combina:
 * 1. Tarjeta simplificada (como en la imagen) - SIEMPRE VISIBLE
 * 2. Panel expandible con K-Means + análisis completo
 */

const PredictorCultivos = ({ 
  temperatura = 26.5, 
  radiacion = 4.8, 
  humedadSuelo = 82, 
  humedadRelativa = 81, 
  pluviometria = 1.0 
}) => {
  const [predicciones, setPredicciones] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    cargarPredicciones();
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
      {/* ║ PARTE 1: TARJETA SIMPLIFICADA (como en la imagen)           ║ */}
      {/* ║ SIEMPRE VISIBLE - No se puede contraer                      ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-green-600" />
          🌾 Predicciones de Cultivos (Modelo CSV)
        </h3>

        {/* CONDICIONES ACTUALES */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border-2 border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Condiciones Actuales:</p>
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Temp</p>
              <p className="text-lg font-bold text-red-600">{temperatura}°C</p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Rad</p>
              <p className="text-lg font-bold text-yellow-600">{radiacion.toFixed(1)} kW/m²</p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">H. Suelo</p>
              <p className="text-lg font-bold text-amber-600">{humedadSuelo}%</p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">H. Rel</p>
              <p className="text-lg font-bold text-blue-600">{humedadRelativa}%</p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Pluvia</p>
              <p className="text-lg font-bold text-cyan-600">{pluviometria} mm</p>
            </div>
          </div>
        </div>

        {/* PREDICCIONES - TARJETAS SIMPLIFICADAS (COMO EN LA IMAGEN) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          {predicciones.map((pred, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${
                pred.viabilidad
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              {/* TÍTULO Y ICONO */}
              <div className="flex items-center gap-2 mb-3">
                {pred.viabilidad ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <AlertCircle className="text-red-600" size={20} />
                )}
                <h4 className="font-bold text-gray-800 text-sm">{pred.cultivo}</h4>
              </div>

              {/* ESTADO */}
              <p className={`text-xs font-bold mb-2 ${
                pred.viabilidad ? 'text-green-600' : 'text-red-600'
              }`}>
                {pred.viabilidad ? '✓ VIABLE' : '✗ NO VIABLE'}
              </p>

              {/* BARRA DE CONFIANZA */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Confianza</span>
                  <span className="font-semibold">{pred.confianza}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      pred.viabilidad ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${pred.confianza}%` }}
                  />
                </div>
              </div>

              {/* INFO PEQUEÑA */}
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>T°: {pred.prediccion_temperatura}°C</div>
                <div>H°: {pred.prediccion_humedad}%</div>
                <div>P°: {pred.prediccion_precipitacion}mm</div>
              </div>
            </div>
          ))}
        </div>

        {/* PIE DE PÁGINA */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Modelo basado en análisis de CSV histórico - v{predicciones[0]?.modelo_version}
        </div>
      </div>

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
                  {resultado.predicciones.map((pred) => (
                    <div
                      key={pred.cultivo}
                      style={{
                        padding: '12px',
                        backgroundColor: pred.es_optimo_en_cluster
                          ? '#f0fdf4'
                          : '#f9fafb',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${
                          pred.viabilidad ? '#10b981' : '#ef4444'
                        }`
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
                            backgroundColor: pred.viabilidad
                              ? '#10b981'
                              : '#ef4444'
                          }}
                        >
                          {pred.viabilidad ? '✅ Viable' : '❌ No viable'} (
                          {pred.confianza}%)
                        </span>
                      </div>
                    </div>
                  ))}
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