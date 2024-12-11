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

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DeviceReport() {
  // Estado para almacenar los registros de la API
  const [report, setReport] = useState({ logs: [], loading: true, error: null });

  // 🕒 Parámetros predeterminados para la consulta
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [codes, setCodes] = useState('va_temperature,va_humidity'); // 🚀 Solicitar Temperatura y Humedad
  const [size, setSize] = useState('100'); // 🚀 Traer 100 registros por cada consulta

  // 📡 Función para obtener todos los registros desde la API
  const fetchAllReports = async () => {
    setReport({ logs: [], loading: true, error: null });
    let lastRowKey = ''; // Clave de la última fila para la paginación
    let allLogs = []; // Aquí se acumulan todos los registros

    try {
      while (true) {
        const url = new URL('/api/tuya/report', window.location.origin);
        url.searchParams.append('codes', codes);
        url.searchParams.append('start_time', startTime);
        url.searchParams.append('end_time', endTime);
        url.searchParams.append('last_row_key', lastRowKey); // 🚀 Usa la clave para paginación
        url.searchParams.append('size', size); // 🚀 Cantidad de registros por página

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          setReport({ logs: [], loading: false, error: data.error });
          break;
        } else {
          // Acumular los registros
          allLogs = [...allLogs, ...data.data.logs];
          lastRowKey = data.data.last_row_key;

          // Actualizar el estado con los nuevos registros
          setReport(prevReport => ({ 
            logs: allLogs,
            loading: false, 
            error: null
          }));

          // Verificar si no hay más registros
          if (!data.data.has_more) {
            break; // Salimos del ciclo while
          }
        }
      }
    } catch (error) {
      setReport({ logs: [], loading: false, error: 'Error al obtener los registros' });
    }
  };

  // ⚙️ Calcula el intervalo de tiempo
  const calculateTimeRange = (rangeType) => {
    const now = Date.now();
    let start = 0;

    if (rangeType === 'last_day') {
      start = now - 24 * 60 * 60 * 1000; // 1 día
    } else if (rangeType === 'last_3_days') {
      start = now - 3 * 24 * 60 * 60 * 1000; // 3 días
    } else if (rangeType === 'last_7_days') {
      start = now - 7 * 24 * 60 * 60 * 1000; // 7 días
    } else if (rangeType === 'last_month') {
      start = now - 30 * 24 * 60 * 60 * 1000; // 30 días
    } else if (rangeType === 'last_3_months') {
      start = now - 90 * 24 * 60 * 60 * 1000; // 3 meses
    } else if (rangeType === 'last_year') {
      start = now - 365 * 24 * 60 * 60 * 1000; // 1 año
    }

    setStartTime(start.toString());
    setEndTime(now.toString());
  };

  // 📡 useEffect para consultar la API cuando cambian los parámetros
  useEffect(() => {
    if (startTime && endTime) {
      fetchAllReports();
    }
  }, [startTime, endTime, codes, size]);

  // Formato de fecha legible
  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString();
  };

  // 📈 Preparar los datos para el gráfico
  const temperatureLogs = report.logs.filter(item => item.code === 'va_temperature');
  const humidityLogs = report.logs.filter(item => item.code === 'va_humidity');
  
  const chartData = {
    labels: temperatureLogs.map(item => formatDate(item.event_time)), // Eje X: Tiempos
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: temperatureLogs.map(item => parseInt(item.value) / 10),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
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
        <button onClick={() => calculateTimeRange('last_month')} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600">1M</button>
        <button onClick={() => calculateTimeRange('last_3_months')} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600">3M</button>
        <button onClick={() => calculateTimeRange('last_year')} className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600">1Y</button>
      </div>

      {report.loading && <div>Cargando todos los registros...</div>}
      {report.error && <div>Error: {report.error}</div>}

      {!report.loading && !report.error && report.logs.length > 0 && (
        <div>
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
}
