# NAD Constructora — Sitio Web Oficial

Sitio web corporativo con panel de administración CMS integrado para gestión de proyectos, textos, imágenes y configuración.

## Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** SQLite 3 (persistida en Railway Volume)
- **Frontend:** HTML5 + CSS Vanilla + JavaScript
- **Deploy:** Railway

---

## Desarrollo Local

### Requisitos
- Node.js 18 o superior

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar el servidor en modo desarrollo
npm run dev
```

El sitio estará disponible en: **http://localhost:3000**  
Panel de administración: **http://localhost:3000/gestion-nad-2026**

### Credenciales del panel (desarrollo local)
- Usuario: `admin`
- Contraseña: `nad2026` *(cambiar en producción vía variables de entorno)*

---

## Deploy en Railway

### 1. Variables de entorno requeridas en Railway

| Variable | Descripción | Ejemplo |
|---|---|---|
| `SESSION_SECRET` | Clave secreta para sesiones | `una-clave-muy-larga-y-segura-2026` |
| `ADMIN_PASSWORD` | Contraseña del panel admin | `MiPasswordSeguro!` |
| `ADMIN_PATH` | Ruta secreta del panel | `gestion-nad-2026` |
| `PORT` | Puerto (Railway lo inyecta automáticamente) | `3000` |

### 2. Volumen persistente (OBLIGATORIO)

La base de datos y los archivos subidos se guardan en `/data`. En Railway hay que crear un volumen:

1. En Railway → tu proyecto → **Add Volume**
2. Nombre del volumen: `nad-data`
3. Mount path: `/app/data`

Esto asegura que los datos no se pierdan cuando el servicio se reinicia.

### 3. Pasos para hacer el deploy

```bash
# 1. Inicializar Git en la carpeta (si no está inicializado)
git init

# 2. Agregar todos los archivos
git add .

# 3. Commit inicial
git commit -m "feat: sitio NAD Constructora v1.0"

# 4. Subir a GitHub
git remote add origin https://github.com/TU_USUARIO/nad-constructora.git
git push -u origin main
```

Luego en Railway:
1. **New Project → Deploy from GitHub repo**
2. Seleccionar el repositorio `nad-constructora`
3. Configurar las variables de entorno del paso 1
4. Crear el volumen persistente del paso 2
5. Railway detecta automáticamente el `railway.json` y despliega

---

## Estructura del Proyecto

```
nad/
├── server.js           # Servidor principal (Express + SQLite)
├── index.html          # Página pública principal
├── styles.css          # Estilos globales
├── script.js           # JavaScript del sitio público
├── nad.png             # Logo NAD Constructora
├── package.json        # Dependencias
├── railway.json        # Configuración de Railway
├── admin/
│   ├── index.html      # Panel de administración
│   └── login.html      # Login del panel
├── public/
│   └── uploads/        # Imágenes subidas (ignorado en Git)
└── data/
    ├── nad.db          # Base de datos SQLite (ignorado en Git)
    └── uploads/        # Uploads alternativos (ignorado en Git)
```

---

## Panel de Administración

El panel permite gestionar sin tocar código:

- 📁 **Proyectos** — Agregar, editar, eliminar y controlar visibilidad
- ✏️ **Textos** — Editar todos los textos del sitio (hero, servicios, contacto, etc.)
- 🎨 **Diseño** — Tipografía, colores y estilos
- 🖼️ **Imágenes** — Subir imágenes del hero y proyectos
- ⚙️ **Configuración** — Cambiar contraseña y ruta del panel
