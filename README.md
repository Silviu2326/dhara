# Dhara Dimensión Humana - Panel Profesional

Panel profesional para terapeutas de Dhara Dimensión Humana, construido con React 18, Vite y Tailwind CSS.

## 🚀 Tecnologías

- **React 18** - Framework de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS
- **React Router DOM v6** - Enrutamiento
- **TanStack Query** - Gestión de estado del servidor
- **Zustand** - Gestión de estado local
- **Lucide React** - Iconos

## 🎨 Diseño

El panel utiliza la paleta oficial de colores de Dhara:
- **Verde Salvia** (#819983) - Color primario
- **Arena Cálida** (#fef7ef) - Color de fondo
- **Azul Profundo** (#273b51) - Color de texto principal

## 📁 Estructura del Proyecto

```
client/
├─ src/
│  ├─ components/          # Componentes globales reutilizables
│  ├─ features/           # Funcionalidades organizadas por página
│  │  ├─ dashboard/       # Dashboard principal
│  │  ├─ professionalProfile/  # Perfil profesional
│  │  ├─ verification/    # Verificación de credenciales
│  │  ├─ plansSubscription/   # Planes y suscripción
│  │  ├─ availability/    # Configuración de disponibilidad
│  │  ├─ bookings/        # Gestión de reservas
│  │  ├─ clients/         # Gestión de clientes
│  │  ├─ chat/            # Sistema de chat
│  │  ├─ documentsMaterials/  # Documentos y materiales
│  │  ├─ reviews/         # Reseñas y valoraciones
│  │  ├─ payments/        # Gestión de pagos
│  │  ├─ notifications/   # Centro de notificaciones
│  │  ├─ integrations/    # Integraciones externas
│  │  ├─ helpCenter/      # Centro de ayuda
│  │  └─ accountSettings/ # Configuración de cuenta
│  ├─ app/                # Configuración de la app
│  ├─ hooks/              # Hooks personalizados
│  ├─ layouts/            # Layouts de la aplicación
│  └─ styles/             # Estilos globales
```

## 🛠️ Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd dhara-therapist-panel
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus configuraciones:
   ```env
   VITE_API_URL=https://api.dhara.local
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## 🔧 Funcionalidades

### Módulos Principales

1. **Dashboard** - Vista general con estadísticas y métricas
2. **Perfil Profesional** - Gestión de información profesional
3. **Verificación** - Estado de verificación de credenciales
4. **Planes y Suscripción** - Gestión de suscripciones
5. **Disponibilidad** - Configuración de horarios
6. **Reservas** - Gestión de citas y reservas
7. **Clientes** - Base de datos de clientes
8. **Chat** - Comunicación segura con clientes
9. **Documentos y Materiales** - Biblioteca de recursos
10. **Reseñas** - Gestión de valoraciones
11. **Pagos** - Historial de transacciones
12. **Notificaciones** - Centro de notificaciones
13. **Integraciones** - Conexiones con herramientas externas
14. **Centro de Ayuda** - Soporte y documentación
15. **Configuración de Cuenta** - Ajustes personales

### Características Técnicas

- **Autenticación JWT** con persistencia en localStorage
- **Rutas protegidas** con componente PrivateRoute
- **Gestión de estado** con Zustand y TanStack Query
- **Diseño responsive** optimizado para desktop y tablet
- **Preparación para Stripe** para procesamiento de pagos
- **Arquitectura modular** con separación clara de responsabilidades

## 🚀 Despliegue

La aplicación está lista para desplegarse en cualquier servicio de hosting estático:

```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propietario de Dhara Dimensión Humana.

---

**Desarrollado con ❤️ para Dhara Dimensión Humana**