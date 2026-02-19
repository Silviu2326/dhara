import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { ClientsFilter } from "./components/ClientsFilter";
import { ClientsTable } from "./components/ClientsTable";
import { ClientDrawer } from "./components/ClientDrawer";
import { NewBookingModal } from "./components/NewBookingModal";
import { UploadDocModal } from "./components/UploadDocModal";
import { DeleteClientDialog } from "./components/DeleteClientDialog";
import { BulkActionsModal } from "./components/BulkActionsModal";
import { CreateClientModal } from "./components/CreateClientModal";
import {
  downloadClientsCSV,
  downloadClientStatsCSV,
  EXPORT_PRESETS,
} from "./utils/exportUtils";
import { clientService } from "../../services/api/clientService";

// Mock data para demostración
const mockClients = [
  {
    id: "CL001",
    name: "Ana García López",
    email: "ana.garcia@email.com",
    phone: "+34 666 123 456",
    avatar: null,
    status: "active",
    lastSession: "2024-01-15T10:00:00Z",
    sessionsCount: 12,
    rating: 4.8,
    tags: ["Ansiedad", "Terapia Individual"],
    createdAt: "2023-06-15T09:00:00Z",
    age: 32,
    address: "Calle Mayor 123, Madrid",
    emergencyContact: {
      name: "Carlos García",
      phone: "+34 666 789 012",
      relationship: "Esposo",
    },
    notes:
      "Cliente muy colaborativa, progreso excelente en manejo de ansiedad.",
    paymentsCount: 12,
    documentsCount: 5,
    messagesCount: 28,
  },
  {
    id: "CL002",
    name: "Miguel Rodríguez",
    email: "miguel.rodriguez@email.com",
    phone: "+34 677 234 567",
    avatar: null,
    status: "active",
    lastSession: "2024-01-12T16:30:00Z",
    sessionsCount: 8,
    rating: 4.5,
    tags: ["Depresión", "Terapia Individual"],
    createdAt: "2023-09-20T14:00:00Z",
    age: 28,
    address: "Avenida de la Paz 45, Barcelona",
    emergencyContact: {
      name: "María Rodríguez",
      phone: "+34 677 345 678",
      relationship: "Madre",
    },
    notes:
      "Paciente con episodios depresivos recurrentes. Responde bien a TCC.",
    paymentsCount: 8,
    documentsCount: 3,
    messagesCount: 15,
  },
  {
    id: "CL003",
    name: "Laura y David Martín",
    email: "laura.martin@email.com",
    phone: "+34 688 345 678",
    avatar: null,
    status: "active",
    lastSession: "2024-01-10T18:00:00Z",
    sessionsCount: 6,
    rating: 4.9,
    tags: ["Terapia de Pareja", "Comunicación"],
    createdAt: "2023-11-05T11:00:00Z",
    age: 35,
    address: "Plaza del Sol 8, Valencia",
    emergencyContact: {
      name: "Carmen Martín",
      phone: "+34 688 456 789",
      relationship: "Hermana",
    },
    notes: "Pareja trabajando en mejorar comunicación. Muy comprometidos.",
    paymentsCount: 6,
    documentsCount: 2,
    messagesCount: 22,
  },
  {
    id: "CL004",
    name: "Carmen Jiménez",
    email: "carmen.jimenez@email.com",
    phone: "+34 699 456 789",
    avatar: null,
    status: "inactive",
    lastSession: "2023-12-20T12:00:00Z",
    sessionsCount: 15,
    rating: 4.7,
    tags: ["Trauma", "EMDR"],
    createdAt: "2023-03-10T10:00:00Z",
    age: 41,
    address: "Calle de la Luna 67, Sevilla",
    emergencyContact: {
      name: "José Jiménez",
      phone: "+34 699 567 890",
      relationship: "Hermano",
    },
    notes: "Completó tratamiento para trauma. Alta terapéutica exitosa.",
    paymentsCount: 15,
    documentsCount: 8,
    messagesCount: 45,
  },
  {
    id: "CL005",
    name: "Roberto Silva",
    email: "roberto.silva@email.com",
    phone: "+34 610 567 890",
    avatar: null,
    status: "demo",
    lastSession: null,
    sessionsCount: 0,
    rating: null,
    tags: ["Consulta Inicial"],
    createdAt: "2024-01-08T15:30:00Z",
    age: 26,
    address: "Paseo de Gracia 123, Barcelona",
    emergencyContact: {
      name: "Ana Silva",
      phone: "+34 610 678 901",
      relationship: "Madre",
    },
    notes: "Cliente potencial. Pendiente de primera sesión.",
    paymentsCount: 0,
    documentsCount: 1,
    messagesCount: 3,
  },
];

