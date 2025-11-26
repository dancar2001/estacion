import Papa from 'papaparse';

class MLService {
  constructor() {
    this.cultivosData = [];
    this.isLoaded = false;
    this.cultivos = ['Tomate', 'Banana', 'Cacao', 'Arroz', 'Maiz'];
    this.datosExternos = [];

    this.centroides = [
      {
        id: 0,
        nombre: '🌧️ Exceso de Lluvias',
        descripcion: 'Días con precipitación alta y humedad elevada',
        cultivos_optimos: ['Tomate', 'Banana'],
        temperatura: 25.14,
        radiacion: 4.94,
        humedad_suelo: 84.42,
        humedad_relativa: 84.41,
        pluviometria: 35.86,
        tipo_cultivo_optimo: 1.27,
        tamaño: 64,
        color: '#3b82f6'
      },
      {
        id: 1,
        nombre: '☁️ Condiciones Moderadas',
        descripcion: 'Días con balance entre temperatura, humedad y radiación',
        cultivos_optimos: ['Banana', 'Cacao'],
        temperatura: 26.25,
        radiacion: 4.89,
        humedad_suelo: 83.84,
        humedad_relativa: 83.87,
        pluviometria: 7.01,
        tipo_cultivo_optimo: 2.10,
        tamaño: 241,
        color: '#10b981'
      },
      {
        id: 2,
        nombre: '☀️ Condiciones Secas',
        descripcion: 'Días con baja precipitación y humedad reducida',
        cultivos_optimos: ['Maiz', 'Arroz'],
        temperatura: 26.29,
        radiacion: 4.50,
        humedad_suelo: 78.45,
        humedad_relativa: 75.38,
        pluviometria: 1.32,
        tipo_cultivo_optimo: 2.46,
        tamaño: 261,
        color: '#f59e0b'
      }
    ];

    // ✅ SIN SINCRONIZACIÓN - Solo carga CSV local
  }

  /**
   * Cargar CSV desde la carpeta public
   */
  async cargarCSV() {
    return new Promise((resolve, reject) => {
      if (this.isLoaded) {
        resolve(this.cultivosData);
        return;
      }

      fetch('/cultivos_viabilidad_FINAL.csv')
        .then(response => response.text())
        .then(csvText => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              this.cultivosData = results.data;
              this.isLoaded = true;
              console.log('✅ CSV Cargado:', this.cultivosData.length, 'registros');
              resolve(this.cultivosData);
            },
            error: (error) => {
              console.error('❌ Error parsing CSV:', error);
              reject(error);
            }
          });
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Obtener datos externos sincronizados
   */
  obtenerDatosExternos() {
    return this.datosExternos;
  }

  /**
   * Obtener último dato del endpoint externo
   */
  obtenerUltimoDatoExterno() {
    if (this.datosExternos.length === 0) return null;
    return this.datosExternos[this.datosExternos.length - 1];
  }

  /**
   * CLASIFICAR CONDICIONES EN UN CLUSTER (K-Means)
   */
  clasificarCluster(temperatura, radiacion, humedadSuelo, humedadRelativa, pluviometria) {
    let mejorCluster = null;
    let menorDistancia = Infinity;

    this.centroides.forEach(centroide => {
      const distancia = Math.sqrt(
        Math.pow((centroide.temperatura - temperatura) / 10, 2) +
        Math.pow((centroide.radiacion - radiacion) / 5, 2) +
        Math.pow((centroide.humedad_suelo - humedadSuelo) / 100, 2) +
        Math.pow((centroide.humedad_relativa - humedadRelativa) / 100, 2) +
        Math.pow((centroide.pluviometria - pluviometria) / 50, 2)
      );

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        mejorCluster = centroide;
      }
    });

    const confianza = Math.max(0, 100 - menorDistancia * 10);

    return {
      cluster_id: mejorCluster.id,
      cluster_nombre: mejorCluster.nombre,
      cluster_descripcion: mejorCluster.descripcion,
      cultivos_optimos: mejorCluster.cultivos_optimos,
      distancia: parseFloat(menorDistancia.toFixed(3)),
      confianza: parseFloat(confianza.toFixed(1)),
      color: mejorCluster.color,
      tamaño_cluster: mejorCluster.tamaño
    };
  }

