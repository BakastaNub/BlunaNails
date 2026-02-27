import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  FaSpinner, FaHandSparkles, FaShoePrints, FaSearch, 
  FaCalendarAlt, FaPhoneAlt, FaEdit, FaTrashAlt, FaCheckCircle 
} from 'react-icons/fa';
import './index.css';  // o App.css si cambiaste el nombre

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygxn8nzp9RCkerywYA2Il8NSC8-dlZ7p5sfNZ-B7pv7ANlVMZcOintliGBAvAG7OC9/exec';

function App() {
  const [mode, setMode] = useState('none');
  const [booked, setBooked] = useState({});
  const [createForm, setCreateForm] = useState({
    name: '', phone: '', hands: false, feet: false, date: ''
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
      const res = await fetch(`${SCRIPT_URL}?action=getBooked`);
      const data = await res.json();
      setBooked(data || {});
    } catch (err) {
      console.error('Error cargando booked dates:', err);
    }
  };

  useEffect(() => {
    loadBookedDates();
  }, []);

  const handleDateClick = (info) => {
    const date = info.dateStr;
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
    if (!createForm.date) return setStatus('Selecciona una fecha primero');
    if (!createForm.hands && !createForm.feet) return setStatus('Selecciona al menos manos o pies');

    try {
      const payload = { action: 'create', ...createForm };
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setStatus('¡Cita reservada con éxito! 🎀');
      setCreateForm({ name: '', phone: '', hands: false, feet: false, date: '' });
      loadBookedDates();
    } catch (err) {
      console.error('Error creando cita:', err);
      setStatus('Error al crear la cita');
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
      const res = await fetch(`${SCRIPT_URL}?action=findByPhone&phone=${encodeURIComponent(phone)}`);
      const result = await res.json();

      if (result.success) {
        setSearchResult(result.booking);
        setEditForm({ hands: result.booking.hands === 'Sí', feet: result.booking.feet === 'Sí' });
      } else {
        setStatus(result.message || result.error || 'No se encontró ninguna cita');
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
    setStatus('Editando servicios...');

    try {
      const payload = {
        action: 'edit',
        phone: searchPhone.trim(),
        hands: editForm.hands,
        feet: editForm.feet
      };
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setStatus('¡Servicios actualizados correctamente! ✓');
      setIsEditing(false);
      await handleSearch({ preventDefault: () => {} });
    } catch (err) {
      console.error('Error edición:', err);
      setStatus('Error al editar la cita');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de cancelar esta cita? No se puede deshacer.')) return;

    try {
      const payload = { action: 'cancel', phone: searchPhone.trim() };
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setStatus('Cita cancelada correctamente');
      setSearchResult(null);
      loadBookedDates();
    } catch (err) {
      console.error('Error cancel:', err);
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
                <FaHandSparkles style={{ marginLeft: '8px', marginRight: '6px', fontSize: '1.3rem' }} />
                Manos (manicura)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={createForm.feet}
                  onChange={(e) => setCreateForm({ ...createForm, feet: e.target.checked })}
                />
                <FaShoePrints style={{ marginLeft: '8px', marginRight: '6px', fontSize: '1.3rem' }} />
                Pies (pedicura)
              </label>
            </div>

            <div className="form-group">
              <label>Fecha seleccionada</label>
              <div style={{ fontWeight: 'bold', color: createForm.date ? 'var(--primary)' : '#777' }}>
                {createForm.date || 'Selecciona una fecha en el calendario'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
              <button type="button" className="btn btn-secondary" onClick={loadBookedDates}>
                Refrescar disponibilidad
              </button>
              <button type="submit" className="btn btn-create">
                Confirmar Cita
              </button>
            </div>
          </form>

          {status && (
            <div className={`status-message ${status.includes('éxito') ? 'success' : status.includes('completo') || status.includes('Error') ? 'error' : 'info'}`}>
              {status}
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              dateClick={handleDateClick}
              events={Object.entries(booked).map(([date, count]) => ({
                title: `${count} cita${count !== 1 ? 's' : ''}`,
                start: date,
                color: count >= 5 ? '#f44336' : '#ff9800'
              }))}
              height={500}
              locale="es"
            />
          </div>
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
              <p><strong>Nombre:</strong> {searchResult.name}</p>
              <p><strong>Teléfono:</strong> {searchResult.phone}</p>
              
              <div style={{ 
                margin: '1.5rem 0', 
                padding: '1.4rem', 
                background: '#fff0f5', 
                borderRadius: '12px', 
                border: '1px solid #ffc1e3' 
              }}>
                <strong style={{ 
                  display: 'block', 
                  marginBottom: '1rem', 
                  fontSize: '1.1rem',
                  color: 'var(--primary-dark)'
                }}>
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

              <p><strong>Fecha:</strong> {searchResult.date}</p>

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
            <div className={`status-message ${status.includes('actualizados') || status.includes('éxito') ? 'success' : 'error'}`}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;