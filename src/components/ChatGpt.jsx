import { useState, useEffect, useRef } from 'react';

const MasterGrowerChat = () => {
  const [messages, setMessages] = useState([]); // Lista de mensajes
  const [message, setMessage] = useState(''); // Mensaje actual del usuario
  const [loading, setLoading] = useState(false); // Estado de carga (enviando mensaje)
  const messageContainerRef = useRef(null); // Referencia al contenedor de mensajes

  // 🔥 Obtener los mensajes al cargar el componente
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/mastergrower', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        // 🔥 Invertir los mensajes para mostrar los últimos primeros
        setMessages(data.reverse());
      } catch (error) {
        console.error('Error al cargar los mensajes:', error);
      }
    };

    fetchMessages();
  }, []);

  // 🔥 Enviar mensaje a la API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return; // Evitar mensajes vacíos

    const newMessage = { 
      role: 'user', 
      message: message.trim(), 
      timestamp: new Date().toISOString() 
    };

    // Agregar el mensaje a la conversación de inmediato
    setMessages((prevMessages) => [newMessage, ...prevMessages]); // 🔥 Insertar el mensaje al inicio
    setMessage('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', newMessage.message);

      const response = await fetch('/api/mastergrower', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setMessages((prevMessages) => [
          { 
            role: 'assistant', 
            message: result.assistantMessage.message, 
            timestamp: new Date().toISOString() 
          },
          ...prevMessages
        ]); // 🔥 Insertar la respuesta de la IA al inicio
      }
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Mantener el scroll siempre al final de la conversación
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Encabezado del chat */}
      <header className="bg-green-600 text-white text-center p-4">
        <h1 className="text-xl font-bold">MasterGrower Chat</h1>
        <p>Pregúntale a la IA sobre el cultivo y obtén respuestas personalizadas</p>
      </header>

      {/* Contenedor de los mensajes */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        ref={messageContainerRef}
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`${
                msg.role === 'user' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-900'
              } p-3 rounded-lg max-w-xs`}
            >
              <p>{msg.message}</p>
              <small className="block text-xs mt-2 text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 p-3 rounded-lg max-w-xs">
              <p>Escribiendo...</p>
            </div>
          </div>
        )}
      </div>

      {/* Formulario de entrada */}
      <form 
        onSubmit={handleSubmit} 
        className="flex items-center bg-white p-4 border-t border-gray-300"
      >
        <input 
          type="text" 
          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
          placeholder="Escribe tu pregunta de cultivo..." 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
        />
        <button 
          type="submit" 
          disabled={loading} 
          className={`ml-3 p-3 bg-green-600 text-white rounded-md ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

export default MasterGrowerChat;
