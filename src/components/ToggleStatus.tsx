import React, { useState } from 'react';
import DeviceStatus from './device/Status';
import DeviceStatusNo from './calculator/Status';

const ToggleDeviceStatus: React.FC = () => {
  // Estado para controlar cuál componente se muestra
  const [showFirstComponent, setShowFirstComponent] = useState(true);

  // Función para alternar entre los componentes
  const toggleComponent = () => {
    setShowFirstComponent((prevState) => !prevState);
  };

  return (
    <div>
      <button 
        onClick={toggleComponent} 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Cambiar Componente
      </button>

      {/* Renderizar solo uno de los dos componentes */}
      {showFirstComponent ? <DeviceStatus /> : <DeviceStatusNo />}

      {/* Botón para alternar el componente visible */}

    </div>
  );
};

export default ToggleDeviceStatus;
