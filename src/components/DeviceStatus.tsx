import { useState, useEffect } from 'react';

export default function DeviceStatus() {
  const [status, setStatus] = useState({ 
    deviceName: 'Cargando...', 
    temperature: 'Cargando...', 
    humidity: 'Cargando...', 
    vpd: 'Cargando...', 
    dewPoint: 'Cargando...', 
    batteryPercentage: 'Cargando...',
    maxTemperature: 'Cargando...', 
    minTemperature: 'Cargando...', 
    maxHumidity: 'Cargando...', 
    minHumidity: 'Cargando...'
  });

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/tuya/status');
      const data = await response.json();
      
      if (data.error) {
        setStatus(prevStatus => ({
          ...prevStatus,
          deviceName: 'Dispositivo no detectado', 
          temperature: 'Error', 
          humidity: 'Error', 
          vpd: 'Error', 
          dewPoint: 'Error', 
          batteryPercentage: 'Error'
        }));
      } else {
        setStatus(prevStatus => ({
          ...prevStatus,
          deviceName: data.deviceName, 
          temperature: data.temperature, 
          humidity: data.humidity, 
          vpd: data.vpd, 
          dewPoint: data.dewPoint, 
          batteryPercentage: data.batteryPercentage
        }));
      }
    } catch (error) {
      setStatus(prevStatus => ({
        ...prevStatus,
        deviceName: 'Error en la conexión', 
        temperature: 'Error', 
        humidity: 'Error', 
        vpd: 'Error', 
        dewPoint: 'Error', 
        batteryPercentage: 'Error'
      }));
    }
  };

  const fetchReportData = async () => {
    try {
      const now = Date.now();
      const startTime = now - 24 * 60 * 60 * 1000; // Últimas 24 horas
      let lastRowKey = '';
      let allLogs = [];

      while (true) {
        const url = new URL('/api/tuya/report', window.location.origin);
        url.searchParams.append('codes', 'va_temperature,va_humidity,va_vpd,va_dew_point');
        url.searchParams.append('start_time', startTime.toString());
        url.searchParams.append('end_time', now.toString());
        url.searchParams.append('last_row_key', lastRowKey);
        url.searchParams.append('size', '100');

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          console.error('Error en la API:', data.error);
          break;
        } else {
          allLogs = [...allLogs, ...data.data.logs];
          lastRowKey = data.data.last_row_key;
          if (!data.data.has_more) break;
        }
      }

      // Filtrar los registros de temperatura, humedad, VPD y punto de rocío
      const temperatureLogs = allLogs.filter(item => item.code === 'va_temperature').map(item => parseInt(item.value) / 10);
      const humidityLogs = allLogs.filter(item => item.code === 'va_humidity').map(item => parseInt(item.value));

      // Calcular máximos y mínimos para cada parámetro
      const maxTemperature = Math.max(...temperatureLogs).toFixed(1);
      const minTemperature = Math.min(...temperatureLogs).toFixed(1);
      const maxHumidity = Math.max(...humidityLogs).toFixed(1);
      const minHumidity = Math.min(...humidityLogs).toFixed(1);

      setStatus(prevStatus => ({
        ...prevStatus,
        maxTemperature, minTemperature, 
        maxHumidity, minHumidity, 

      }));
    } catch (error) {
      console.error('Error al obtener los registros de la API:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchReportData();
  }, []);

  return (
    <div className="p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-4xl font-bold text-gray-900">
            {status.deviceName}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xl">🔋</span>
          <p className="text-sm font-semibold text-gray-700">{status.batteryPercentage}%</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-2 gap-6">
        <StatusCard title="Temperatura" value={status.temperature} unit="°C" emoji="🌡️" max={status.maxTemperature} min={status.minTemperature} />
        <StatusCard title="Humedad" value={status.humidity} unit="%" emoji="💧" max={status.maxHumidity} min={status.minHumidity} />
        <div className="rounded-lg shadow-md p-6 flex flex-col items-center justify-center transform hover:scale-105 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-2">
            <span className="text-4xl">❄️</span>
            <p className="text-xl font-semibold text-gray-700">Punto de Rocío</p>
          </div>
          <p className="mt-4 text-4xl font-bold text-gray-900">
          {status.dewPoint}<span className="text-2xl text-gray-500">°C</span>
          </p>
        </div>

        <div className="rounded-lg shadow-md p-6 flex flex-col items-center justify-center transform hover:scale-105 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-2">
            <span className="text-4xl">🌫️</span>
            <p className="text-xl font-semibold text-gray-700">VPD</p>
          </div>
          <p className="mt-4 text-4xl font-bold text-gray-900">
          {status.vpd}<span className="text-2xl text-gray-500">kPa</span>
          </p>
        </div>

      </div>
    </div>
  );
}

function StatusCard({ title, value, unit, emoji, max, min }) {
  const difference = max !== 'N/A' && min !== 'N/A' ? (max - min).toFixed(1) : 'N/A';
  const differenceEmoji = difference > 0 ? '📈' : '📉';
  const formattedDifference = difference !== 'N/A' ? `${difference > 0 ? '+' : ''}${difference}${unit}` : 'N/A';

  return (
    <div className="rounded-lg shadow-md p-6 flex flex-col items-center justify-center transform hover:scale-105 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-2">
        <span className="text-4xl">{emoji}</span>
        <p className="text-xl font-semibold text-gray-700">{title}</p>
      </div>
      <p className="mt-4 text-4xl font-bold text-gray-900">
        {value}<span className="text-2xl text-gray-500">{unit}</span>
      </p>

      <div className="mt-4 text-sm text-gray-700 space-y-1">
        <p><strong>Máx:</strong> {max}{unit} | <strong>Mín:</strong> {min}{unit}</p>
        <p><strong>Diferencia:</strong> {differenceEmoji} {formattedDifference}</p>
      </div>
    </div>
  );
}
