import { useEffect, useState } from 'react';

export default function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📡 Función para obtener mensajes desde la API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat');
      const data = await response.json();

      if (response.ok) {
        setMessages(data);
      } else {
        setError(data.error || 'Error al obtener los mensajes');
      }
    } catch (error) {
      setError('Error al obtener los mensajes');
    } finally {
      setLoading(false);
    }
  };

  // 📤 Función para enviar mensajes a la API
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      const formData = new FormData();
      formData.append('message', message.trim());

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(''); // Limpia la entrada de mensaje
        fetchMessages(); // Refresca la lista de mensajes
      } else {
        setError(data.error || 'Error al enviar el mensaje');
      }
    } catch (error) {
      setError('Error al enviar el mensaje');
    }
  };

  // 🚀 useEffect para cargar los mensajes al montar el componente
  useEffect(() => {
    fetchMessages();

    // Opcional: Actualizar los mensajes automáticamente cada 5 segundos
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 p-4 text-white text-center font-bold text-xl">
        🗨️ Chat en Tiempo Real
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-center text-gray-500">Cargando mensajes...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.userId === 'currentUserId' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg shadow-md ${msg.userId === 'currentUserId' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
                <p className="text-sm font-semibold">{msg.username || 'Usuario Anónimo'}</p>
                <p className="text-sm mt-1">{msg.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={sendMessage} className="bg-white p-4 flex space-x-2">
        <input 
          type="text" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Escribe un mensaje..." 
          className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <button 
          type="submit" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
          Enviar
        </button>
      </form>
    </div>
  );
}
