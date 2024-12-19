import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

  const calculateTimeRange = (rangeType) => {
    const now = Date.now();
    let start = 0;

    if (rangeType === 'last_day') start = now - 24 * 60 * 60 * 1000; 
    else if (rangeType === 'last_3_days') start = now - 3 * 24 * 60 * 60 * 1000; 
    else if (rangeType === 'last_7_days') start = now - 7 * 24 * 60 * 60 * 1000; 
    else if (rangeType === 'last_month') start = now - 30 * 24 * 60 * 60 * 1000; 
    else if (rangeType === 'last_3_months') start = now - 90 * 24 * 60 * 60 * 1000; 
    else if (rangeType === 'last_year') start = now - 365 * 24 * 60 * 60 * 1000; 

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

  // Preparar datos de gráficos individuales
  const temperatureChartData = {
    labels: temperatureLogs.map(item => formatDate(item.event_time)),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: temperatureLogs.map(item => parseInt(item.value) / 10),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ],
  };

  const humidityChartData = {
    labels: humidityLogs.map(item => formatDate(item.event_time)),
    datasets: [
      {
        label: 'Humedad (%)',
        data: humidityLogs.map(item => parseInt(item.value)),
        borderColor: 'rgba(192, 75, 75, 1)',
        backgroundColor: 'rgba(192, 75, 75, 0.2)',
      }
    ],
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Reporte de Temperatura y Humedad</h1>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button onClick={() => calculateTimeRange('last_day')} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">1D</button>
        <button onClick={() => calculateTimeRange('last_3_days')} className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600">3D</button>
        <button onClick={() => calculateTimeRange('last_7_days')} className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600">7D</button>
      </div>

      {report.loading && <div>Cargando todos los registros...</div>}
      {report.error && <div>Error: {report.error}</div>}

      {!report.loading && !report.error && report.logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">Gráfico de Temperatura</h2>
            <Line data={temperatureChartData} />
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-center">Gráfico de Humedad</h2>
            <Line data={humidityChartData} />
          </div>

        </div>
      )}
    </div>
  );
}
