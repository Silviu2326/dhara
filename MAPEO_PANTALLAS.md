# Dharaterapeutas - Mapeo de Pantallas (Móvil → Web)

## Resumen

Esta guía mapea las pantallas de la aplicación móvil (React Native/Expo) a su equivalente para una aplicación web.

---

## Tabla de Correspondencia

| #   | Pantalla (Móvil)           | Archivo                                 | Equivalente Web Sugerido |
| --- | -------------------------- | --------------------------------------- | ------------------------ |
| 1   | HomeScreen                 | `screens/HomeScreen.js`                 | `/` (Home)               |
| 2   | LoginScreen                | `LoginScreen.js`                        | `/login`                 |
| 3   | DashboardScreen            | `screens/DashboardScreen.js`            | `/dashboard`             |
| 4   | ProfileScreen              | `screens/ProfileScreen.js`              | `/perfil`                |
| 5   | AppointmentsScreen         | `screens/AppointmentsScreen.js`         | `/citas`                 |
| 6   | AppointmentDetailScreen    | `screens/AppointmentDetailScreen.js`    | `/citas/:id`             |
| 7   | ExploreTherapistsScreen    | `screens/ExploreTherapistsScreen.js`    | `/terapeutas`            |
| 8   | ProfessionalProfileScreen  | `screens/ProfessionalProfileScreen.js`  | `/terapeutas/:id`        |
| 9   | FavoritesScreen            | `screens/FavoritesScreen.js`            | `/favoritos`             |
| 10  | FavoritesWithProfileScreen | `screens/FavoritesWithProfileScreen.js` | `/favoritos/perfil`      |
| 11  | ReviewsScreen              | `screens/ReviewsScreen.js`              | `/resenas`               |
| 12  | DocumentsScreen            | `screens/DocumentsScreen.js`            | `/documentos`            |
| 13  | NotificationsScreen        | `screens/NotificationsScreen.js`        | `/notificaciones`        |
| 14  | AgendaScreen               | `screens/AgendaScreen.js`               | `/agenda`                |
| 15  | ChatScreen                 | `screens/ChatScreen.js`                 | `/chat`                  |
| 16  | PrivacyScreen              | `screens/PrivacyScreen.js`              | `/privacidad`            |
| 17  | HelpCenterScreen           | `screens/HelpCenterScreen.js`           | `/ayuda`                 |
| 18  | SettingsScreen             | `screens/SettingsScreen.js`             | `/configuracion`         |
| 19  | PaymentHistoryScreen       | `screens/PaymentHistoryScreen.js`       | `/pagos`                 |
| 20  | DictionaryScreen           | `screens/DictionaryScreen.js`           | `/diccionario`           |

---

## Archivos de Configuración de Navegación

| Archivo               | Descripción                 |
| --------------------- | --------------------------- |
| `App.js`              | Punto de entrada principal  |
| `Sidebar.js`          | Navegación lateral          |
| `Header.js`           | Encabezado                  |
| `NAVIGATION_SETUP.md` | Configuración de navegación |

---

## Servicios

| Servicio       | Archivo                           |
| -------------- | --------------------------------- |
| Datos mock     | `services/mockData.js`            |
| Dashboard      | `services/dashboardService.js`    |
| Disponibilidad | `services/availabilityService.js` |
| Notificaciones | `services/notificationService.js` |
| Perfil         | `services/profileService.js`      |

---

## Notas para la Migración Web

1. **Frameworks sugeridos**: Next.js o React con React Router
2. **Estilos**: Adaptar de StyleSheet (React Native) a CSS/Tailwind
3. **Navegación**: Cambiar de React Navigation a React Router o Next.js Router
4. **Componentes**: Los componentes TouchableOpacity → button, ScrollView → div con overflow
5. **Iconos**: Verificar compatibilidad (react-native-vector-icons → react-icons o similar)
