import { useState, useEffect } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { 
  FaSpinner, FaHandSparkles, FaShoePrints, FaSearch, 
  FaCalendarAlt, FaPhoneAlt, FaEdit, FaTrashAlt, FaCheckCircle 
} from 'react-icons/fa';
import './index.css';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLDtQGQqWBndlZfw8hcO0Fq5EaNYRxqLZkroTlEdjni96iLM1rUBlZExYyv_Nyhvdn/exec';

function App() {
  const [mode, setMode] = useState('none');
  const [booked, setBooked] = useState({});
  const [createForm, setCreateForm] = useState({
    name: '', phone: '', hands: false, feet: false, date: '', time: ''
  });
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ hands: false, feet: false });
  const [editLoading, setEditLoading] = useState(false);

  const loadBookedDates = async () => {
    try {
      const res = await axios.get(`${SCRIPT_URL}?action=getBooked`);
      setBooked(res.data || {});
    } catch (err) {
      console.error('Error cargando booked dates:', err);
    }
  };

  useEffect(() => {
    loadBookedDates();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const handleDateClick = (info) => {
    const date = info.dateStr;
    if (date < today) {
      setStatus('No se pueden reservar fechas pasadas');
      return;
    }
    const count = booked[date] || 0;
    if (count >= 5) {
      setStatus('Este día ya está completo (máx. 5 citas)');
      return;
    }
    setCreateForm(prev => ({ ...prev, date }));
    setStatus(`Fecha seleccionada: ${date}`);
  };

  const handleCreateSubmit = async (e) => {
  e.preventDefault();
  console.log("Formulario enviado → handleCreateSubmit iniciado"); // ← Depuración 1

  if (!createForm.date) {
    setStatus('Selecciona una fecha primero');
    console.log("Falta fecha");
    return;
  }
  if (!createForm.time) {
    setStatus('Selecciona una hora');
    console.log("Falta hora");
    return;
  }
  if (!createForm.hands && !createForm.feet) {
    setStatus('Selecciona al menos manos o pies');
    console.log("Faltan servicios");
    return;
  }

  console.log("Datos a enviar:", createForm); // ← Depuración 2: qué se envía

  setStatus('Enviando reserva...');

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'create');
    formData.append('name', createForm.name.trim());
    formData.append('phone', createForm.phone.trim());
    formData.append('hands', createForm.hands ? 'true' : 'false'); // mejor formato para backend
    formData.append('feet', createForm.feet ? 'true' : 'false');
    formData.append('date', createForm.date);
    formData.append('time', createForm.time);

    console.log("URLSearchParams listo:", formData.toString()); // ← Depuración 3

    const res = await axios.post(SCRIPT_URL, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log("Respuesta del servidor:", res.data); // ← Depuración 4: qué devuelve

    if (res.data.success) {
      setStatus(`¡Cita reservada con éxito! 🎀 ID: ${res.data.id || 'generado'}`);
      setCreateForm({ name: '', phone: '', hands: false, feet: false, date: '', time: '' });
      loadBookedDates();
    } else {
      setStatus(res.data.error || 'Error desconocido al guardar');
    }
  } catch (err) {
    console.error("Error completo al crear cita:", err);
    if (err.response) {
      // Error del servidor (4xx/5xx)
      console.error("Respuesta con error:", err.response.data);
      setStatus(`Error del servidor: ${err.response.data?.error || err.message}`);
    } else if (err.request) {
      // No hubo respuesta (problema de red, CORS, timeout)
      setStatus('No se pudo conectar con el servidor. Revisa conexión o despliegue del script.');
    } else {
      setStatus('Error inesperado: ' + err.message);
    }
  }
};

  const handleSearch = async (e) => {
    e.preventDefault();
    const phone = searchPhone.trim();
    if (!phone) return setStatus('Ingresa el número de teléfono');

    setIsLoading(true);
    setStatus('');
    setSearchResult(null);
    setIsEditing(false);

    try {
      const res = await axios.get(`${SCRIPT_URL}?action=findByPhone&phone=${encodeURIComponent(phone)}`);
      const result = res.data;

      if (result.success) {
        setSearchResult(result.booking);
        setEditForm({
          hands: result.booking.hands === 'Sí',
          feet: result.booking.feet === 'Sí'
        });
        if (result.bookings?.length > 1) {
          setStatus(`Se encontraron ${result.bookings.length} citas activas. Mostrando la más reciente.`);
        }
      } else {
        setStatus(result.message || 'No se encontró ninguna cita programada');
      }
    } catch (err) {
      console.error('Error búsqueda:', err);
      setStatus('Error al consultar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    setStatus('Editando...');

    if (!editForm.hands && !editForm.feet) {
      if (window.confirm('Si desmarcas ambos servicios, se cancelará la cita. ¿Continuar?')) {
        await handleCancel();
        setEditLoading(false);
        return;
      } else {
        setEditLoading(false);
        return;
      }
    }

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'edit');
      formData.append('id', searchResult.id);           // ← Usamos ID
      formData.append('hands', editForm.hands);
      formData.append('feet', editForm.feet);

      const res = await axios.post(SCRIPT_URL, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (res.data.success) {
        setStatus('¡Servicios actualizados correctamente! ✓');
        setIsEditing(false);
        await handleSearch({ preventDefault: () => {} });
      } else {
        setStatus(res.data.error || 'No se pudo actualizar');
      }
    } catch (err) {
      console.error('Error edición:', err.response?.data || err);
      setStatus('Error al editar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de cancelar esta cita? No se puede deshacer.')) return;

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'cancel');
      formData.append('id', searchResult.id);           // ← Usamos ID

      const res = await axios.post(SCRIPT_URL, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (res.data.success) {
        setStatus('Cita cancelada correctamente');
        setSearchResult(null);
        loadBookedDates();
      } else {
        setStatus(res.data.error || 'Error al cancelar');
      }
    } catch (err) {
      console.error('Error cancel:', err.response?.data || err);
      setStatus('Error al cancelar la cita');
    }
  };

  const resetSearch = () => {
    setSearchPhone('');
    setSearchResult(null);
    setStatus('');
    setIsLoading(false);
    setIsEditing(false);
  };

  const formatTime12h = (time24) => {
    if (!time24) return 'No especificada';
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const hour12 = hour % 12 || 12;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${period}`;
  };

  return (
    <div className="container">
      <header>
        <h1>Reservas de Uñas</h1>
        <p>Manicura · Pedicura · Cuidado y estilo para tus manos y pies</p>
      </header>

      <div className="btn-group">
        <button
          className={`btn btn-create ${mode === 'create' ? 'active' : ''}`}
          onClick={() => { setMode('create'); setSearchResult(null); setStatus(''); }}
        >
          <FaCalendarAlt style={{ marginRight: '8px' }} />
          Solicitar Cita
        </button>

        <button
          className={`btn btn-search ${mode === 'search' ? 'active' : ''}`}
          onClick={() => { setMode('search'); setStatus(''); }}
        >
          <FaSearch style={{ marginRight: '8px' }} />
          Consultar mi cita
        </button>
      </div>

      {mode === 'create' && (
        <div className="card">
          <h2>Nueva reserva</h2>

          <form onSubmit={handleCreateSubmit}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ej: María García"
              />
            </div>

            <div className="form-group">
              <label>Teléfono (WhatsApp) *</label>
              <div style={{ position: 'relative' }}>
                <FaPhoneAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  required
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="Ej: 612345678"
                  type="tel"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={createForm.hands}
                  onChange={(e) => setCreateForm({ ...createForm, hands: e.target.checked })}
                />
                <FaHandSparkles style={{ marginLeft: '8px', marginRight: '6px' }} />
                Manos (manicura)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={createForm.feet}
                  onChange={(e) => setCreateForm({ ...createForm, feet: e.target.checked })}
                />
                <FaShoePrints style={{ marginLeft: '8px', marginRight: '6px' }} />
                Pies (pedicura)
              </label>
            </div>

            <div className="form-group">
              <label>Fecha seleccionada</label>
              <input type="text" value={createForm.date || 'Selecciona en el calendario'} readOnly />
            </div>

            <div className="form-group">
              <label>Hora *</label>
              <input
                type="time"
                min="09:00"
                max="20:00"
                step="1800"
                value={createForm.time}
                onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-create">
              Reservar cita
            </button>
          </form>
        </div>
      )}

      {mode === 'search' && (
        <div className="card">
          <h2>Consultar tu cita</h2>

          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label>Teléfono con el que reservaste *</label>
              <div style={{ position: 'relative' }}>
                <FaPhoneAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Ej: 612345678"
                  type="tel"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-search" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <FaSpinner className="spin" style={{ marginRight: '8px' }} />
                    Buscando...
                  </>
                ) : (
                  <>
                    <FaSearch style={{ marginRight: '8px' }} />
                    Buscar cita
                  </>
                )}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetSearch} disabled={isLoading}>
                Limpiar
              </button>
            </div>
          </form>

          {isLoading && (
            <div style={{ textAlign: 'center', margin: '3rem 0', color: 'var(--primary)' }}>
              <FaSpinner className="spin" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
              <p>Consultando tu cita...</p>
            </div>
          )}

          {searchResult && !isLoading && (
            <div className="booking-result">
              <h3>Tu reserva ({searchResult.status})</h3>
              <p><strong>ID de cita:</strong> {searchResult.id}</p>
              <p><strong>Nombre:</strong> {searchResult.name}</p>
              <p><strong>Teléfono:</strong> {searchResult.phone}</p>
              
              <div style={{ 
                margin: '1.5rem 0', 
                padding: '1.4rem', 
                background: '#fff0f5', 
                borderRadius: '12px', 
                border: '1px solid #ffc1e3' 
              }}>
                <strong style={{ display: 'block', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                  Servicios reservados:
                </strong>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <FaHandSparkles 
                      style={{ 
                        fontSize: '1.8rem', 
                        color: searchResult.hands === 'Sí' ? 'var(--primary)' : '#d1d1d1',
                        opacity: searchResult.hands === 'Sí' ? 1 : 0.6
                      }} 
                    />
                    <span style={{ 
                      fontWeight: searchResult.hands === 'Sí' ? '600' : 'normal',
                      color: searchResult.hands === 'Sí' ? 'var(--primary-dark)' : '#777'
                    }}>
                      Manicura {searchResult.hands === 'Sí' ? '✓ reservada' : 'no reservada'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <FaShoePrints 
                      style={{ 
                        fontSize: '1.8rem', 
                        color: searchResult.feet === 'Sí' ? 'var(--primary)' : '#d1d1d1',
                        opacity: searchResult.feet === 'Sí' ? 1 : 0.6
                      }} 
                    />
                    <span style={{ 
                      fontWeight: searchResult.feet === 'Sí' ? '600' : 'normal',
                      color: searchResult.feet === 'Sí' ? 'var(--primary-dark)' : '#777'
                    }}>
                      Pedicura {searchResult.feet === 'Sí' ? '✓ reservada' : 'no reservada'}
                    </span>
                  </div>
                </div>
              </div>

              <p>
                <strong>Fecha y hora:</strong> {searchResult.date}{' '}
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                  {formatTime12h(searchResult.time)}
                </span>
              </p>

              {searchResult.status === 'Programada' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(true)}
                    disabled={editLoading}
                  >
                    <FaEdit style={{ marginRight: '8px' }} />
                    Editar servicios
                  </button>
                  <button 
                    className="btn" 
                    style={{ background: '#f44336', color: 'white' }}
                    onClick={handleCancel}
                    disabled={editLoading}
                  >
                    <FaTrashAlt style={{ marginRight: '8px' }} />
                    Cancelar cita
                  </button>
                </div>
              )}

              {isEditing && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '12px' }}>
                  <h4>Editar servicios</h4>
                  <div className="checkbox-group" style={{ margin: '1rem 0' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.hands}
                        onChange={(e) => setEditForm({ ...editForm, hands: e.target.checked })}
                      />
                      <FaHandSparkles style={{ marginLeft: '8px', marginRight: '6px' }} />
                      Manos (manicura)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.feet}
                        onChange={(e) => setEditForm({ ...editForm, feet: e.target.checked })}
                      />
                      <FaShoePrints style={{ marginLeft: '8px', marginRight: '6px' }} />
                      Pies (pedicura)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setIsEditing(false)}
                      disabled={editLoading}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="btn btn-create"
                      onClick={handleEditSubmit}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <>Guardando... <FaSpinner className="spin" style={{ marginLeft: '8px' }} /></>
                      ) : (
                        <>Guardar cambios <FaCheckCircle style={{ marginLeft: '8px' }} /></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status && !searchResult && !isLoading && (
            <div className={`status-message ${status.includes('correctamente') || status.includes('éxito') ? 'success' : 'error'}`}>
              {status}
            </div>
          )}
        </div>
      )}

      {/* Calendario siempre visible */}
      <div className="card">
        <h2>Calendario de disponibilidad</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          editable={false}
          selectable={false}
          dateClick={handleDateClick}
          events={Object.entries(booked).map(([date, count]) => {
            if (date < today) return null;
            return {
              title: `${count} cita${count !== 1 ? 's' : ''}`,
              start: date,
              color: count >= 5 ? '#f44336' : '#ff9800'
            };
          }).filter(Boolean)}
          height={500}
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: ''
          }}
          dayCellClassNames={(arg) => {
            if (arg.date.toISOString().split('T')[0] < today) {
              return 'past-date';
            }
            return '';
          }}
        />
      </div>
    </div>
  );
}

export default App;