export const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);

  // Debug: Log when clients state changes
  useEffect(() => {
    console.log("🔍 Clients.page.jsx - Clients state updated:", clients);
    console.log("🔍 Clients.page.jsx - Current clients count:", clients.length);
  }, [clients]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    tags: [],
    status: "all",
    sort: "name-asc",
    therapyType: "all",
    satisfaction: "all",
    frequency: "all",
  });

  // Initialize client service and load clients
  useEffect(() => {
    const initializeAndLoadClients = async () => {
      try {
        setIsLoading(true);

        // Initialize client service
        await clientService.initialize();

        // Load clients
        const response = await clientService.getClients(
          {},
          {
            decryptSensitiveData: true,
            includeStatistics: true,
          },
        );

        console.log(
          "🔍 Clients.page.jsx - Raw response from clientService:",
          response,
        );
        console.log(
          "🔍 Clients.page.jsx - Response.clients:",
          response.clients,
        );
        console.log(
          "🔍 Clients.page.jsx - Clients count:",
          response.clients?.length,
        );
        console.log(
          "🔍 Clients.page.jsx - First client sample:",
          response.clients?.[0],
        );

        // Transform the response to match the component's expected format
        const transformedClients = response.clients.map((client) => ({
          id: client.id,
          name: client.name || "Cliente",
          email: client.email || "",
          phone: client.phone || "",
          avatar: client.avatar || null,
          status: client.status || "active",
          lastSession: client.lastSession || null,
          sessionsCount: client.sessionsCount || 0,
          rating: client.rating || null,
          tags: client.tags || [],
          createdAt: client.createdAt || new Date().toISOString(),
          age: client.age || null,
          address: client.address || "",
          emergencyContact: client.emergencyContact || null,
          notes: client.notes || "",
          paymentsCount: client.paymentsCount || 0,
          documentsCount: client.documentsCount || 0,
          messagesCount: client.messagesCount || 0,
        }));

        console.log(
          "🔍 Clients.page.jsx - Transformed clients:",
          transformedClients,
        );
        console.log(
          "🔍 Clients.page.jsx - Transformed clients count:",
          transformedClients.length,
        );
        console.log(
          "🔍 Clients.page.jsx - First transformed client:",
          transformedClients[0],
        );

        setClients(transformedClients);
      } catch (error) {
        console.error("🔍 Clients.page.jsx - Error loading clients:", error);
        console.log("🔍 Clients.page.jsx - Falling back to mock data");
        console.log(
          "🔍 Clients.page.jsx - Mock clients count:",
          mockClients.length,
        );
        // Fallback to mock data if API fails
        setClients(mockClients);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadClients();
  }, []);

  // Function to refresh clients from API
  const refreshClients = async (searchTerm = "", additionalFilters = {}) => {
    try {
      setIsLoading(true);

      let response;
      if (searchTerm) {
        // Use search API for text search
        const searchResults = await clientService.searchClients(searchTerm, {
          searchFields: ["name", "email", "phone", "notes"],
          limit: 50,
          exactMatch: false,
          includeInactive: true,
        });
        response = { clients: searchResults };
      } else {
        // Use regular getClients for filtered results
        response = await clientService.getClients(additionalFilters, {
          decryptSensitiveData: true,
          includeStatistics: true,
        });
      }

      // Transform the response to match the component's expected format
      const transformedClients = response.clients.map((client) => ({
        id: client.id,
        name: client.name || "Cliente",
        email: client.email || "",
        phone: client.phone || "",
        avatar: client.avatar || null,
        status: client.status || "active",
        lastSession: client.lastSession || null,
        sessionsCount: client.sessionsCount || 0,
        rating: client.rating || null,
        tags: client.tags || [],
        createdAt: client.createdAt || new Date().toISOString(),
        age: client.age || null,
        address: client.address || "",
        emergencyContact: client.emergencyContact || null,
        notes: client.notes || "",
        paymentsCount: client.paymentsCount || 0,
        documentsCount: client.documentsCount || 0,
        messagesCount: client.messagesCount || 0,
      }));

      setClients(transformedClients);
    } catch (error) {
      console.error("Error refreshing clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...clients];

    // Search filter - now handled by API search above
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.id.toLowerCase().includes(searchLower),
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((client) =>
        filters.tags.some((tag) => client.tags.includes(tag)),
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((client) => client.status === filters.status);
    }

    // Therapy type filter
    if (filters.therapyType !== "all") {
      const therapyTypeMap = {
        individual: ["Terapia Individual", "Ansiedad", "Depresión"],
        couple: ["Terapia de Pareja", "Comunicación"],
        family: ["Terapia Familiar"],
        group: ["Terapia Grupal"],
        emdr: ["EMDR", "Trauma"],
        cbt: ["TCC", "Cognitivo-Conductual"],
      };

      const relevantTags = therapyTypeMap[filters.therapyType] || [];
      filtered = filtered.filter(
        (client) =>
          client.tags &&
          client.tags.some((tag) =>
            relevantTags.some((relevantTag) =>
              tag.toLowerCase().includes(relevantTag.toLowerCase()),
            ),
          ),
      );
    }

    // Satisfaction filter
    if (filters.satisfaction !== "all") {
      const satisfactionRanges = {
        excellent: { min: 4.5, max: 5.0 },
        good: { min: 3.5, max: 4.4 },
        average: { min: 2.5, max: 3.4 },
        poor: { min: 1.0, max: 2.4 },
        no_rating: { min: null, max: null },
      };

      const range = satisfactionRanges[filters.satisfaction];
      if (range.min === null) {
        filtered = filtered.filter(
          (client) => !client.rating || client.rating === 0,
        );
      } else {
        filtered = filtered.filter(
          (client) =>
            client.rating &&
            client.rating >= range.min &&
            client.rating <= range.max,
        );
      }
    }

    // Frequency filter
    if (filters.frequency !== "all") {
      const frequencyRanges = {
        high: { min: 16 },
        medium: { min: 6, max: 15 },
        low: { min: 1, max: 5 },
        none: { min: 0, max: 0 },
      };

      const range = frequencyRanges[filters.frequency];
      filtered = filtered.filter((client) => {
        const sessions = client.sessionsCount || 0;
        if (range.max !== undefined) {
          return sessions >= range.min && sessions <= range.max;
        } else {
          return sessions >= range.min;
        }
      });
    }

    // Sorting
    const [sortKey, sortDirection] = filters.sort.split("-");
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortKey) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "lastSession":
          aValue = a.lastSession ? new Date(a.lastSession) : new Date(0);
          bValue = b.lastSession ? new Date(b.lastSession) : new Date(0);
          break;
        case "sessions":
          aValue = a.sessionsCount;
          bValue = b.sessionsCount;
          break;
        case "created":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortKey];
          bValue = b[sortKey];
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredClients(filtered);
  }, [clients, filters]);

  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));

    // If search filter changed, trigger API search
    if (newFilters.search !== undefined) {
      if (newFilters.search.length >= 3) {
        // Debounce search
        setTimeout(() => refreshClients(newFilters.search), 300);
      } else if (newFilters.search === "") {
        // Reset to all clients
        refreshClients();
      }
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      tags: [],
      status: "all",
      sort: "name-asc",
      therapyType: "all",
      satisfaction: "all",
      frequency: "all",
    });
    setSelectedClients([]);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  };

  const handleSelectAllClients = () => {
    setSelectedClients(
      selectedClients.length === filteredClients.length
        ? []
        : filteredClients.map((client) => client.id),
    );
  };

  const handleViewClient = (client) => {
    // Navegar a la página de detalle del cliente
    navigate(`/clients/${client.id}`);
  };

  const handleViewClientDrawer = (client) => {
    setSelectedClient(client);
    setIsClientDrawerOpen(true);
  };

  const handleNewBooking = (client) => {
    setSelectedClient(client);
    setIsNewBookingModalOpen(true);
  };

  const handleUploadDoc = (client) => {
    setSelectedClient(client);
    setIsUploadDocModalOpen(true);
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleChatClient = (client) => {
    // Navegar al chat con el cliente
    navigate(`/chat?clientId=${client.id}`);
  };

  const handleCreateBooking = async (bookingData) => {
    console.log("Creating booking:", bookingData);
    // Aquí se implementaría la lógica para crear la cita
    // Por ahora solo simulamos el éxito
    alert("Cita creada exitosamente");
  };

  const handleUploadDocuments = async (uploadData) => {
    try {
      setIsLoading(true);
      console.log("Uploading documents:", uploadData);

      // Note: The clientService doesn't have a specific document upload method
      // You might need to integrate with a separate document service
      // For now, we'll simulate the upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Documentos subidos exitosamente");
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert("Error al subir los documentos. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create new client function
  const handleCreateClient = async (clientData) => {
    try {
      setIsLoading(true);

      // Create client using client service (without encryption for now)
      const newClient = await clientService.createClient(clientData, {
        encryptSensitiveData: false,
        generateConsentToken: false,
        consentPurposes: ["therapy", "data_processing"],
        validatePrivacy: false,
      });

      // Transform response to component format
      const transformedClient = {
        id: newClient.id,
        name: newClient.name || "Cliente",
        email: newClient.email || "",
        phone: newClient.phone || "",
        avatar: newClient.avatar || null,
        status: newClient.status || "active",
        lastSession: null,
        sessionsCount: 0,
        rating: null,
        tags: newClient.tags || [],
        createdAt: newClient.createdAt || new Date().toISOString(),
        age: newClient.age || null,
        address: newClient.address || "",
        emergencyContact: newClient.emergencyContact || null,
        notes: newClient.notes || "",
        paymentsCount: 0,
        documentsCount: 0,
        messagesCount: 0,
      };

      // Add to local state
      setClients((prev) => [transformedClient, ...prev]);

      console.log("Cliente creado exitosamente:", newClient);
      return newClient;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update client function
  const handleUpdateClient = async (clientId, updates) => {
    try {
      setIsLoading(true);

      // Update client using client service
      const updatedClient = await clientService.updateClient(
        clientId,
        updates,
        {
          encryptSensitiveData: true,
          validatePrivacy: true,
          createAuditLog: true,
        },
      );

      // Update local state
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId
            ? { ...client, ...updates, ...updatedClient }
            : client,
        ),
      );

      console.log("Cliente actualizado exitosamente:", updatedClient);
      return updatedClient;
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update client tags function
  const handleUpdateClientTags = async (clientId, tags, action = "replace") => {
    try {
      setIsLoading(true);

      // Update client tags using client service
      const result = await clientService.updateClientTags(clientId, tags, {
        action,
      });

      // Update local state
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId
            ? { ...client, tags: result.tags || tags }
            : client,
        ),
      );

      console.log("Tags del cliente actualizadas exitosamente");
      return result;
    } catch (error) {
      console.error("Error updating client tags:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadClientData = async (clientId) => {
    try {
      setIsLoading(true);
      console.log("Downloading client data:", clientId);

      // Export client data using client service
      const exportData = await clientService.exportClientData(clientId, {
        format: "json",
        includeHistory: true,
        includeSessions: true,
        includeDocuments: true,
        encryptExport: false,
      });

      // Create and download the file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `cliente_${clientId}_datos.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log("Client data exported successfully");
    } catch (error) {
      console.error("Error downloading client data:", error);
      alert(
        "Error al descargar los datos del cliente. Por favor, inténtalo de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeleteClient = async (clientId) => {
    try {
      setIsLoading(true);
      console.log("Deleting client:", clientId);

      // Delete client using client service
      await clientService.deleteClient(clientId, {
        secureDelete: true,
        createAuditLog: true,
        reason: "user_request",
      });

      // Update local state
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      console.log("Cliente eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error al eliminar el cliente. Por favor, inténtalo de nuevo.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Nuevos handlers para filtros avanzados
  const handleTherapyTypeChange = (therapyType) => {
    setFilters((prev) => ({ ...prev, therapyType }));
  };

  const handleSatisfactionChange = (satisfaction) => {
    setFilters((prev) => ({ ...prev, satisfaction }));
  };

  const handleFrequencyChange = (frequency) => {
    setFilters((prev) => ({ ...prev, frequency }));
  };

  // Handler para exportar CSV
  const handleExportCSV = () => {
    try {
      downloadClientsCSV(
        filteredClients,
        "clientes_filtrados",
        EXPORT_PRESETS.complete,
      );
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error al exportar los datos. Por favor, inténtalo de nuevo.");
    }
  };

  // Handler para acciones masivas
  const handleBulkActions = () => {
    if (selectedClients.length === 0) {
      alert("Por favor, selecciona al menos un cliente.");
      return;
    }
    setIsBulkActionsModalOpen(true);
  };

  const handleExecuteBulkAction = async (actionData) => {
    console.log("Executing bulk action:", actionData);

    try {
      setIsLoading(true);

      // Use client service for bulk operations
      const response = await clientService.bulkOperations(
        actionData.action,
        actionData.clientIds,
        actionData.data || {},
        {
          validatePermissions: true,
          createAuditLog: true,
          batchSize: 50,
        },
      );

      const successCount = response.results.filter((r) => r.success).length;
      const totalCount = response.results.length;

      if (successCount === totalCount) {
        // All operations successful
        switch (actionData.action) {
          case "send_message":
            alert(`Mensaje enviado exitosamente a ${successCount} clientes`);
            break;
          case "send_email":
            alert(`Email enviado exitosamente a ${successCount} clientes`);
            break;
          case "assign_plan":
            alert(`Plan asignado exitosamente a ${successCount} clientes`);
            break;
          case "schedule_session":
            alert(
              `Sesiones programadas exitosamente para ${successCount} clientes`,
            );
            break;
          case "add_notes":
            alert(`Notas añadidas exitosamente a ${successCount} clientes`);
            break;
          case "update_tags":
            alert(
              `Etiquetas actualizadas exitosamente para ${successCount} clientes`,
            );
            break;
          case "update_status":
            alert(
              `Estado actualizado exitosamente para ${successCount} clientes`,
            );
            break;
          default:
            alert(
              `Acción ejecutada exitosamente para ${successCount} clientes`,
            );
        }
      } else {
        // Partial success
        alert(
          `Acción completada: ${successCount}/${totalCount} clientes procesados exitosamente`,
        );
      }

      // Refresh clients list to show updates
      refreshClients();

      // Clear selection after executing action
      setSelectedClients([]);
    } catch (error) {
      console.error("Error executing bulk action:", error);
      alert("Error al ejecutar la acción. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener objetos de clientes seleccionados para las acciones masivas
  const getSelectedClientObjects = () => {
    return filteredClients.filter((client) =>
      selectedClients.includes(client.id),
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona la información de tus clientes y su historial de sesiones.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateClientModalOpen(true)}
        >
          Crear cliente
        </Button>
      </div>

      {/* Filtros */}
      <ClientsFilter
        onSearchChange={(search) => handleFilterChange({ search })}
        onTagsChange={(tags) => handleFilterChange({ tags })}
        onStatusChange={(status) => handleFilterChange({ status })}
        onSortChange={(sort) => handleFilterChange({ sort })}
        onTherapyTypeChange={handleTherapyTypeChange}
        onSatisfactionChange={handleSatisfactionChange}
        onFrequencyChange={handleFrequencyChange}
        onExportCSV={handleExportCSV}
        onClearFilters={handleClearFilters}
        searchValue={filters.search}
        selectedTags={filters.tags}
        selectedStatus={filters.status}
        selectedSort={filters.sort}
        selectedTherapyType={filters.therapyType}
        selectedSatisfaction={filters.satisfaction}
        selectedFrequency={filters.frequency}
      />

      {/* Acciones masivas */}
      {selectedClients.length > 0 && (
        <Card>
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedClients.length} cliente
                  {selectedClients.length !== 1 ? "s" : ""} seleccionado
                  {selectedClients.length !== 1 ? "s" : ""}
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBulkActions}
                    className="flex-1 sm:flex-none justify-center"
                  >
                    Acciones masivas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClients([])}
                    className="flex-1 sm:flex-none justify-center"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla de clientes */}
      <Card>
        <ClientsTable
          clients={filteredClients}
          selectedClients={selectedClients}
          sortConfig={sortConfig}
          isLoading={isLoading}
          onSort={handleSort}
          onSelectClient={handleSelectClient}
          onSelectAll={handleSelectAllClients}
          onClientClick={handleViewClient}
          onViewClientDrawer={handleViewClientDrawer}
          onChatClick={handleChatClient}
          onNewBookingClick={handleNewBooking}
          onUploadDocClick={handleUploadDoc}
          onDeleteClick={handleDeleteClient}
        />
      </Card>

      {/* Client Drawer */}
      <ClientDrawer
        isOpen={isClientDrawerOpen}
        onClose={() => {
          setIsClientDrawerOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => {
          setIsNewBookingModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onCreateBooking={handleCreateBooking}
      />

      {/* Upload Document Modal */}
      <UploadDocModal
        isOpen={isUploadDocModalOpen}
        onClose={() => {
          setIsUploadDocModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onUpload={handleUploadDocuments}
      />

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setClientToDelete(null);
        }}
        client={clientToDelete}
        onDelete={handleConfirmDeleteClient}
        onDownloadData={handleDownloadClientData}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={isBulkActionsModalOpen}
        onClose={() => setIsBulkActionsModalOpen(false)}
        selectedClients={getSelectedClientObjects()}
        onExecuteAction={handleExecuteBulkAction}
      />

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
};
