import { useState, useEffect } from 'react';

export default function DeviceReport() {
  const [report, setReport] = useState({ logs: [], loading: true, error: null });
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [codes, setCodes] = useState('va_temperature,va_humidity');
  const [size, setSize] = useState('100');

  const fetchAllReports = async () => {
    setReport({ logs: [], loading: true, error: null });
    let lastRowKey = ''; 
    let allLogs = []; 

    try {
      while (true) {
        const url = new URL('/api/tuya/report', window.location.origin);
        url.searchParams.append('codes', codes);
        url.searchParams.append('start_time', startTime);
        url.searchParams.append('end_time', endTime);
        url.searchParams.append('last_row_key', lastRowKey); 
        url.searchParams.append('size', size); 

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          setReport({ logs: [], loading: false, error: data.error });
          break;
        } else {
          allLogs = [...allLogs, ...data.data.logs];
          lastRowKey = data.data.last_row_key;

          setReport(prevReport => ({ 
            logs: allLogs,
            loading: false, 
            error: null
          }));

          if (!data.data.has_more) {
            break; 
          }
        }
      }
    } catch (error) {
      setReport({ logs: [], loading: false, error: 'Error al obtener los registros' });
    }
  };

  const calculateTimeRange = () => {
    const now = Date.now();
    const start = now - 24 * 60 * 60 * 1000; // Últimas 24 horas
    setStartTime(start.toString());
    setEndTime(now.toString());
  };

  useEffect(() => {
    if (startTime && endTime) fetchAllReports();
  }, [startTime, endTime, codes, size]);

  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString();
  };

  // Filtrar los registros de temperatura y humedad
  const temperatureLogs = report.logs.filter(item => item.code === 'va_temperature');
  const humidityLogs = report.logs.filter(item => item.code === 'va_humidity');

  // Unir los registros por evento (suponiendo que los tiempos coinciden)
  const mergedLogs = temperatureLogs.map(tempLog => {
    const matchingHumidityLog = humidityLogs.find(humLog => humLog.event_time === tempLog.event_time);
    return {
      time: formatDate(tempLog.event_time),
      temperature: parseInt(tempLog.value) / 10, // Conversión a grados Celsius
      humidity: matchingHumidityLog ? parseInt(matchingHumidityLog.value) : 'N/A'
    };
  });

  // 🔥 Calcular los valores MÁXIMOS y MÍNIMOS para Temperatura y Humedad
  const temperatures = temperatureLogs.map(log => parseInt(log.value) / 10);
  const humidities = humidityLogs.map(log => parseInt(log.value));

  const maxTemperature = temperatures.length ? Math.max(...temperatures) : 'N/A';
  const minTemperature = temperatures.length ? Math.min(...temperatures) : 'N/A';

  const maxHumidity = humidities.length ? Math.max(...humidities) : 'N/A';
  const minHumidity = humidities.length ? Math.min(...humidities) : 'N/A';

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Reporte de Temperatura y Humedad</h1>

      <button 
        onClick={calculateTimeRange} 
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 mb-6"
      >
        Cargar últimos 24 horas
      </button>

      {report.loading && <div>Cargando todos los registros...</div>}
      {report.error && <div>Error: {report.error}</div>}

      {!report.loading && !report.error && report.logs.length > 0 && (
        <div className="bg-white p-4 rounded shadow">

          {/* Sección de máximos y mínimos */}
          <h2 className="text-xl font-bold mb-4">Resumen de las últimas 24 horas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded shadow-md">
              <h3 className="font-bold text-lg">🌡️ Temperatura</h3>
              <p><strong>Máxima:</strong> {maxTemperature} °C</p>
              <p><strong>Mínima:</strong> {minTemperature} °C</p>
            </div>
            <div className="p-4 bg-gray-50 rounded shadow-md">
              <h3 className="font-bold text-lg">💧 Humedad</h3>
              <p><strong>Máxima:</strong> {maxHumidity} %</p>
              <p><strong>Mínima:</strong> {minHumidity} %</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4">Registros de las últimas 24 horas</h2>
          <ul className="space-y-4">
            {mergedLogs.map((log, index) => (
              <li key={index} className="p-4 bg-gray-50 rounded shadow-md">
                <p><strong>Hora:</strong> {log.time}</p>
                <p><strong>Temperatura:</strong> {log.temperature} °C</p>
                <p><strong>Humedad:</strong> {log.humidity} %</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
