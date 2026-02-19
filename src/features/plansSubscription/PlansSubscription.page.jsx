import React, { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Target,
  BookOpen,
  TrendingUp,
  UserCheck,
  Bell,
  Clock,
  MessageSquare,
  Mail,
  Settings,
} from "lucide-react";
import { CreatePlanModal } from "./components/CreatePlanModal";
import { PlanCard } from "./components/PlanCard";
import { AssignPlanModal } from "./components/AssignPlanModal";
import { PlanDetailsModal } from "./components/PlanDetailsModal";
import { BookingIntegrationModal } from "./components/BookingIntegrationModal";
import { TemplateLibrary } from "./components/TemplateLibrary";
import { ProgressTracker } from "./components/ProgressTracker";
import { BulkAssignment } from "./components/BulkAssignment";
import { AutomaticReminders } from "./components/AutomaticReminders";
import { therapyPlanService } from "../../services/api/therapyPlanService";
import { clientService } from "../../services/api/clientService";
import { planAssignmentService } from "../../services/api/planAssignmentService";
import { authService } from "../../services/api/authService";
import { demoMode } from "../../utils/demoMode";

export const PlansSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlanForBooking, setSelectedPlanForBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("plans");

  // Datos removidos - ahora se obtienen de la API

  useEffect(() => {
    // Configurar token de prueba para desarrollo
    if (
      process.env.NODE_ENV === "development" &&
      !localStorage.getItem("dhara_access_token")
    ) {
      // Token JWT válido para testing (expires en 24h)
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU4NTAwNzAwLCJleHAiOjE3NTg1ODcxMDB9.o13ZIKJeyXsXd1dOTbFX2ezhaOIyjAigbUPk7EMhPd0";
      localStorage.setItem("dhara_access_token", validToken);
      console.log("🔑 Token de desarrollo configurado");
    }

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Intentar usar servicios reales, si fallan usar datos mock como fallback
      let plansData, clientsData;

      // Cargar desde servicios reales (el therapistId se obtiene del token)
      const [plansResult, clientsResult] = await Promise.all([
        therapyPlanService.getPlans({}, { includeStatistics: true }),
        clientService.getClients({}, { includeStatistics: false }),
      ]);

      console.log("📊 Plans API Result:", plansResult);
      console.log("👥 Clients API Result:", clientsResult);

      // Extraer planes de la respuesta (puede estar en .plans o .data)
      const plansArray = plansResult.plans || plansResult.data || [];
      
      plansData = plansArray.map((plan) => ({
        id: plan.id || plan._id,
        name: plan.name,
        type: plan.type || "general",
        description: plan.description,
        duration: plan.duration || plan.estimatedDuration || 12,
        sessionsPerWeek: plan.sessionsPerWeek || 1,
        totalSessions: plan.totalSessions || plan.duration || 12,
        status: plan.status,
        createdDate:
          plan.createdAt?.split("T")[0] ||
          plan.created_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        assignedClients: plan.assignedClientsCount || plan.assigned_clients || plan.assignedClients || 0,
        objectives: plan.objectives || [],
      }));

      console.log("🔄 Transformed Plans Data:", plansData);

      // Extraer clientes de la respuesta
      const clientsArray = clientsResult.clients || clientsResult.data || [];
      clientsData = clientsArray.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        assignedPlans: client.assignedPlans || client.assigned_plans || [],
      }));

      console.log("📋 Final Plans Data to set:", plansData);
      console.log("👥 Final Clients Data to set:", clientsData);

      setPlans(plansData);
      setClients(clientsData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar planes según búsqueda y filtros
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || plan.status === filterStatus;
    const matchesType = filterType === "all" || plan.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreatePlan = async (planData) => {
    try {
      // Obtener el therapistId del usuario actual
      const currentUser = authService.getCurrentUser();
      const therapistId = currentUser?.id;

      console.log("👤 Therapist ID del usuario actual:", therapistId);

      // Mapear specialty según el tipo de plan
      const specialtyMapping = {
        'ansiedad': 'cognitive_behavioral',
        'depresion': 'cognitive_behavioral',
        'pareja': 'family_therapy',
        'trauma': 'trauma_focused',
        'adicciones': 'dialectical_behavioral',
        'infantil': 'humanistic',
        'general': 'cognitive_behavioral'
      };

      // Mapear category según el tipo (individual, couple, family, group)
      const categoryMapping = {
        'ansiedad': 'individual',
        'depresion': 'individual',
        'pareja': 'couple',
        'trauma': 'individual',
        'adicciones': 'individual',
        'infantil': 'individual',
        'general': 'individual'
      };

      // Preparar objetivos como array de strings (asegurar formato de array)
      let objectivesArray = [];
      if (planData.objectives) {
        // Si es un objeto con claves numéricas (por ej. { '0': 'obj' }), convertir a array
        if (!Array.isArray(planData.objectives)) {
          objectivesArray = Object.values(planData.objectives).filter(v => v && typeof v === 'string');
        } else {
          objectivesArray = planData.objectives.map((obj) => typeof obj === 'string' ? obj : obj?.description).filter(Boolean);
        }
      }
      if (objectivesArray.length === 0) {
        objectivesArray = ['Objetivo general del plan de tratamiento'];
      }

      // Datos según las validaciones del backend
      const apiPlanData = {
        therapistId: therapistId,
        name: planData.name,
        description: planData.description || planData.name,
        // type se envía directamente según el tipo seleccionado (ansiedad, depresion, etc.)
        type: planData.type || 'general',
        specialty: specialtyMapping[planData.type] || 'cognitive_behavioral',
        category: categoryMapping[planData.type] || 'individual',
        objectives: objectivesArray,
        duration: planData.duration || 12,
        sessionsPerWeek: planData.sessionsPerWeek || 1,
      };

      console.log('📤 Enviando datos a la API:', apiPlanData);

      const newPlan = await therapyPlanService.createPlan(apiPlanData);

      // Transformar la respuesta al formato esperado por el componente
      const transformedPlan = {
        id: newPlan.id || newPlan.planId,
        name: newPlan.name,
        type: newPlan.specialty || planData.type || "general",
        description: newPlan.description,
        duration: newPlan.estimatedDuration || 12,
        sessionsPerWeek: newPlan.sessionFrequency === "twice_weekly" ? 2 : 1,
        totalSessions: newPlan.totalSessions || newPlan.estimatedDuration || 12,
        status: newPlan.status,
        createdDate:
          newPlan.createdAt?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        assignedClients: 0,
        objectives:
          newPlan.objectives?.map((obj) => obj.description || obj) || [],
      };

      setPlans((prev) => [...prev, transformedPlan]);
      console.log("Plan creado exitosamente:", transformedPlan);
    } catch (error) {
      console.error("Error creating plan:", error);
      throw new Error("Error al crear el plan");
    }
  };

  const handleClonePlan = async (planToClone) => {
    try {
      const clonedPlan = await therapyPlanService.clonePlan(planToClone.id, {
        preserveObjectives: true,
        preserveTechniques: true,
        updateForNewClient: false,
        createAsTemplate: false,
      });

      // Transformar la respuesta al formato esperado por el componente
      const transformedClonedPlan = {
        id: clonedPlan.id || clonedPlan.planId,
        name: clonedPlan.name,
        type: clonedPlan.specialty || clonedPlan.type || "general",
        description: clonedPlan.description,
        duration: clonedPlan.estimatedDuration || clonedPlan.duration || 12,
        sessionsPerWeek:
          clonedPlan.sessionFrequency === "twice_weekly"
            ? 2
            : clonedPlan.sessionsPerWeek || 1,
        totalSessions:
          clonedPlan.totalSessions ||
          clonedPlan.estimatedDuration ||
          clonedPlan.duration ||
          12,
        status: clonedPlan.status,
        createdDate:
          clonedPlan.createdAt?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        assignedClients: clonedPlan.assignedClients || 0,
        objectives:
          clonedPlan.objectives?.map((obj) => obj.description || obj) || [],
      };

      setPlans((prev) => [...prev, transformedClonedPlan]);
      console.log("Plan clonado exitosamente:", transformedClonedPlan);
    } catch (error) {
      console.error("Error cloning plan:", error);
      throw new Error("Error al clonar el plan");
    }
  };

  const handleScheduleSessions = (plan) => {
    setSelectedPlanForBooking(plan);
    setShowBookingModal(true);
  };

  const handleEditPlanOpen = (plan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleEditPlanSave = async (planData) => {
    try {
      // Transformar datos al formato esperado por la API
      const apiPlanData = {
        name: planData.name,
        description: planData.description,
        objectives:
          planData.objectives?.map((obj) => ({
            description: obj,
            type: "behavioral",
            measurableOutcome: true,
            timeline: `${planData.duration || 12} semanas`,
          })) || [],
        sessionFrequency:
          planData.sessionsPerWeek === 2 ? "twice_weekly" : "weekly",
        estimatedDuration: planData.duration || 12,
      };

      const updatedPlan = await therapyPlanService.updatePlan(
        editingPlan.id,
        apiPlanData,
      );

      // Transformar la respuesta y actualizar el estado local
      const transformedPlan = {
        id: updatedPlan.id || updatedPlan.planId,
        name: updatedPlan.name,
        type: updatedPlan.specialty || "general",
        description: updatedPlan.description,
        duration: updatedPlan.estimatedDuration || 12,
        sessionsPerWeek:
          updatedPlan.sessionFrequency === "twice_weekly" ? 2 : 1,
        totalSessions:
          updatedPlan.totalSessions || updatedPlan.estimatedDuration || 12,
        status: updatedPlan.status,
        createdDate:
          updatedPlan.createdAt?.split("T")[0] || editingPlan.createdDate,
        assignedClients: editingPlan.assignedClients,
        objectives:
          updatedPlan.objectives?.map((obj) => obj.description || obj) || [],
      };

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingPlan.id ? transformedPlan : plan,
        ),
      );

      setShowEditModal(false);
      setEditingPlan(null);
      console.log("Plan actualizado exitosamente");
    } catch (error) {
      console.error("Error updating plan:", error);
      throw new Error("Error al actualizar el plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await therapyPlanService.deletePlan(planId, {
        reason: "user_request",
        createAuditLog: true,
        checkActiveAssignments: true,
        archiveInsteadOfDelete: true,
      });

      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      console.log("Plan eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting plan:", error);
      throw new Error("Error al eliminar el plan");
    }
  };

  const handleAssignPlan = async (planId, clientIds) => {
    try {
      // Crear asignaciones para cada cliente usando el servicio real
      const assignmentPromises = clientIds.map((clientId) =>
        planAssignmentService.assignPlan({
          planId: planId,
          clientId: clientId,
          startDate: new Date().toISOString(),
          estimatedDuration: 12, // Esto debería venir de los datos del plan
        }),
      );

      await Promise.all(assignmentPromises);

      // Actualizar clientes con el plan asignado
      setClients((prev) =>
        prev.map((client) => {
          if (clientIds.includes(client.id)) {
            return {
              ...client,
              assignedPlans: [...new Set([...client.assignedPlans, planId])],
            };
          }
          return client;
        }),
      );

      // Actualizar contador de clientes asignados en el plan
      setPlans((prev) =>
        prev.map((plan) => {
          if (plan.id === planId) {
            return {
              ...plan,
              assignedClients: plan.assignedClients + clientIds.length,
            };
          }
          return plan;
        }),
      );

      console.log("Plan asignado exitosamente");
    } catch (error) {
      console.error("Error assigning plan:", error);
      throw new Error("Error al asignar el plan");
    }
  };

  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setShowDetailsModal(true);
  };

  const handleActivatePlan = async (planId) => {
    try {
      await therapyPlanService.updatePlan(planId, { status: "active" });

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === planId ? { ...plan, status: "active" } : plan,
        ),
      );

      console.log("Plan activado exitosamente");
    } catch (error) {
      console.error("Error activating plan:", error);
      throw new Error("Error al activar el plan");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-pulse space-y-6 sm:space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Planes Terapéuticos
            </h1>
            <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base">
              Crea, gestiona y asigna planes de tratamiento para tus clientes
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Crear Plan
          </Button>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-full">
            <button
              onClick={() => setActiveTab("plans")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "plans"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Mis Planes
              </div>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "templates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Biblioteca de Plantillas
              </div>
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "progress"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Seguimiento de Progreso
              </div>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "bulk"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Asignación Masiva
              </div>
            </button>
            <button
              onClick={() => setActiveTab("reminders")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reminders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Recordatorios Automáticos
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === "plans" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Planes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Planes Activos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter((p) => p.status === "active").length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Clientes Asignados
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.reduce(
                      (total, plan) => total + plan.assignedClients,
                      0,
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Borradores
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter((p) => p.status === "draft").length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar planes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="draft">Borradores</option>
                  <option value="archived">Archivados</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="ansiedad">Ansiedad</option>
                  <option value="depresion">Depresión</option>
                  <option value="pareja">Terapia de Pareja</option>
                  <option value="trauma">Trauma</option>
                  <option value="adicciones">Adicciones</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onView={() => handleViewPlanDetails(plan)}
                onEdit={() => handleEditPlanOpen(plan)}
                onClone={() => handleClonePlan(plan)}
                onDelete={() => handleDeletePlan(plan.id)}
                onAssign={() => {
                  setSelectedPlan(plan);
                  setShowAssignModal(true);
                }}
                onActivate={() => handleActivatePlan(plan.id)}
                onScheduleSessions={() => handleScheduleSessions(plan)}
              />
            ))}
          </div>

          {filteredPlans.length === 0 && (
            <Card className="p-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron planes
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza creando tu primer plan terapéutico"}
              </p>
              {!searchTerm &&
                filterStatus === "all" &&
                filterType === "all" && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Plan
                  </Button>
                )}
            </Card>
          )}
        </>
      )}

      {activeTab === "templates" && (
        <div className="space-y-6">
          {/* Header de la sección de plantillas */}
          <Card className="p-6">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Biblioteca de Plantillas
              </h2>
              <p className="text-gray-600">
                Explora plantillas predefinidas para crear planes terapéuticos
                efectivos
              </p>
            </div>
          </Card>

          {/* Botón para abrir la biblioteca */}
          <div className="text-center">
            <Button
              onClick={() => setShowTemplateLibrary(true)}
              className="flex items-center gap-2"
              size="lg"
            >
              <BookOpen className="w-5 h-5" />
              Explorar Plantillas
            </Button>
          </div>

          {/* Grid de categorías de plantillas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                category: "ansiedad",
                title: "Ansiedad",
                description:
                  "Plantillas para trastornos de ansiedad generalizada, fobias y ataques de pánico",
                count: 5,
                color: "blue",
              },
              {
                category: "depresion",
                title: "Depresión",
                description:
                  "Planes integrales para el tratamiento de episodios depresivos",
                count: 3,
                color: "green",
              },
              {
                category: "pareja",
                title: "Terapia de Pareja",
                description:
                  "Mejora la comunicación y resolución de conflictos en parejas",
                count: 4,
                color: "purple",
              },
              {
                category: "trauma",
                title: "Trauma",
                description:
                  "Tratamiento especializado para TEPT y experiencias traumáticas",
                count: 2,
                color: "red",
              },
              {
                category: "adicciones",
                title: "Adicciones",
                description:
                  "Recuperación integral de trastornos por uso de sustancias",
                count: 3,
                color: "yellow",
              },
              {
                category: "infantil",
                title: "Terapia Infantil",
                description: "Planes adaptados para niños y adolescentes",
                count: 4,
                color: "pink",
              },
            ].map((category) => (
              <Card
                key={category.category}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div
                  className={`w-12 h-12 bg-${category.color}-100 rounded-lg flex items-center justify-center mb-4`}
                >
                  <BookOpen className={`w-6 h-6 text-${category.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {category.count} plantillas
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateLibrary(true)}
                  >
                    Ver plantillas
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-6">
          {/* Header de la sección de seguimiento */}
          <Card className="p-6">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Seguimiento de Progreso
              </h2>
              <p className="text-gray-600">
                Monitorea el avance de tus clientes en sus planes terapéuticos
              </p>
            </div>
          </Card>

          {/* Estadísticas de progreso general */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Planes Activos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter((p) => p.status === "active").length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Clientes en Seguimiento
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.reduce(
                      (total, plan) => total + plan.assignedClients,
                      0,
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Progreso Promedio
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter((p) => p.status === "active").length > 0
                      ? Math.round(
                          (plans.filter((p) => p.assignedClients > 0).length /
                            plans.filter((p) => p.status === "active").length) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Sesiones
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.reduce(
                      (total, plan) => total + (plan.totalSessions || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Lista de clientes con seguimiento disponible */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Clientes con Planes Asignados
              </h3>
              <p className="text-sm text-gray-600">
                Selecciona un cliente para ver su progreso detallado
              </p>
            </div>

            <div className="space-y-4">
              {clients
                .filter(
                  (client) =>
                    client.assignedPlans && client.assignedPlans.length > 0,
                )
                .map((client) => {
                  const clientPlans = plans.filter((plan) =>
                    client.assignedPlans.includes(plan.id),
                  );
                  return (
                    <div
                      key={client.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-800 font-semibold text-sm sm:text-lg">
                              {client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {client.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {client.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {clientPlans.length} plan
                                {clientPlans.length !== 1 ? "es" : ""} asignado
                                {clientPlans.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          {clientPlans.map((plan) => (
                            <Button
                              key={plan.id}
                              onClick={() => {
                                setSelectedPlan(plan);
                                setSelectedClient(client);
                                setShowProgressTracker(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-sm justify-start sm:justify-center"
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              <span className="truncate">{plan.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {clients.filter(
                (client) =>
                  client.assignedPlans && client.assignedPlans.length > 0,
              ).length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay clientes con planes asignados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Para poder hacer seguimiento del progreso, primero debes
                    asignar planes a tus clientes
                  </p>
                  <Button
                    onClick={() => setActiveTab("bulk")}
                    className="flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Ir a Asignación Masiva
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "bulk" && (
        <div className="space-y-6">
          {/* Header de la sección de asignación masiva */}
          <Card className="p-6">
            <div className="text-center">
              <UserCheck className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Asignación Masiva
              </h2>
              <p className="text-gray-600">
                Asigna planes terapéuticos a múltiples clientes de forma
                eficiente
              </p>
            </div>
          </Card>

          {/* Estadísticas de asignación */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Planes Disponibles
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Clientes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clients.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Clientes con Planes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      clients.filter(
                        (c) => c.assignedPlans && c.assignedPlans.length > 0,
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Sin Asignar
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      clients.filter(
                        (c) => !c.assignedPlans || c.assignedPlans.length === 0,
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Selección de plan para asignación masiva */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar Plan para Asignación Masiva
              </h3>
              <p className="text-sm text-gray-600">
                Elige un plan para asignarlo a múltiples clientes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {plans
                .filter((plan) => plan.status === "active")
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {plan.name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                          {plan.type}
                        </span>
                        <p className="text-sm text-gray-600 mb-3">
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duración:</span>
                        <span className="font-medium">
                          {plan.duration} semanas
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sesiones/semana:</span>
                        <span className="font-medium">
                          {plan.sessionsPerWeek}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Clientes asignados:
                        </span>
                        <span className="font-medium">
                          {plan.assignedClients}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowBulkAssignment(true);
                      }}
                      className="w-full text-sm"
                      variant="outline"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Asignar a Múltiples Clientes
                    </Button>
                  </div>
                ))}
            </div>

            {plans.filter((plan) => plan.status === "active").length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay planes activos disponibles
                </h3>
                <p className="text-gray-600 mb-6">
                  Para poder realizar asignaciones masivas, primero necesitas
                  tener planes activos
                </p>
                <Button
                  onClick={() => setActiveTab("plans")}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Ir a Mis Planes
                </Button>
              </div>
            )}
          </Card>

          {/* Asignaciones recientes - Los datos se cargan desde la API */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Asignaciones Recientes
            </h3>

            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Las asignaciones recientes se mostrarán aquí</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "reminders" && (
        <div className="space-y-6">
          {/* Header de la sección de recordatorios */}
          <Card className="p-6">
            <div className="text-center">
              <Bell className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Recordatorios Automáticos
              </h2>
              <p className="text-gray-600">
                Configura y gestiona recordatorios automáticos para tus clientes
              </p>
            </div>
          </Card>

          {/* Estadísticas de recordatorios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Plantillas Activas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter((p) => p.status === "active").length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Programados Hoy
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.reduce(
                      (total, plan) => total + plan.assignedClients,
                      0,
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Enviados Esta Semana
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.length * 3}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Tasa de Éxito
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.length > 0
                      ? Math.round(
                          (plans.filter((p) => p.status === "active").length /
                            plans.length) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tipos de recordatorios disponibles */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Tipos de Recordatorios
              </h3>
              <p className="text-sm text-gray-600">
                Configura diferentes tipos de recordatorios automáticos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  type: "session",
                  title: "Recordatorios de Sesión",
                  description: "Notifica a tus clientes sobre próximas citas",
                  icon: Calendar,
                  color: "blue",
                  templates: 3,
                  active: true,
                },
                {
                  type: "homework",
                  title: "Tareas y Ejercicios",
                  description:
                    "Recuerda a los clientes sobre tareas pendientes",
                  icon: Target,
                  color: "green",
                  templates: 2,
                  active: true,
                },
                {
                  type: "progress",
                  title: "Seguimiento de Progreso",
                  description: "Solicita feedback sobre el avance terapéutico",
                  icon: TrendingUp,
                  color: "purple",
                  templates: 1,
                  active: false,
                },
              ].map((category) => (
                <div
                  key={category.type}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 bg-${category.color}-100 rounded-lg`}>
                      <category.icon
                        className={`w-6 h-6 text-${category.color}-600`}
                      />
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        category.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {category.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {category.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {category.templates} plantillas
                    </span>
                    <Button
                      onClick={() => setShowReminders(true)}
                      size="sm"
                      variant="outline"
                    >
                      Configurar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actividad reciente - Los datos se cargan desde la API */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actividad Reciente
            </h3>

            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>La actividad de recordatorios se mostrará aquí</p>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={() => setShowReminders(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Gestionar Recordatorios
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePlan}
      />

      <CreatePlanModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPlan(null);
        }}
        onSave={handleEditPlanSave}
        initialData={editingPlan}
        isEditing={true}
      />

      <AssignPlanModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        clients={clients}
        onAssign={handleAssignPlan}
      />

      <PlanDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        clients={clients}
      />

      <BookingIntegrationModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedPlanForBooking(null);
        }}
        plan={selectedPlanForBooking}
        clients={clients}
      />

      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={(templateData) => {
          // Crear un nuevo plan basado en la plantilla
          handleCreatePlan(templateData);
          setShowTemplateLibrary(false);
        }}
      />

      <ProgressTracker
        isOpen={showProgressTracker}
        onClose={() => {
          setShowProgressTracker(false);
          setSelectedPlan(null);
          setSelectedClient(null);
        }}
        client={selectedClient}
        plan={selectedPlan}
      />

      <BulkAssignment
        isOpen={showBulkAssignment}
        onClose={() => {
          setShowBulkAssignment(false);
          setSelectedPlan(null);
        }}
        selectedPlan={selectedPlan}
        clients={clients}
        onAssignPlan={handleAssignPlan}
      />

      <AutomaticReminders
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        clients={clients}
        plans={plans}
      />
    </div>
  );
};