  /**
   * PREDICCIÓN CON CONTEXTO DE CLUSTER
   */
  async predecirCultivos(temperatura, radiacion, humedadSuelo, humedadRelativa, pluviometria) {
    if (!this.isLoaded) {
      await this.cargarCSV();
    }

    const clusterInfo = this.clasificarCluster(
      temperatura,
      radiacion,
      humedadSuelo,
      humedadRelativa,
      pluviometria
    );

    let mejorCoincidencia = null;
    let menorDistancia = Infinity;

    this.cultivosData.forEach(row => {
      if (!row.Temperatura) return;

      const rowTemp = parseFloat(row.Temperatura) || 0;
      const rowRad = parseFloat(row.RadiacionsolarpromediokWm2) || 0;
      const rowHumedadSuelo = parseFloat(row.HumedadSuelo) || 0;
      const rowHumedadRel = parseFloat(row.Humedadrelativa) || 0;
      const rowPluv = parseFloat(row.Pluviometria) || 0;

      const distancia = Math.sqrt(
        Math.pow((rowTemp - temperatura) / 10, 2) +
        Math.pow((rowRad - radiacion) / 5, 2) +
        Math.pow((rowHumedadSuelo - humedadSuelo) / 100, 2) +
        Math.pow((rowHumedadRel - humedadRelativa) / 100, 2) +
        Math.pow((rowPluv - pluviometria) / 50, 2)
      );

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        mejorCoincidencia = row;
      }
    });

    const predicciones = this.cultivos.map(cultivo => {
      const esViable = mejorCoincidencia[cultivo] === 'Sí';
      const confianzaPrediccion = Math.max(0, 100 - menorDistancia * 10);

      return {
        cultivo,
        viabilidad: esViable,
        confianza: parseFloat(confianzaPrediccion.toFixed(1)),
        es_optimo_en_cluster: clusterInfo.cultivos_optimos.includes(cultivo),
        prediccion_temperatura: parseFloat(temperatura.toFixed(1)),
        prediccion_humedad: parseFloat(humedadRelativa.toFixed(1)),
        prediccion_precipitacion: parseFloat(pluviometria.toFixed(1)),
        modelo_version: '2.0',
        generado_en: new Date().toISOString(),
      };
    });

    return {
      success: true,
      cluster: clusterInfo,
      predicciones,
      distanciaMinima: parseFloat(menorDistancia.toFixed(3)),
      resumen: this.generarResumen(clusterInfo, predicciones)
    };
  }

  /**
   * Generar resumen textual de la predicción
   */
  generarResumen(clusterInfo, predicciones) {
    const viables = predicciones.filter(p => p.viabilidad).map(p => p.cultivo);
    const optimosHoy = predicciones.filter(p => p.es_optimo_en_cluster && p.viabilidad).map(p => p.cultivo);

    let resumen = `Perfil: ${clusterInfo.cluster_nombre} (${clusterInfo.confianza}% confianza)\n`;

    if (viables.length === 0) {
      resumen += `⚠️ Ningún cultivo es viable hoy.\n`;
    } else {
      resumen += `✅ Cultivos viables: ${viables.join(', ')}\n`;
    }

    if (optimosHoy.length > 0) {
      resumen += `⭐ Óptimos en este perfil: ${optimosHoy.join(', ')}`;
    }

    return resumen;
  }

  /**
   * Obtener estadísticas del CSV
   */
  async obtenerEstadisticas() {
    if (!this.isLoaded) {
      await this.cargarCSV();
    }

    const stats = {
      totalRegistros: this.cultivosData.length,
      temperaturaRango: { min: Infinity, max: -Infinity },
      humedadRango: { min: Infinity, max: -Infinity },
      radiacionRango: { min: Infinity, max: -Infinity },
      clusters: this.centroides.map(c => ({
        nombre: c.nombre,
        tamaño: c.tamaño,
        porcentaje: ((c.tamaño / this.cultivosData.length) * 100).toFixed(1) + '%'
      }))
    };

    this.cultivosData.forEach(row => {
      if (!row.Temperatura) return;

      const temp = parseFloat(row.Temperatura) || 0;
      const hum = parseFloat(row.Humedadrelativa) || 0;
      const rad = parseFloat(row.RadiacionsolarpromediokWm2) || 0;

      if (temp < stats.temperaturaRango.min) stats.temperaturaRango.min = temp;
      if (temp > stats.temperaturaRango.max) stats.temperaturaRango.max = temp;
      if (hum < stats.humedadRango.min) stats.humedadRango.min = hum;
      if (hum > stats.humedadRango.max) stats.humedadRango.max = hum;
      if (rad < stats.radiacionRango.min) stats.radiacionRango.min = rad;
      if (rad > stats.radiacionRango.max) stats.radiacionRango.max = rad;
    });

    return stats;
  }

  /**
   * Obtener información de un cluster específico
   */
  obtenerCluster(clusterId) {
    return this.centroides.find(c => c.id === clusterId);
  }

  /**
   * Obtener todos los clusters
   */
  obtenerTodosClusters() {
    return this.centroides;
  }
}

export default new MLService();