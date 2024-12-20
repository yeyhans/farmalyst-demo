import { useState, useEffect } from 'react';

// 🧮 Función para calcular VPD (kPa)
const calculateVPD = (temperature, humidity) => {
  const saturationVaporPressure = calculateSaturationVaporPressure(temperature);
  const actualVaporPressure = (humidity / 100) * saturationVaporPressure;
  const vpd = saturationVaporPressure - actualVaporPressure;
  return parseFloat(vpd.toFixed(2)); // Devolver con 2 decimales
};

// 🧮 Función para calcular la presión de vapor de saturación
const calculateSaturationVaporPressure = (temperature) => {
  return 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
};

// 🧮 Función para calcular el punto de rocío (dew point) en °C
const calculateDewPoint = (temperature, humidity) => {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return parseFloat(dewPoint.toFixed(2)); // Devolver con 2 decimales
};

export default function UserInputStatus() {
  const [temperature, setTemperature] = useState(''); // Estado para la temperatura
  const [humidity, setHumidity] = useState(''); // Estado para la humedad
  const [vpd, setVPD] = useState('N/A'); // Estado para el VPD
  const [dewPoint, setDewPoint] = useState('N/A'); // Estado para el punto de rocío

  // Efecto que actualiza VPD y Dew Point cada vez que cambia la temperatura o la humedad
  useEffect(() => {
    if (!isNaN(temperature) && !isNaN(humidity) && temperature !== '' && humidity !== '') {
      const temp = parseFloat(temperature);
      const hum = parseFloat(humidity);
      setVPD(calculateVPD(temp, hum));
      setDewPoint(calculateDewPoint(temp, hum));
    } else {
      setVPD('N/A');
      setDewPoint('N/A');
    }
  }, [temperature, humidity]);

  return (
    <div className="p-6 bg-gray-100">
      <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">Ingresar Parámetros</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-2 gap-6">
        <StatusCard 
          title="Temperatura" 
          value={temperature} 
          unit="°C" 
          emoji="🌡️" 
          isInput={true} 
          onChange={(e) => setTemperature(e.target.value)} 
        />
        <StatusCard 
          title="Humedad" 
          value={humidity} 
          unit="%" 
          emoji="💧" 
          isInput={true} 
          onChange={(e) => setHumidity(e.target.value)} 
        />
        <StaticCard 
          title="Punto de Rocío" 
          value={dewPoint} 
          unit="°C" 
          emoji="❄️" 
        />
        <StaticCard 
          title="VPD" 
          value={vpd} 
          unit="kPa" 
          emoji="🌫️" 
        />
      </div>
    </div>
  );
}

function StatusCard({ title, value, unit, emoji, isInput = false, onChange }) {
  return (
    <div className="rounded-lg shadow-md p-6 flex flex-col items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-2">
        <span className="text-4xl">{emoji}</span>
        <p className="text-xl font-semibold text-gray-700">{title}</p>
      </div>

      <p className="mt-4 text-4xl font-bold text-gray-900 flex items-center justify-center space-x-1">
        {isInput ? (
          <div className="flex items-center">
            <input 
              type="number" 
              value={value} 
              onChange={onChange} 
              className="w-20 text-center p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              placeholder="" 
            />
            <span className="text-2xl text-gray-500 ml-1">{unit}</span>
          </div>
        ) : (
          <>
            <span>{value}</span> 
            <span className="text-2xl text-gray-500">{unit}</span>
          </>
        )}
      </p>
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
        {value !== '' ? value : 'N/A'}<span className="text-2xl text-gray-500">{unit}</span>
      </p>
    </div>
  );
}
