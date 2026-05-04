# 🚀 VidaCRM - Guía de Despliegue en Producción

Esta guía te explica paso a paso cómo desplegar VidaCRM en la nube. Elegí la opción que mejor se adapte a tu nivel técnico y presupuesto.

---

## 📋 Arquitectura de Schema Dual

VidaCRM usa **dos archivos de schema de Prisma** para soportar ambos entornos:

| Archivo | Provider | Uso |
|---------|----------|-----|
| `prisma/schema.prisma` | SQLite | Desarrollo local |
| `prisma/schema.prod.prisma` | PostgreSQL | Producción (Vercel, Railway, Docker) |

**Esto es necesario porque Prisma no permite usar variables de entorno en el campo `provider`.**

Cuando modifiques los modelos de la base de datos:
1. Editá `prisma/schema.prisma` (el de SQLite)
2. Ejecutá `bash scripts/sync-schemas.sh` para copiar los cambios al schema de producción
3. Ambos archivos siempre deben tener los mismos modelos, solo cambia el `provider`

---

## 📋 Requisitos Previos

Antes de empezar, necesitás:

1. **Una cuenta de GitHub** (gratuita) — [github.com/signup](https://github.com/signup)
2. **El código de VidaCRM** subido a un repositorio de GitHub
3. **5 minutos** de tu tiempo

### Subir el código a GitHub

Si aún no subiste el código a GitHub:

```bash
# Inicializar repositorio (si no existe)
git init
git add .
git commit -m "VidaCRM listo para desplegar"

# Crear el repositorio en GitHub y conectar
git remote add origin https://github.com/TU-USUARIO/vidacrm.git
git branch -M main
git push -u origin main
```

---

## 🅰️ Opción A: Vercel + Supabase (GRATIS, recomendado)

La opción más popular y 100% gratuita para proyectos pequeños. Vercel hosting + Supabase base de datos.

### Paso 1: Crear base de datos en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear una cuenta gratuita
2. Hacer clic en **"New Project"**
3. Completar:
   - **Name**: `vidacrm-db`
   - **Database Password**: Elegir una contraseña segura y **anotarla**
   - **Region**: Elegir la más cercana (ej: South America - São Paulo)
4. Esperar ~2 minutos a que se cree el proyecto
5. Ir a **Settings → Database** (en el menú izquierdo)
6. Buscar **"Connection string"** → seleccionar **"URI"**
7. Copiar la URL que se ve así:
   ```
   postgresql://postgres.xxxxx:[TU-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
8. **Reemplazar** `[TU-PASSWORD]` con la contraseña del paso 3

### Paso 2: Desplegar en Vercel

1. Ir a [vercel.com](https://vercel.com) y crear una cuenta (mejor con GitHub)
2. Hacer clic en **"Add New → Project"**
3. Seleccionar el repositorio **vidacrm** de tu lista
4. En **"Configure Project"**, expandir **"Environment Variables"** y agregar:

   | Nombre | Valor |
   |--------|-------|
   | `DATABASE_URL` | `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres` |
   | `NEXTAUTH_SECRET` | (generar con el comando de abajo) |
   | `NEXTAUTH_URL` | `https://tu-app.vercel.app` (poner la URL que Vercel te asigne) |

5. Generar el `NEXTAUTH_SECRET`:
   ```bash
   # En tu terminal local:
   openssl rand -base64 32
   # Copiar el resultado y pegarlo como valor
   ```

6. Hacer clic en **"Deploy"**
7. Esperar ~3 minutos a que se complete el build
8. ¡Listo! Vercel te dará la URL de tu aplicación

> **Nota**: El `vercel-build` script en `package.json` ya usa automáticamente `schema.prod.prisma` (PostgreSQL). No necesitás hacer nada extra.

### Paso 3: Poblar la base de datos

1. Esperá a que el deploy se complete
2. Ejecutá desde tu terminal local:
   ```bash
   curl -X POST https://TU-APP.vercel.app/api/seed
   ```
3. Si todo sale bien, vas a ver un JSON con los datos creados

### Paso 4: Iniciar sesión

1. Ir a la URL de tu aplicación en Vercel
2. Iniciar sesión con:
   - **Email**: `admin@vidacrm.com`
   - **Contraseña**: `admin123`

⚠️ **¡Cambiar la contraseña después del primer inicio de sesión!**

### Paso 5: Configurar dominio personalizado (opcional)

1. En Vercel Dashboard → tu proyecto → **Settings → Domains**
2. Agregar tu dominio personalizado
3. Actualizar `NEXTAUTH_URL` en las variables de entorno con el nuevo dominio
4. Hacer **Redeploy** para que tome el cambio

---

## 🅱️ Opción B: Railway (GRATIS, la más simple)

Railway es la opción más fácil — base de datos y hosting en un solo lugar.

### Paso 1: Crear cuenta y proyecto

1. Ir a [railway.app](https://railway.app) y crear una cuenta con GitHub
2. Hacer clic en **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Elegir el repositorio **vidacrm**

### Paso 2: Agregar base de datos PostgreSQL

1. En el proyecto de Railway, hacer clic en **"+ New"**
2. Seleccionar **"Database → Add PostgreSQL"**
3. Railway crea la base de datos automáticamente
4. Hacer clic en la base de datos PostgreSQL → **"Variables"**
5. Copiar la variable `DATABASE_URL`

### Paso 3: Configurar variables de entorno

1. Hacer clic en el servicio de VidaCRM (tu app)
2. Ir a **"Variables"** y agregar:

   | Nombre | Valor |
   |--------|-------|
   | `DATABASE_URL` | (pegar la URL de PostgreSQL del paso anterior) |
   | `NEXTAUTH_SECRET` | (generar con `openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://vidacrm-production.up.railway.app` (Railway te da esta URL) |

> **Nota**: Railway ejecuta automáticamente `npm run build`, que usa el schema de SQLite por defecto. Para PostgreSQL, necesitás configurar el **Build Command** personalizado:
> 
> En Railway → tu servicio → Settings → Build Command:
> ```
> npx prisma generate --schema prisma/schema.prod.prisma && next build
> ```

### Paso 4: Desplegar

1. Railway detecta automáticamente que es Next.js
2. El deploy arranca al guardar las variables
3. Esperar ~3 minutos

### Paso 5: Poblar la base de datos

```bash
curl -X POST https://TU-APP.up.railway.app/api/seed
```

3. Iniciar sesión con `admin@vidacrm.com` / `admin123`

---

## 🅲️ Opción C: VPS con Docker (avanzado)

Para usuarios técnicos que quieren control total. Funciona con cualquier VPS (DigitalOcean, Hetzner, Linode, etc.).

### Requisitos

- Un VPS con al menos **1GB RAM** y **Ubuntu 22.04+**
- Acceso SSH al servidor
- Dominio apuntando al servidor (opcional pero recomendado)

### Paso 1: Preparar el servidor

```bash
# Conectarse por SSH
ssh root@TU-IP

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install -y docker-compose-plugin

# Instalar Nginx (reverse proxy)
apt install -y nginx certbot python3-certbot-nginx
```

### Paso 2: Subir el código al servidor

```bash
# En tu máquina local
# Opción 1: Clonar desde GitHub
ssh root@TU-IP "git clone https://github.com/TU-USUARIO/vidacrm.git /opt/vidacrm"

# Opción 2: Con rsync
rsync -avz --exclude node_modules --exclude .next ./ root@TU-IP:/opt/vidacrm/
```

### Paso 3: Configurar variables de entorno

```bash
# En el servidor
cd /opt/vidacrm

# Crear archivo .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://vidacrm:PASSWORD_SEGURA@db:5432/vidacrm
NEXTAUTH_SECRET=GENERAR_CON_OPENSSL_RAND_BASE64_32
NEXTAUTH_URL=https://tudominio.com
EOF

# Generar secreto seguro
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
# Copiar el resultado y actualizar el .env
```

### Paso 4: Crear docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: vidacrm
      POSTGRES_PASSWORD: PASSWORD_SEGURA
      POSTGRES_DB: vidacrm
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vidacrm"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://vidacrm:PASSWORD_SEGURA@db:5432/vidacrm
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}

volumes:
  pgdata:
EOF
```

### Paso 5: Construir y ejecutar

```bash
# Construir la imagen (usa automáticamente schema.prod.prisma)
docker compose build

# Iniciar servicios
docker compose up -d

# Verificar que están corriendo
docker compose ps

# Ver logs
docker compose logs -f app
```

### Paso 6: Poblar la base de datos

```bash
# Esperar ~30 segundos a que la app esté lista, luego:
curl -X POST http://localhost:3000/api/seed
```

### Paso 7: Configurar Nginx + SSL

```bash
# Crear configuración de Nginx
cat > /etc/nginx/sites-available/vidacrm << 'EOF'
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Habilitar sitio
ln -s /etc/nginx/sites-available/vidacrm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Instalar certificado SSL (requiere dominio apuntando al servidor)
certbot --nginx -d tudominio.com

# Actualizar NEXTAUTH_URL en .env
# NEXTAUTH_URL=https://tudominio.com
docker compose restart app
```

---

## 🔧 Migraciones de Base de Datos

Cuando cambies el schema de Prisma, necesitás sincronizar ambos archivos y aplicar los cambios:

### Sincronizar schemas

```bash
# Después de editar prisma/schema.prisma, ejecutar:
bash scripts/sync-schemas.sh
```

### Aplicar cambios en desarrollo (SQLite)

```bash
bun run db:push
```

### Aplicar cambios en producción (PostgreSQL)

```bash
# Opción 1: Push directo (recomendado para empezar)
DATABASE_URL="tu-url-postgresql" bun run db:push:prod

# Opción 2: Con migraciones (recomendado para producción estable)
DATABASE_URL="tu-url-postgresql" bun run db:migrate:deploy:prod
```

### Crear una migración nueva

```bash
# 1. Editar prisma/schema.prisma
# 2. Sincronizar:
bash scripts/sync-schemas.sh
# 3. Crear migración:
DATABASE_URL="tu-url-postgresql" bun run db:migrate:create nombre_de_la_migracion
```

---

## 🔐 Seguridad en Producción

### Checklist de seguridad

- [ ] Cambiar `NEXTAUTH_SECRET` a un valor aleatorio fuerte (generar con `openssl rand -base64 32`)
- [ ] Cambiar la contraseña del admin (`admin123`) después del primer login
- [ ] Verificar que `.env` NO esté en el repositorio de Git
- [ ] Usar HTTPS (certificado SSL) — automático en Vercel/Railway
- [ ] Configurar `NEXTAUTH_URL` con la URL correcta de producción
- [ ] Proteger la ruta `/api/seed` después de inicializar datos

---

## 🐛 Solución de Problemas

### Error: "Prisma Client could not be generated"

```bash
# Regenerar el cliente para desarrollo
bun run db:generate

# Regenerar para producción
bun run db:generate:prod
```

### Error: "Can't reach database server"

- Verificar que `DATABASE_URL` es correcta
- Verificar que la base de datos está activa (Supabase/Railway dashboard)
- Verificar que la IP está permitida (Supabase permite todas por defecto)
- En Docker: usar `db` como host en lugar de `localhost`

### Error: "NEXTAUTH_SECRET is required"

- Verificar que la variable de entorno esté configurada en Vercel/Railway
- Regenerar con: `openssl rand -base64 32`

### Error: "P1001: Can't reach database server at ...:5432"

- En Docker: usar el nombre del servicio (`db`) en lugar de `localhost`
  - ❌ `postgresql://user:pass@localhost:5432/db`
  - ✅ `postgresql://user:pass@db:5432/db`
- En Vercel/Railway: verificar que la URL de conexión sea correcta

### La aplicación carga pero no hay datos

```bash
# Poblar la base de datos
curl -X POST https://TU-URL/api/seed
```

### Build falla en Vercel

1. Verificar que `DATABASE_URL` esté configurada (apunte a PostgreSQL)
2. Ver logs en Vercel Dashboard → tu proyecto → Deployments → ver logs
3. El script `vercel-build` usa automáticamente `schema.prod.prisma`

### Los modelos están desincronizados entre dev y prod

```bash
# Sincronizar los schemas
bash scripts/sync-schemas.sh
```

---

## 📊 Comparación de Opciones

| Característica | Vercel + Supabase | Railway | VPS + Docker |
|----------------|-------------------|---------|--------------|
| **Costo** | Gratis (hasta límites) | Gratis ($5/mes crédito) | ~$5-10/mes |
| **Dificultad** | ⭐⭐ Fácil | ⭐ Muy fácil | ⭐⭐⭐⭐ Avanzado |
| **Base de datos** | Supabase (500MB gratis) | Incluida (1GB gratis) | PostgreSQL propio |
| **SSL/HTTPS** | Automático | Automático | Manual (Certbot) |
| **Dominio custom** | Gratis | Gratis | Requiere configuración |
| **Escalabilidad** | Muy buena | Buena | Manual |
| **Control total** | No | No | Sí |
| **Ideal para** | Principiantes | Principiantes | Usuarios técnicos |

---

## 📁 Estructura de Archivos Relevantes

```
vidacrm/
├── prisma/
│   ├── schema.prisma          # SQLite (desarrollo local)
│   └── schema.prod.prisma     # PostgreSQL (producción)
├── scripts/
│   ├── build-prod.sh          # Build para producción
│   └── sync-schemas.sh        # Sincronizar schemas
├── Dockerfile                 # Para despliegue con Docker
├── docker-compose.yml         # (crear en el servidor)
├── vercel.json                # Config para Vercel
├── .env.example               # Plantilla de variables de entorno
└── DEPLOY.md                  # Esta guía
```
