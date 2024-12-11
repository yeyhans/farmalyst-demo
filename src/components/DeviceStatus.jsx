import { useState, useEffect } from 'react';

export default function DeviceStatus() {
  const [status, setStatus] = useState({ temperature: 'Cargando...', humidity: 'Cargando...', vpd: 'Cargando...', dewPoint: 'Cargando...' });

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/tuya/status');
        const data = await response.json();
        
        if (data.error) {
          setStatus({ temperature: 'Error', humidity: 'Error', vpd: 'Error', dewPoint: 'Error' });
        } else {
          setStatus({ 
            temperature: data.temperature, 
            humidity: data.humidity, 
            vpd: data.vpd, 
            dewPoint: data.dewPoint 
          });
        }
      } catch (error) {
        setStatus({ temperature: 'Error', humidity: 'Error', vpd: 'Error', dewPoint: 'Error' });
      }
    }

    fetchStatus();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 p-6 bg-gray-100">
      
      {/* 🔥 Tarjeta de Temperatura */}
      <StatusCard title="Temperatura" value={status.temperature} unit="°C" emoji="🌡️" />
      
      {/* 🔥 Tarjeta de Humedad */}
      <StatusCard title="Humedad" value={status.humidity} unit="%" emoji="💧" />
      
      {/* 🔥 Tarjeta de VPD */}
      <StatusCard title="VPD" value={status.vpd} unit="kPa" emoji="🌫️" />
      
      {/* 🔥 Tarjeta de Punto de Rocío */}
      <StatusCard title="Punto de Rocío" value={status.dewPoint} unit="°C" emoji="❄️" />
      
    </div>
  );
}

function StatusCard({ title, value, unit, emoji }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center transform hover:scale-105 hover:shadow-xl transition-all duration-300">
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
