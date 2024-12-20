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

      const temperatureLogs = allLogs.filter(item => item.code === 'va_temperature').map(item => parseInt(item.value) / 10);
      const humidityLogs = allLogs.filter(item => item.code === 'va_humidity').map(item => parseInt(item.value));

      const maxTemperature = Math.max(...temperatureLogs).toFixed(1);
      const minTemperature = Math.min(...temperatureLogs).toFixed(1);
      const maxHumidity = Math.max(...humidityLogs).toFixed(1);
      const minHumidity = Math.min(...humidityLogs).toFixed(1);

      setStatus(prevStatus => ({
        ...prevStatus,
        maxTemperature, 
        minTemperature, 
        maxHumidity, 
        minHumidity
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
      <h3 className="text-xl font-bold mb-4">Estado del Dispositivo</h3>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900">{status.deviceName}</h1>
        <p className="text-sm font-semibold text-gray-700">🔋 {status.batteryPercentage}%</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-2 gap-6">
        <StatusCard 
          title="Temperatura" 
          value={status.temperature} 
          unit="°C" 
          emoji="🌡️" 
          max={status.maxTemperature} 
          min={status.minTemperature} 
        />
        <StatusCard 
          title="Humedad" 
          value={status.humidity} 
          unit="%" 
          emoji="💧" 
          max={status.maxHumidity} 
          min={status.minHumidity} 
        />
        <StaticCard title="Punto de Rocío" value={status.dewPoint} unit="°C" emoji="❄️" />
        <StaticCard title="VPD" value={status.vpd} unit="kPa" emoji="🌫️" />
      </div>
    </div>
  );
}

function StatusCard({ title, value, unit, emoji, max, min }) {
  const atd = max !== 'Cargando...' && min !== 'Cargando...' ? (max - min).toFixed(1) : 'N/A';
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="rounded-lg shadow-md p-6 flex flex-col items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-2">
        <span className="text-4xl">{emoji}</span>
        <p className="text-xl font-semibold text-gray-700">{title}</p>
      </div>

      <p className="mt-4 text-4xl font-bold text-gray-900">
        {value}<span className="text-2xl text-gray-500">{unit}</span>
      </p>

      <div className="mt-4 text-sm text-gray-700 space-y-1">
        <div className="flex items-center">
          <strong>ATD:</strong> {atd} 
          <button 
            onClick={() => setIsDialogOpen(true)} 
            className="ml-2 text-blue-500 hover:text-blue-700">
            🛈
          </button>
        </div>
      </div>

      {isDialogOpen && (
        <InfoDialog 
          title={`Amplitud de ${title} Diaria`}
          description="Una amplitud térmica demasiado alta puede afectar el metabolismo de la planta."
          max={max} 
          min={min} 
          onClose={() => setIsDialogOpen(false)} 
          unit={unit}
        />
      )}
    </div>
  );
}

function StaticCard({ title, value, unit, emoji }) {
  return (
    <div className="rounded-lg shadow-md p-6 flex flex-col items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-2">
        <span className="text-4xl">{emoji}</span>
        <p className="text-xl font-semibold text-gray-700">{title}</p>
      </div>
      <p className="mt-4 text-4xl font-bold text-gray-900">
        {value}<span className="text-2xl text-gray-500">{unit}</span>
      </p>
    </div>
  );
}

function InfoDialog({ title, description, max, min, onClose, unit }) {
  if (!title) return null; // No mostrar el componente hasta que sea necesario

  return (
    <div className="absolute items-center justify-center bg-black bg-opacity-50">
      <div 
        className="bg-white w-80 h-auto p-6 rounded-lg shadow-lg" 
        style={{ width: '300px', minHeight: '200px' }} // Ancho fijo y altura mínima fija
      >
        <h2 className="text-center text-xl font-bold mb-2">{title}</h2>
        <p className="mb-4">{description}</p>
        <p>
          <strong>Máxima:</strong> {max} {unit} | <strong>Mínima:</strong> {min} {unit}
        </p>
        <button 
          onClick={onClose} 
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
