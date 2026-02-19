# 📱 Configuración de Navegación - Perfil Profesional

## 🚀 Opciones de Implementación

El `FavoritesScreen` ahora soporta múltiples formas de navegación. Elige la opción que mejor se adapte a tu proyecto:

### Opción 1: Con React Navigation (Recomendado)

#### 1.1. Instalar dependencias

```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
```

#### 1.2. Configurar navegación

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: 'Favoritos' }}
        />
        <Stack.Screen
          name="ProfessionalProfile"
          component={ProfessionalProfileScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### 1.3. Usar el componente

```javascript
// React Navigation pasa automáticamente el prop 'navigation'
<Stack.Screen name="Favorites" component={FavoritesScreen} />
```

### Opción 2: Con callback personalizado (Más flexible)

```javascript
import FavoritesScreen from './screens/FavoritesScreen';

function MyComponent() {
  const handleViewProfile = (therapistId) => {
    // Tu lógica personalizada de navegación
    console.log('Navegar a perfil:', therapistId);

    // Ejemplo: Navegar con tu sistema de navegación personalizado
    YourNavigationSystem.push('ProfileScreen', { therapistId });

    // O abrir modal, actualizar estado, etc.
  };

  return (
    <FavoritesScreen
      user={currentUser}
      onViewProfile={handleViewProfile}
    />
  );
}
```

### Opción 3: Sin navegación (Solo mostrar ID)

```javascript
// Si no proporcionas navigation ni onViewProfile,
// el botón mostrará un Alert con el ID del terapeuta
<FavoritesScreen user={currentUser} />
```

## 🔄 Flujo de Navegación

1. **FavoritesScreen** → Usuario presiona "Ver Perfil" 👆
2. **Lógica de navegación** → Se ejecuta según la configuración:
   - Con React Navigation: `navigation.navigate('ProfessionalProfile', { therapistId })`
   - Con callback: `onViewProfile(therapistId)`
   - Sin navegación: Muestra Alert con ID
3. **ProfessionalProfileScreen** → Se carga con el ID del terapeuta
4. **API automática** → Obtiene datos desde `/api/profile/public/:userId`

## 📱 Funcionalidades Incluidas

### FavoritesScreen
- ✅ Lista de terapeutas favoritos con API real
- ✅ Botón "Ver Perfil" con navegación flexible
- ✅ Eliminar de favoritos con confirmación
- ✅ Estados de carga, error y lista vacía
- ✅ Información completa del terapeuta

### ProfessionalProfileScreen
- ✅ Perfil completo del terapeuta
- ✅ Botón favoritos sincronizado
- ✅ Enlaces externos (web, LinkedIn, etc.)
- ✅ Toda la información profesional
- ✅ Navegación de regreso

## 🛠️ Solución de Problemas

### Error: "Unable to resolve @react-navigation/native"

**Solución 1**: Instalar React Navigation
```bash
npm install @react-navigation/native @react-navigation/stack
```

**Solución 2**: Usar callback personalizado
```javascript
<FavoritesScreen
  user={user}
  onViewProfile={(therapistId) => {
    // Tu lógica de navegación personalizada
  }}
/>
```

### El botón "Ver Perfil" no hace nada

Asegúrate de pasar al menos uno de estos props:
- `navigation` (objeto de React Navigation)
- `onViewProfile` (función callback)

### Componente funciona pero no navega

Verifica que tu ruta esté registrada:
```javascript
<Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
```

## ✨ Ejemplo Completo

```javascript
import React from 'react';
import FavoritesScreen from './screens/FavoritesScreen';

function MyApp() {
  const currentUser = { token: 'your-auth-token' };

  const handleProfileView = (therapistId) => {
    console.log('Ver perfil del terapeuta:', therapistId);
    // Implementa tu navegación aquí
  };

  return (
    <FavoritesScreen
      user={currentUser}
      onViewProfile={handleProfileView}
    />
  );
}
```

¡La integración está **100% funcional** y compatible con cualquier sistema de navegación! 🚀