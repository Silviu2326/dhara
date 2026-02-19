# 🚀 Quick Start - Supabase Integration

Esta guía te ayudará a poner en marcha la integración de Supabase en **5 minutos**.

## 📦 Paso 1: Instalar Dependencias

### Frontend
```bash
npm install
```

Esto instalará `@supabase/supabase-js` y todas las demás dependencias.

### Backend
```bash
cd backend
npm install
```

---

## 🔧 Paso 2: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Click en "New Project"
4. Completa:
   - **Name**: `dharaterapeutas`
   - **Database Password**: Genera una contraseña segura
   - **Region**: Selecciona la más cercana
   - **Plan**: Free
5. Click "Create new project"
6. **Espera 2-3 minutos** mientras se crea

---

## 🔑 Paso 3: Obtener Credenciales

En el dashboard de Supabase:

1. Ve a **Settings** (⚙️) > **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Comienza con `eyJh...`

---

## ⚙️ Paso 4: Configurar Variables de Entorno

### Frontend

Crea un archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_APP_ENV=development

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
VITE_APP_NAME=Dhara Dimensión Humana
VITE_APP_VERSION=1.0.0
```

### Backend

Crea un archivo `.env` en la carpeta `backend`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/dharaterapeutas

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 🌐 Paso 5: Configurar Google OAuth

### En Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Click "Create Credentials" > "OAuth client ID"
5. Si es primera vez, configura la "OAuth consent screen":
   - User Type: External
   - App name: Dharaterapeutas
   - Agrega tu email
6. Vuelve a Credentials > "Create Credentials" > "OAuth client ID"
7. **Application type**: Web application
8. **Authorized redirect URIs**:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (Reemplaza `xxxxx` con tu Supabase project ID)
9. Copia el **Client ID** y **Client Secret**

### En Supabase

1. Ve a **Authentication** > **Providers**
2. Habilita **Google**
3. Pega:
   - **Client ID** (de Google)
   - **Client Secret** (de Google)
4. Click "Save"

---

## 💾 Paso 6: Crear Buckets de Storage (Opcional)

Si vas a usar el servicio de storage:

1. En Supabase, ve a **Storage**
2. Crea los siguientes buckets:

   - **documents** (privado)
   - **avatars** (público)
   - **credentials** (privado)
   - **public** (público)

Para más detalles sobre políticas RLS, consulta `SUPABASE_SETUP_GUIDE.md`.

---

## ▶️ Paso 7: Iniciar la Aplicación

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
npm run dev
```

---

## 🧪 Paso 8: Probar el Login

1. Abre el navegador en `http://localhost:5173`
2. Ve a la página de login
3. Click en **"Continuar con Google"**
4. Autoriza la aplicación
5. Deberías ser redirigido al dashboard

---

## ✅ Verificación

Si todo está bien configurado:

- ✅ El botón de Google aparece en la página de login
- ✅ Al hacer click, te redirige a Google
- ✅ Después de autorizar, vuelves a `/auth/callback`
- ✅ Luego te redirige al `/dashboard`
- ✅ En la consola del backend verás: `✅ New user created from Supabase: email@example.com`
- ✅ En Supabase > Authentication > Users verás el usuario creado

---

## 🆘 Troubleshooting

### Error: "Invalid redirect URL"
**Solución**: Verifica que la URL de callback en Google Cloud Console coincida exactamente con `https://xxxxx.supabase.co/auth/v1/callback`

### Error: "Supabase is not configured"
**Solución**: Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén en el archivo `.env` del frontend

### Error: No aparece el botón de Google
**Solución**:
1. Asegúrate de haber ejecutado `npm install`
2. Reinicia el servidor de desarrollo
3. Limpia la caché del navegador

### Error: "Access to fetch blocked by CORS"
**Solución**:
1. Verifica que `FRONTEND_URL=http://localhost:5173` esté en el `.env` del backend
2. Reinicia el servidor backend

### El usuario no se crea en MongoDB
**Solución**: Revisa los logs del backend. Debería mostrar el resultado de la sincronización.

---

## 📚 Más Información

- **Guía completa de setup**: `SUPABASE_SETUP_GUIDE.md`
- **Resumen de integración**: `SUPABASE_INTEGRATION_SUMMARY.md`
- **Documentación de Supabase**: https://supabase.com/docs

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ Login con Google funcionando
- ✅ Sincronización automática con tu base de datos
- ✅ Storage listo para subir archivos
- ✅ Sistema de autenticación seguro

**Siguiente**: Continuar con la integración de Stripe, Twilio y SendGrid (Fase 3 restante)
