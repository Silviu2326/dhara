# 🚀 Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para autenticación con Google y almacenamiento de archivos.

## 📋 Requisitos Previos

- Cuenta de Google (para crear proyecto)
- Cuenta de Supabase (gratis en https://supabase.com)

---

## 1️⃣ Crear Proyecto en Supabase

### Paso 1: Crear cuenta y proyecto

1. Ve a https://supabase.com y crea una cuenta
2. Click en "New Project"
3. Completa la información:
   - **Name**: `dharaterapeutas` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana (ej: `Europe (Frankfurt)`)
   - **Pricing Plan**: Free (para desarrollo)
4. Click en "Create new project"
5. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Obtener credenciales

1. En el dashboard de Supabase, ve a **Settings** > **API**
2. Copia las siguientes claves:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Clave pública (comienza con `eyJh...`)

3. Agregar al archivo `.env` del frontend:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

---

## 2️⃣ Configurar Google OAuth

### Paso 1: Crear proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita "Google+ API":
   - Menú > **APIs & Services** > **Library**
   - Busca "Google+ API" y habilítala

### Paso 2: Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Click en "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Si es la primera vez, configura la "OAuth consent screen":
   - **User Type**: External
   - **App name**: Dharaterapeutas
   - **User support email**: Tu email
   - **Developer contact**: Tu email
   - Click "Save and Continue"
4. En **Scopes**, agrega:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Completa el resto del formulario

### Paso 3: Crear OAuth Client ID

1. Vuelve a **Credentials** > "+ CREATE CREDENTIALS" > "OAuth client ID"
2. **Application type**: Web application
3. **Name**: Dharaterapeutas Web
4. **Authorized redirect URIs**: Agrega la URL de callback de Supabase:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (Reemplaza `xxxxx` con tu project ID de Supabase)
5. Click "Create"
6. **GUARDA** el Client ID y Client Secret

### Paso 4: Configurar Google en Supabase

1. En Supabase, ve a **Authentication** > **Providers**
2. Busca **Google** y habilítalo
3. Ingresa:
   - **Client ID**: El Client ID de Google
   - **Client Secret**: El Client Secret de Google
4. Click "Save"

---

## 3️⃣ Configurar Storage en Supabase

### Paso 1: Crear buckets

1. En Supabase, ve a **Storage**
2. Crea los siguientes buckets:

   **Bucket: documents**
   - Name: `documents`
   - Public: ❌ (privado)
   - File size limit: 10 MB
   - Allowed MIME types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

   **Bucket: avatars**
   - Name: `avatars`
   - Public: ✅ (público)
   - File size limit: 2 MB
   - Allowed MIME types: `image/*`

   **Bucket: credentials**
   - Name: `credentials`
   - Public: ❌ (privado)
   - File size limit: 10 MB
   - Allowed MIME types: `application/pdf, image/*`

   **Bucket: public**
   - Name: `public`
   - Public: ✅ (público)
   - File size limit: 5 MB
   - Allowed MIME types: `image/*, application/pdf`

### Paso 2: Configurar políticas de seguridad (RLS)

Para cada bucket privado, configura las políticas:

**documents bucket:**
```sql
-- Política de lectura: Solo el propietario puede leer
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de escritura: Solo el propietario puede subir
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de eliminación: Solo el propietario puede eliminar
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**credentials bucket:** (Políticas similares)

### Paso 3: Estructura de carpetas recomendada

Organiza los archivos por usuario:
```
documents/
  └── {userId}/
      ├── session-notes/
      ├── reports/
      └── contracts/

credentials/
  └── {userId}/
      ├── diplomas/
      ├── licenses/
      └── certifications/

avatars/
  └── {userId}.jpg

public/
  └── shared/
      └── {documentId}/
```

---

## 4️⃣ Actualizar Backend

### Agregar campo supabaseId al modelo User

Agrega al modelo `User.js`:
```javascript
supabaseId: {
  type: String,
  unique: true,
  sparse: true, // Permite null y duplicados de null
  index: true
},
authProvider: {
  type: String,
  enum: ['local', 'google', 'facebook'],
  default: 'local'
}
```

### Registrar rutas de Supabase

En `backend/src/app.js`, agrega:
```javascript
const supabaseAuthRoutes = require('./routes/supabaseAuthRoutes');

// Después de las otras rutas
app.use('/api/auth/supabase', supabaseAuthRoutes);
```

---

## 5️⃣ Integrar en el Frontend

### Actualizar página de Login

Agrega el botón de Google en tu componente de Login:

```jsx
import { GoogleLoginButton } from '../components/GoogleLoginButton';

// En tu componente Login
<GoogleLoginButton
  onSuccess={() => console.log('Login initiated')}
  onError={(error) => console.error('Login error:', error)}
  redirectTo={`${window.location.origin}/auth/callback`}
/>
```

### Configurar ruta de callback

Agrega la ruta en tu router:
```jsx
import { AuthCallback } from '../pages/AuthCallback';

// En tu router
<Route path="/auth/callback" element={<AuthCallback />} />
```

### Inicializar Supabase Auth

En tu `main.jsx` o `App.jsx`:
```jsx
import { supabaseAuthService } from './services/api/supabaseAuthService';

// Inicializar el servicio
supabaseAuthService.initialize();
```

---

## 6️⃣ Probar la Integración

### Test de Autenticación

1. Ejecuta el frontend: `npm run dev`
2. Ve a la página de login
3. Click en "Continuar con Google"
4. Autoriza la aplicación
5. Deberías ser redirigido a `/auth/callback`
6. Luego al dashboard

### Test de Storage

```javascript
import { supabaseStorageService } from './services/api/supabaseStorageService';

// Upload de archivo
const file = document.querySelector('input[type="file"]').files[0];

const result = await supabaseStorageService.uploadFile(file, {
  bucket: 'documents',
  folder: `${userId}/reports`,
  isPublic: false,
  onProgress: (percent) => console.log(`Upload: ${percent}%`)
});

console.log('File uploaded:', result.url);
```

---

## 7️⃣ Monitoreo y Logs

### Ver logs en Supabase

1. Ve a **Database** > **Logs**
2. Filtra por:
   - API
   - Auth
   - Storage

### Verificar usuarios creados

1. Ve a **Authentication** > **Users**
2. Deberías ver los usuarios que se autenticaron con Google

### Verificar archivos subidos

1. Ve a **Storage**
2. Selecciona un bucket
3. Navega por las carpetas

---

## 8️⃣ Seguridad y Mejores Prácticas

### ✅ DO's
- Usar Row Level Security (RLS) en todos los buckets privados
- Validar tipos de archivo en el frontend Y backend
- Limitar tamaños de archivo
- Usar carpetas organizadas por usuario
- Generar nombres únicos para archivos
- Usar URLs firmadas para documentos privados

### ❌ DON'Ts
- NO almacenar el `anon key` en el código
- NO hacer buckets públicos innecesariamente
- NO permitir uploads sin límite de tamaño
- NO confiar solo en validación del frontend
- NO exponer URLs de archivos privados

---

## 9️⃣ Límites del Plan Gratuito

| Recurso | Límite Gratuito |
|---------|----------------|
| Database | 500 MB |
| Storage | 1 GB |
| Bandwidth | 5 GB/mes |
| Monthly Active Users | Ilimitados |
| API Requests | Ilimitadas |

---

## 🆘 Troubleshooting

### Error: "Invalid redirect URL"
**Solución**: Verifica que la URL de callback en Google Cloud Console coincida exactamente con la de Supabase.

### Error: "Supabase is not configured"
**Solución**: Verifica que las variables de entorno estén configuradas correctamente en el `.env`.

### Error al subir archivos
**Solución**:
1. Verifica que el bucket existe
2. Verifica las políticas RLS
3. Verifica el tamaño del archivo

### Usuario no se sincroniza con backend
**Solución**: Verifica que el endpoint `/api/auth/supabase/sync` esté registrado y funcionando.

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Auth con Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Guía de Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist de Configuración

- [ ] Proyecto de Supabase creado
- [ ] Variables de entorno configuradas
- [ ] Proyecto de Google Cloud creado
- [ ] OAuth credentials creadas
- [ ] Google OAuth configurado en Supabase
- [ ] Buckets de storage creados
- [ ] Políticas RLS configuradas
- [ ] Backend actualizado con rutas de Supabase
- [ ] Modelo User actualizado con supabaseId
- [ ] Frontend integrado con componente de login
- [ ] Ruta de callback configurada
- [ ] Servicio de auth inicializado
- [ ] Test de login exitoso
- [ ] Test de upload de archivos exitoso

---

**¡Listo!** Ahora tienes Supabase completamente configurado para autenticación y almacenamiento. 🎉
