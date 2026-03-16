import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSpinner, FaHandSparkles, FaShoePrints, FaSearch, 
  FaCalendarAlt, FaPhoneAlt, FaEdit, FaTrashAlt, FaCheckCircle,
  FaWhatsapp, FaInstagram, FaArrowLeft, FaClock
} from 'react-icons/fa';
import './index.css';

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CURRENT_YEAR = new Date().getFullYear();

const URLS = {
  getBooked:    `${BASE_URL}getBooked`,
  findByPhone:  `${BASE_URL}findByPhone`,
  create:       `${BASE_URL}create`,
  edit:         `${BASE_URL}edit`,
  cancel:       `${BASE_URL}cancel`,
};

function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <img src="/Logo.jpg" alt="Bluna Nail" className="landing-logo-img" />
      </header>

      <main className="landing-main">
        <p className="hero-tagline">Estilo y Elegancia</p>
        <h2 className="hero-title">Manicura & Pedicura<br/>Profesional</h2>
        <p className="hero-subtitle">
          Cuidamos tus manos y pies con los mejores productos y técnicas exclusivas para que luzcas siempre radiante.
        </p>
        
        <button className="btn-landing" onClick={() => window.location.hash = 'reservar'}>
          <FaCalendarAlt /> Agendar Cita
        </button>

        <div className="hero-services">
          <div className="service-item">
            <div className="service-icon">
              <FaHandSparkles />
            </div>
            <h3>Manicura</h3>
            <p>Cuida tus manos</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <FaShoePrints />
            </div>
            <h3>Pedicura</h3>
            <p>Pies perfectos</p>
          </div>
        </div>

        <div className="hero-gallery">
          <img src="/blunail1.png" alt="Diseño de uñas 1" />
          <img src="/blunail2.png" alt="Diseño de uñas 2" />
          <img src="/blunail3.png" alt="Diseño de uñas 3" />
        </div>

        <div className="landing-contact">
          <h3>Contáctanos</h3>
          <div className="contact-links">
            <a href="https://www.instagram.com/blunanail.es/" target="_blank" rel="noopener noreferrer" className="contact-btn instagram">
              <FaInstagram /> @blunanail.es
            </a>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; {CURRENT_YEAR} Bluna Nail. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function BookingApp() {
  const [mode, setMode] = useState('create');
  const [booked, setBooked] = useState({});
  const [loadingDates, setLoadingDates] = useState(true);
  const [createForm, setCreateForm] = useState({
    name: '', phone: '', hands: false, feet: false, date: '', time: ''
  });
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ hands: false, feet: false });
  const [editLoading, setEditLoading] = useState(false);

  const loadBookedDates = async () => {
    setLoadingDates(true);
    try {
      const res = await axios.get(URLS.getBooked);
      setBooked(res.data || {});
    } catch (err) {
      console.error('Error cargando fechas:', err);
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    loadBookedDates();
  }, []);

  const today = new Date();
  const todayStr = new Date().toLocaleDateString('en-CA');
  const currentHour = today.getHours();

  const isToday = createForm.date === todayStr;
  const bookedHoursForDate = booked[createForm.date] || {};

  const isHourDisabled = (hour) => {
    // Bloquear si ya está reservado
    if (bookedHoursForDate[hour]) return true;
    // Bloquear horas pasadas si es hoy
    if (isToday && hour <= currentHour) return true;
    return false;
  };

  const isHourDisabledForDate = (hour, bookedHours, date, hourNow) => {
    if (bookedHours[hour]) return true;
    const isTodayDate = date === todayStr;
    if (isTodayDate && hour <= hourNow) return true;
    return false;
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    
    if (!selectedDate) {
      setCreateForm(prev => ({ ...prev, date: '', time: '' }));
      setStatus('');
      return;
    }

    if (selectedDate < todayStr) {
      setStatus('No puedes seleccionar fechas pasadas');
      return;
    }

    if (selectedDate === todayStr && currentHour >= 15) {
      setStatus('Hoy no hay horarios disponibles');
      return;
    }

    // Verificar si todas las horas están ocupadas
    const bookedHours = booked[selectedDate] || {};
    const totalBooked = Object.keys(bookedHours).length;
    
    if (totalBooked >= 5) {
      setStatus('Día completo (máx. 5 citas)');
      return;
    }

    const allHours = [9, 10, 11, 12, 13, 14, 15];
    const availableHours = allHours.filter(h => !isHourDisabledForDate(h, bookedHours, selectedDate, currentHour));
    
    if (availableHours.length === 0) {
      setStatus('No hay horarios disponibles para este día');
      return;
    }

    setCreateForm(prev => ({ ...prev, date: selectedDate, time: '' }));
    setStatus('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!createForm.date) return setStatus('Selecciona una fecha');
    if (!createForm.time) return setStatus('Selecciona una hora');
    if (!createForm.hands && !createForm.feet) return setStatus('Selecciona al menos un servicio');

    setStatus('Enviando...');
    setIsLoading(true);

    try {
      const payload = {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        hands: createForm.hands,
        feet: createForm.feet,
        date: createForm.date,
        time: createForm.time,
      };

      const res = await axios.post(URLS.create, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data.success) {
        setStatus('¡Cita reservada con éxito!');
        setCreateForm({ name: '', phone: '', hands: false, feet: false, date: '', time: '' });
        loadBookedDates();
      } else {
        setStatus(res.data.error || 'Error al guardar');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error de conexión';
      setStatus(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const phone = searchPhone.trim();
    if (!phone) return setStatus('Ingresa tu teléfono');

    setIsLoading(true);
    setStatus('');
    setSearchResults([]);
    setSelectedBooking(null);
    setIsEditing(false);

    try {
      const res = await axios.get(`${URLS.findByPhone}?phone=${encodeURIComponent(phone)}`);

      if (res.data.success) {
        setSearchResults(res.data.bookings || []);
        if (res.data.bookings.length === 1) {
          const booking = res.data.bookings[0];
          setSelectedBooking(booking);
          setEditForm({ hands: booking.hands === 'Sí', feet: booking.feet === 'Sí' });
        } else if (res.data.bookings.length > 1) {
          setStatus(`${res.data.bookings.length} citas encontradas`);
        }
      } else {
        setStatus(res.data.error || 'No se encontró');
      }
    } catch {
      setStatus('Error al buscar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBooking) return;

    setEditLoading(true);

    if (!editForm.hands && !editForm.feet) {
      if (!window.confirm('Sin servicios = cancelar cita. ¿Continuar?')) {
        setEditLoading(false);
        return;
      }
      await handleCancel();
      setEditLoading(false);
      return;
    }

    try {
      const payload = { id: selectedBooking.id, hands: editForm.hands, feet: editForm.feet };
      const res = await axios.post(URLS.edit, payload, { headers: { 'Content-Type': 'application/json' } });

      if (res.data.success) {
        setStatus('Servicios actualizados');
        setIsEditing(false);
        handleSearch({ preventDefault: () => {} });
      } else {
        setStatus(res.data.error || 'Error al actualizar');
      }
    } catch {
      setStatus('Error al editar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedBooking || !window.confirm('¿Cancelar esta cita?')) return;

    try {
      const res = await axios.post(URLS.cancel, { id: selectedBooking.id }, { headers: { 'Content-Type': 'application/json' } });

      if (res.data.success) {
        setStatus('Cita cancelada');
        setSearchResults(prev => prev.filter(b => b.id !== selectedBooking.id));
        setSelectedBooking(null);
        loadBookedDates();
      } else {
        setStatus(res.data.error || 'Error al cancelar');
      }
    } catch {
      setStatus('Error al cancelar');
    }
  };

  const formatTime12h = (time24) => {
    if (!time24) return '—';
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m.padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatServices = (hands, feet) => {
    const parts = [];
    if (hands === 'Sí') parts.push('Manicura');
    if (feet === 'Sí') parts.push('Pedicura');
    return parts.length ? parts.join(' + ') : '—';
  };

  return (
    <div className="container">
      <button className="btn-back" onClick={() => window.location.hash = ''}>
        <FaArrowLeft /> Volver
      </button>

      <header className="booking-header">
        <h1>Bluna Nail</h1>
        <p>Reserva tu cita</p>
      </header>

      <div className="btn-group">
        <button 
          className={mode === 'create' ? 'active' : ''} 
          onClick={() => { setMode('create'); setStatus(''); setSearchResults([]); setSelectedBooking(null); }}
        >
          <FaCalendarAlt /> Nueva Cita
        </button>
        <button 
          className={mode === 'search' ? 'active' : ''} 
          onClick={() => { setMode('search'); setStatus(''); }}
        >
          <FaSearch /> Mi Cita
        </button>
      </div>

      {mode === 'create' && (
        <div className="card">
          <h2>Nueva Reserva</h2>
          <form onSubmit={handleCreateSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input 
                required 
                value={createForm.name} 
                onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                placeholder="Tu nombre"
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input 
                required 
                type="tel" 
                value={createForm.phone} 
                onChange={e => setCreateForm({...createForm, phone: e.target.value})} 
                placeholder="612 345 678"
              />
            </div>

            <div className="checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={createForm.hands} 
                  onChange={e => setCreateForm({...createForm, hands: e.target.checked})} 
                /> 
                Manicura
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={createForm.feet} 
                  onChange={e => setCreateForm({...createForm, feet: e.target.checked})} 
                /> 
                Pedicura
              </label>
            </div>

            <div className="form-group">
              <label>Fecha {loadingDates && <span className="loading-text">(Cargando...)</span>}</label>
              <div className="date-input-wrapper">
                <input 
                  type="date"
                  min={todayStr}
                  value={createForm.date}
                  onChange={handleDateChange}
                  disabled={loadingDates}
                />
                <FaCalendarAlt className="date-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaClock style={{ marginRight: 5 }} />
                Hora {isToday && currentHour >= 9 ? `(Desde las ${currentHour + 1}h)` : '9:00 - 15:00'}
              </label>
              <select 
                value={createForm.time} 
                onChange={e => setCreateForm({...createForm, time: e.target.value})} 
                required
                disabled={!createForm.date || loadingDates}
              >
                <option value="">Selecciona hora</option>
                <option value="09:00" disabled={isHourDisabled(9)}>
                  9:00 {isHourDisabled(9) ? '❌' : '✓'}
                </option>
                <option value="10:00" disabled={isHourDisabled(10)}>
                  10:00 {isHourDisabled(10) ? '❌' : '✓'}
                </option>
                <option value="11:00" disabled={isHourDisabled(11)}>
                  11:00 {isHourDisabled(11) ? '❌' : '✓'}
                </option>
                <option value="12:00" disabled={isHourDisabled(12)}>
                  12:00 {isHourDisabled(12) ? '❌' : '✓'}
                </option>
                <option value="13:00" disabled={isHourDisabled(13)}>
                  13:00 {isHourDisabled(13) ? '❌' : '✓'}
                </option>
                <option value="14:00" disabled={isHourDisabled(14)}>
                  14:00 {isHourDisabled(14) ? '❌' : '✓'}
                </option>
                <option value="15:00" disabled={isHourDisabled(15)}>
                  15:00 {isHourDisabled(15) ? '❌' : '✓'}
                </option>
              </select>
              {createForm.date && (
                <p className="hours-info">
                  ✓ Disponible · ❌ Occupado/Pasado
                </p>
              )}
            </div>

            {status && (
              <div className={`status-message ${status.includes('éxito') ? 'success' : 'error'}`}>
                {status}
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? <FaSpinner className="spin" /> : 'Reservar Cita'}
            </button>
          </form>
        </div>
      )}

      {mode === 'search' && (
        <div className="card">
          <h2>Consultar Cita</h2>
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label>Teléfono</label>
              <input 
                type="tel" 
                value={searchPhone} 
                onChange={e => setSearchPhone(e.target.value)} 
                placeholder="Teléfono de la reserva"
              />
            </div>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="booking-result">
              {searchResults.length > 1 ? (
                <>
                  <h3>{searchResults.length} citas activas</h3>
                  {searchResults.map(booking => (
                    <div 
                      key={booking.id}
                      style={{ 
                        padding: '0.8rem', 
                        background: selectedBooking?.id === booking.id ? 'white' : 'rgba(255,255,255,0.5)', 
                        borderRadius: 8, 
                        marginBottom: '0.5rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setEditForm({ hands: booking.hands === 'Sí', feet: booking.feet === 'Sí' });
                      }}
                    >
                      <p><strong>{booking.date}</strong> - {formatTime12h(booking.time)}</p>
                      <p>{formatServices(booking.hands, booking.feet)}</p>
                    </div>
                  ))}
                </>
              ) : (
                selectedBooking && (
                  <>
                    <h3>Tu Reserva</h3>
                    <p><strong>Fecha:</strong> {selectedBooking.date}</p>
                    <p><strong>Hora:</strong> {formatTime12h(selectedBooking.time)}</p>
                    <p><strong>Servicios:</strong> {formatServices(selectedBooking.hands, selectedBooking.feet)}</p>

                    {selectedBooking.status === 'Programada' && (
                      <div className="booking-actions">
                        <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                          <FaEdit /> Editar
                        </button>
                        <button className="btn-danger" onClick={handleCancel}>
                          <FaTrashAlt /> Cancelar
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: 8 }}>
                        <div className="checkbox-group">
                          <label>
                            <input type="checkbox" checked={editForm.hands} onChange={e => setEditForm({...editForm, hands: e.target.checked})} /> 
                            Manicura
                          </label>
                          <label>
                            <input type="checkbox" checked={editForm.feet} onChange={e => setEditForm({...editForm, feet: e.target.checked})} /> 
                            Pedicura
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                          <button className="btn-submit" onClick={handleEditSubmit} disabled={editLoading}>
                            {editLoading ? <FaSpinner className="spin" /> : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          )}

          {status && !searchResults.length && (
            <div className="status-message error">{status}</div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      setShowBooking(window.location.hash === '#reservar');
    };
    
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return showBooking ? <BookingApp /> : <Landing />;
}

export default App;
