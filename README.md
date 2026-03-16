# Bluna Nail - Web de Citas

Aplicación web para la gestión de citas de manicura y pedicura del negocio **Bluna Nail**.

## 💅 Características

- **Landing Page** - Diseño elegante con galería de trabajos
- **Sistema de Citas** - Reserva online de citas
- **Gestión de Horarios** - Bloqueo automático de horas ocupadas y pasadas
- **Consulta de Citas** - Busca y modifica tus reservas por teléfono

## 🚀 Tecnologías

- **Frontend:** React + Vite
- **Backend:** Supabase Edge Functions
- **Base de Datos:** Supabase (PostgreSQL)

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/blunanail.git
cd blunanail

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## ⚙️ Configuración

1. **Supabase:** El proyecto ya está configurado con Supabase. Las Edge Functions están desplegadas.
2. **Frontend:** Configurado en `src/App.jsx` con la URL de Supabase

### Variables de Entorno

Si necesitas reconfigurar, crea un archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 📱 Uso

1. Abre la web y visualiza la landing page
2. Haz clic en "Agendar Cita"
3. Selecciona servicios (manicura/pedicura)
4. Elige fecha y hora disponible
5. Confirma tu reserva

## 📂 Estructura

```
├── src/
│   ├── App.jsx       # Componente principal
│   └── index.css     # Estilos
├── supabase/
│   └── functions/   # Edge Functions
│       ├── getBooked/
│       ├── create/
│       ├── edit/
│       ├── cancel/
│       └── findByPhone/
└── public/
    ├── Logo.jpg
    └── blunail*.png
```

## 📄 Licencia

MIT
