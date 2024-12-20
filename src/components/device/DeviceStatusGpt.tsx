import { useState, useEffect } from 'react';

export default function DeviceStatusGpt() {
  const [status, setStatus] = useState({ /*... status inicial */ });
  const [recommendation, setRecommendation] = useState('Cargando recomendación...');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [userPrompt, setUserPrompt] = useState(''); // 🟢 Nuevo estado para el userPrompt

  const fetchLastRecommendation = async () => {
    try {
      const response = await fetch('/api/growmonitor/last-recommendation');
      const data = await response.json();

      if (data.recommendation) {
        setRecommendation(data.recommendation);
      } else {
        setRecommendation('Aún no hay recomendaciones previas.');
      }
    } catch (error) {
      console.error('Error al obtener la última recomendación:', error);
      setRecommendation('Error al obtener la última recomendación.');
    }
  };

  const fetchLastRecommendationTime = async () => {
    try {
      const response = await fetch('/api/growmonitor/last-recommendation');
      const data = await response.json();

      if (data.timestamp) {
        const lastRecommendationTime = new Date(data.timestamp).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = 24 * 60 * 60 * 1000 - (currentTime - lastRecommendationTime);

        if (timeDiff > 0) {
          setIsButtonDisabled(true);
          setTimeRemaining(formatTimeRemaining(timeDiff));

          const interval = setInterval(() => {
            const newTimeDiff = timeDiff - 1000;
            setTimeRemaining(formatTimeRemaining(newTimeDiff));

            if (newTimeDiff <= 0) {
              setIsButtonDisabled(false);
              clearInterval(interval);
            }
          }, 1000);
        } else {
          setIsButtonDisabled(false);
        }
      } else {
        setIsButtonDisabled(false);
      }
    } catch (error) {
      console.error('Error al obtener la hora de la última recomendación:', error);
    }
  };

  const formatTimeRemaining = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const sendDataForRecommendation = async () => {
    if (isButtonDisabled) return;

    try {
      const response = await fetch('/api/growmonitor', {
        method: 'POST',
        body: new URLSearchParams({
          temperature: status.temperature.toString(),
          humidity: status.humidity.toString(),
          vpd: status.vpd.toString(),
          dewPoint: status.dewPoint.toString(),
          maxTemperature: status.maxTemperature.toString(),
          minTemperature: status.minTemperature.toString(),
          maxHumidity: status.maxHumidity.toString(),
          minHumidity: status.minHumidity.toString(),
          userPrompt: userPrompt // 🟢 Incluir el userPrompt en la petición
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRecommendation(result.assistantMessage); // 🟢 Mostrar la nueva recomendación
      }
    } catch (error) {
      console.error('Error al enviar los datos:', error);
    }
  };

  useEffect(() => {
    fetchLastRecommendation(); // 🟢 Obtener la última recomendación
    fetchLastRecommendationTime(); // 🟢 Obtener la hora de la última recomendación
  }, []);

  return (
    <div className="p-6 bg-gray-100">
      <div className="flex justify-between items-center mt-6">
        <h2 className="text-2xl font-bold">Recomendación de la IA 🌱</h2>

        <button 
          onClick={sendDataForRecommendation} 
          disabled={isButtonDisabled} 
          className={`px-4 py-2 font-bold text-white ${isButtonDisabled ? 'bg-gray-400' : 'bg-green-500'} rounded`}
        >
          {isButtonDisabled ? `Espera ${timeRemaining}` : 'Generar Recomendación'}
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="userPrompt" className="block text-lg font-semibold text-gray-700">
          Ingrese su consulta personalizada:
        </label>
        <input 
          type="text" 
          id="userPrompt" 
          value={userPrompt} 
          onChange={(e) => setUserPrompt(e.target.value)} 
          placeholder="Ejemplo: ¿Cómo mejorar la humedad en la noche?" 
          className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <p className="mt-4 text-lg text-gray-700">{recommendation}</p> {/* Mostrar la recomendación */}
    </div>
  );
}
