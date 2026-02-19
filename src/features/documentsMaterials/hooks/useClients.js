import { useState, useEffect } from 'react';

// Mock data para desarrollo
const mockClients = [
  { id: '1', name: 'Ana García', email: 'ana@email.com', avatar: null },
  { id: '2', name: 'Carlos López', email: 'carlos@email.com', avatar: null },
  { id: '3', name: 'María Rodríguez', email: 'maria@email.com', avatar: null },
  { id: '4', name: 'Juan Pérez', email: 'juan@email.com', avatar: null },
  { id: '5', name: 'Laura Martínez', email: 'laura@email.com', avatar: null },
  { id: '6', name: 'Pedro Sánchez', email: 'pedro@email.com', avatar: null },
  { id: '7', name: 'Carmen Ruiz', email: 'carmen@email.com', avatar: null },
  { id: '8', name: 'Miguel Torres', email: 'miguel@email.com', avatar: null }
];

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simular carga de clientes
    const loadClients = async () => {
      try {
        setLoading(true);
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        setClients(mockClients);
      } catch (err) {
        setError('Error al cargar los clientes');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const searchClients = (searchTerm) => {
    if (!searchTerm) return clients;
    
    const term = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term)
    );
  };

  const getClientById = (id) => {
    return clients.find(client => client.id === id);
  };

  const addClient = (newClient) => {
    const client = {
      id: Date.now().toString(),
      ...newClient
    };
    setClients(prev => [client, ...prev]);
    return client;
  };

  const updateClient = (id, updates) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, ...updates } : client
      )
    );
  };

  const deleteClient = (id) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  return {
    clients,
    loading,
    error,
    searchClients,
    getClientById,
    addClient,
    updateClient,
    deleteClient
  };
};

export default useClients;