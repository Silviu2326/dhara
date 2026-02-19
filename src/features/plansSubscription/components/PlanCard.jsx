import React, { useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  Target,
  MoreVertical,
  Play,
  Copy,
} from "lucide-react";
import { Button } from "../../../components/Button";

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "draft":
      return "bg-yellow-100 text-yellow-800";
    case "archived":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "active":
      return "Activo";
    case "draft":
      return "Borrador";
    case "archived":
      return "Archivado";
    default:
      return status;
  }
};

const getTypeColor = (type) => {
  const colors = {
    ansiedad: "bg-blue-100 text-blue-800 border-blue-200",
    depresion: "bg-purple-100 text-purple-800 border-purple-200",
    pareja: "bg-pink-100 text-pink-800 border-pink-200",
    trauma: "bg-red-100 text-red-800 border-red-200",
    autoestima: "bg-emerald-100 text-emerald-800 border-emerald-200",
    adicciones: "bg-orange-100 text-orange-800 border-orange-200",
    infantil: "bg-green-100 text-green-800 border-green-200",
    familiar: "bg-indigo-100 text-indigo-800 border-indigo-200",
    general: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getTypeLabel = (type) => {
  const types = {
    ansiedad: "Ansiedad",
    depresion: "Depresión",
    pareja: "Terapia de Pareja",
    trauma: "Trauma",
    autoestima: "Autoestima",
    adicciones: "Adicciones",
    infantil: "Terapia Infantil",
    familiar: "Terapia Familiar",
    general: "General",
  };
  return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export const PlanCard = ({
  plan,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onActivate,
  onClone,
  onScheduleSessions,
  className = "",
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`
      relative bg-white rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 overflow-hidden
      ${className}
    `}
    >
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(plan.status)}`}
                  >
                    {getStatusLabel(plan.status)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(plan.type)}`}
                  >
                    {getTypeLabel(plan.type)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[180px] overflow-hidden">
                <button
                  onClick={() => {
                    onView();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver detalles
                </button>
                <button
                  onClick={() => {
                    onAssign();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Asignar clientes
                </button>
                <button
                  onClick={() => {
                    onEdit(plan);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-3 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar plan
                </button>
                <button
                  onClick={() => {
                    onClone && onClone(plan);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Clonar plan
                </button>
                {plan.status === "active" && (
                  <button
                    onClick={() => {
                      onScheduleSessions && onScheduleSessions(plan);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Programar sesiones
                  </button>
                )}
                {plan.status === "draft" && (
                  <button
                    onClick={() => {
                      onActivate();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-3 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Activar plan
                  </button>
                )}
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 pt-2 pb-4">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {plan.description}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-blue-200 rounded">
                <Clock className="w-3 h-3 text-blue-700" />
              </div>
              <span className="text-xs font-medium text-blue-700">
                Duración
              </span>
            </div>
            <p className="text-sm font-bold text-blue-900">
              {plan.duration} semanas
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-green-200 rounded">
                <Calendar className="w-3 h-3 text-green-700" />
              </div>
              <span className="text-xs font-medium text-green-700">
                Frecuencia
              </span>
            </div>
            <p className="text-sm font-bold text-green-900">
              {plan.sessionsPerWeek}/semana
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-purple-200 rounded">
                <Target className="w-3 h-3 text-purple-700" />
              </div>
              <span className="text-xs font-medium text-purple-700">
                Sesiones
              </span>
            </div>
            <p className="text-sm font-bold text-purple-900">
              {plan.totalSessions} total
            </p>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-amber-200 rounded">
                <Users className="w-3 h-3 text-amber-700" />
              </div>
              <span className="text-xs font-medium text-amber-700">
                Clientes
              </span>
            </div>
            <p className="text-sm font-bold text-amber-900">
              {plan.assignedClients || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Objectives Preview */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-600" />
            Objetivos principales
          </h4>
          <div className="space-y-2">
            {plan.objectives.slice(0, 2).map((objective, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                  {typeof objective === "object"
                    ? objective.description || ""
                    : objective}
                </p>
              </div>
            ))}
            {plan.objectives.length > 2 && (
              <div className="pt-1">
                <span className="text-xs text-blue-600 font-medium">
                  +{plan.objectives.length - 2} objetivos más
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <div className="text-xs text-gray-600 font-medium order-2 sm:order-1">
            {plan.createdDate
              ? new Date(plan.createdDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Fecha no disponible"}
          </div>
          <Button
            size="sm"
            onClick={onView}
            className="text-xs font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border-0 transition-colors w-full sm:w-auto order-1 sm:order-2"
          >
            Ver detalles
          </Button>
        </div>
      </div>

      {/* Click overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
