# Instrucciones del Proyecto - Paginauñas

## Descripción
Aplicación web para gestión de citas de manicura y pedicura. Permite a las clientas reservar citas, consultar disponibilidad en calendario y modificar/cancelar reservas existentes.

## Tecnologías
- **Frontend**: React 19 + Vite
- **Calendario**: FullCalendar
- **HTTP Client**: Axios
- **Backend**: Supabase Edge Functions
- **Estilos**: CSS personalizado

## Estructura deP Archivos
```
aginauñas/
├── index.html              # Entry point HTML
├── package.json            # Dependencias y scripts
├── vite.config.js          # Configuración Vite
├── eslint.config.js        # Linting
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Componente principal (lógica completa)
│   ├── index.css          # Estilos globales
│   └── Codigo.txt         # (vacío)
```

## Scripts Disponibles
```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview # Previsualizar build de producción
npm run lint    # Ejecutar ESLint
```

## Configuración
La API de Supabase está configurada en `src/App.jsx` línea 14:
```javascript
const BASE_URL = 'https://cztzqqmoxrweebqtymij.supabase.co/functions/v1/';
```

**Endpoints:**
- `getBooked` - Obtener fechas ocupadas (GET)
- `findByPhone` - Buscar citas por teléfono (GET)
- `create` - Crear nueva reserva (POST)
- `edit` - Modificar servicios de una reserva (POST)
- `cancel` - Cancelar una reserva (POST)

### Estructura de Datos

**Reserva:**
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string",
  "hands": "boolean",
  "feet": "boolean",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "status": "Programada" | "Cancelada"
}
```

### Request/Response Examples

**POST /create**
```json
// Request
{
  "name": "Ana López",
  "phone": "612345678",
  "hands": true,
  "feet": false,
  "date": "2025-01-20",
  "time": "10:00"
}

// Response
{
  "success": true,
  "id": "uuid-generado"
}
```

**GET /findByPhone?phone=612345678**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "name": "Ana López",
      "date": "2025-01-20",
      "time": "10:00",
      "hands": "Sí",
      "feet": "No",
      "status": "Programada"
    }
  ]
}
```

**POST /edit**
```json
// Request
{
  "id": "uuid-de-la-reserva",
  "hands": true,
  "feet": true
}
```

**POST /cancel**
```json
// Request
{ "id": "uuid-de-la-reserva" }
```

## Funcionalidades
1. **Nueva cita**: Seleccionar fecha en calendario, hora (09:00-20:00), servicios (manicura/pedicura), nombre y teléfono
2. **Consultar cita**: Buscar por número de teléfono
3. **Editar**: Modificar servicios de una reserva activa
4. **Cancelar**: Eliminar una reserva existente
5. **Límite**: Máximo 5 citas por día

## Dependencias
- `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`
- `axios`
- `react`, `react-dom`
- `react-icons`

## Notas
- El calendario muestra la disponibilidad (número de citas por día)
- Las fechas pasadas no son seleccionables
- Los días completos (5 citas) se marcan como "Completo"
