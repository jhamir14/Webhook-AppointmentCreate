import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./App.css";

// Configuración del backend Django
const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Formulario para crear citas
  const [appointmentData, setAppointmentData] = useState({
    title: "",
    appointmentStatus: "confirmed",
    assignedUserId: "QwJxUVksqilzJUDZf7Ct",
    calendarId: "",
    locationId: "r3UrTfNuQviYjKT9vfVz",
    contactId: "tq9Ecyu6Cpng1UkAJ5so",
    startTime: "",
    endTime: ""
  });

  // Cargar calendarios al iniciar
  useEffect(() => {
    fetchCalendars();
  }, []);

  // Cargar eventos cuando se selecciona un calendario
  useEffect(() => {
    if (selectedCalendar) {
      fetchEvents(selectedCalendar.id);
    }
  }, [selectedCalendar]);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/calendars/`);
      if (!response.ok) throw new Error('Error al cargar calendarios');
      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (err) {
      setError('Error al cargar calendarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (calendarId) => {
    try {
      setLoading(true);
      // Por ahora simulamos eventos, ya que el backend actual no tiene endpoint para eventos
      setEvents([]);
    } catch (err) {
      setError('Error al cargar eventos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarSelect = (calendar) => {
    setSelectedCalendar(calendar);
    setShowCreateForm(false);
    // Actualizar el calendarId en el formulario
    setAppointmentData(prev => ({
      ...prev,
      calendarId: calendar.id
    }));
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    
    // Validar que todos los campos estén completos
    const requiredFields = ['title', 'assignedUserId', 'calendarId', 'locationId', 'contactId', 'startTime', 'endTime'];
    const missingFields = requiredFields.filter(field => !appointmentData[field] || appointmentData[field].trim() === '');
    
    if (missingFields.length > 0) {
      alert(`Por favor completa los siguientes campos: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Sending appointment data:', appointmentData);
      
      const response = await fetch(`${API_BASE}/calendars/webhooks/calendars/appointments/api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Error al crear cita: ${response.status}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      alert('Cita creada exitosamente!');
      setShowCreateForm(false);
      setAppointmentData({
        title: "",
        appointmentStatus: "confirmed",
        assignedUserId: "",
        calendarId: selectedCalendar?.id || "",
        locationId: "",
        contactId: "",
        startTime: "",
        endTime: ""
      });
    } catch (err) {
      setError('Error al crear cita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1> Sistema de Gestión de Calendarios</h1>
      </header>

      <div className="app-container">
        {/* Sidebar con lista de calendarios */}
        <div className="sidebar">
          <h2>Calendarios Disponibles</h2>
          {loading && <p>Cargando...</p>}
          {error && <p className="error">{error}</p>}
          
          <div className="calendar-list">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className={`calendar-item ${selectedCalendar?.id === calendar.id ? 'selected' : ''}`}
                onClick={() => handleCalendarSelect(calendar)}
              >
                <h3>{calendar.name || 'Sin nombre'}</h3>
                <p>ID: {calendar.id}</p>
                <p>Estado: {calendar.status || 'N/A'}</p>
              </div>
            ))}
          </div>

          {selectedCalendar && (
            <button 
              className="create-btn"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Crear Nueva Cita
            </button>
          )}
        </div>

        {/* Contenido principal */}
        <div className="main-content">
          {selectedCalendar ? (
            <div>
              <div className="calendar-header">
                <h2> {selectedCalendar.name || 'Calendario'}</h2>
                <div className="calendar-details">
                  <p><strong>ID:</strong> {selectedCalendar.id}</p>
                  <p><strong>Estado:</strong> {selectedCalendar.status || 'N/A'}</p>
                  <p><strong>Descripción:</strong> {selectedCalendar.description || 'Sin descripción'}</p>
                </div>
              </div>

              {/* Calendario visual */}
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  height="600px"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="welcome">
              <h2>👋 Bienvenido</h2>
              <p>Selecciona un calendario de la lista para ver sus detalles y gestionar citas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear cita */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Crear Nueva Cita</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="appointment-form">
              <div className="form-group">
                <label>Título de la cita:</label>
                <input
                  type="text"
                  name="title"
                  value={appointmentData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Evento Diego"
                />
              </div>

              <div className="form-group">
                <label>Estado de la cita:</label>
                <select
                  name="appointmentStatus"
                  value={appointmentData.appointmentStatus}
                  onChange={handleInputChange}
                  required
                >
                  <option value="confirmed">Confirmada</option>
                  <option value="pending">Pendiente</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div className="form-group">
                <label>ID del usuario asignado:</label>
                <input
                  type="text"
                  name="assignedUserId"
                  value={appointmentData.assignedUserId}
                  onChange={handleInputChange}
                  required
                  placeholder="QwJxUVksqilzJUDZf7Ct"
                />
              </div>

              <div className="form-group">
                <label>ID del calendario:</label>
                <input
                  type="text"
                  name="calendarId"
                  value={appointmentData.calendarId || selectedCalendar?.id}
                  onChange={handleInputChange}
                  required
                  placeholder="S0qwWg5ToQWFxzowt4F1"
                />
              </div>

              <div className="form-group">
                <label>ID de la ubicación:</label>
                <input
                  type="text"
                  name="locationId"
                  value={appointmentData.locationId}
                  onChange={handleInputChange}
                  required
                  placeholder="r3UrTfNuQviYjKT9vfVz"
                />
              </div>

              <div className="form-group">
                <label>ID del contacto:</label>
                <input
                  type="text"
                  name="contactId"
                  value={appointmentData.contactId}
                  onChange={handleInputChange}
                  required
                  placeholder="tq9Ecyu6Cpng1UkAJ5so"
                />
              </div>

              <div className="form-group">
                <label>Hora de inicio:</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={appointmentData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hora de fin:</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={appointmentData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
