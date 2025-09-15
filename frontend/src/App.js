import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./index.css";

//  Configuración de la API de GoHighLevel
const GHL_API_BASE = "https://services.leadconnectorhq.com/";
const GHL_PRIVATE_TOKEN = "pit-3ff13585-dab4-4acf-b61a-aacfcd8c29fb";
const GHL_LOCATION_ID = "r3UrTfNuQviYjKT9vfVz";

export default function App() {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ title: "", date: "", time: "" });

  //  Cargar citas desde GHL al iniciar
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(
        `${GHL_API_BASE}calendars/events?locationId=${GHL_LOCATION_ID}`,
        {
          headers: {
            Authorization: `Bearer ${GHL_PRIVATE_TOKEN}`,
            "Content-Type": "application/json",
            Version: "2021-07-28", // requerido por GHL
          },
        }
      );

      if (!res.ok) throw new Error("Error al obtener citas de GHL");
      const data = await res.json();

      // Adaptar formato para FullCalendar
      const formatted = data.events.map((event) => ({
        id: event.id,
        title: event.title || "Cita sin título",
        start: event.startTime,
        end: event.endTime,
      }));

      setEvents(formatted);
    } catch (err) {
      console.error(" Error cargando eventos:", err);
    }
  };

  //  Manejar cambios en el formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  Guardar cita en GHL
  const handleSubmit = async (e) => {
    e.preventDefault();

    const startTime = `${formData.date}T${formData.time}:00Z`; // UTC ISO
    const newEvent = {
      calendarId: GHL_LOCATION_ID, // en GHL cada evento va en un calendario asociado
      title: formData.title,
      startTime,
      endTime: startTime, // aquí puedes sumar 1h o 30min si quieres duración
    };

    try {
      const res = await fetch(`${GHL_API_BASE}calendars/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_PRIVATE_TOKEN}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
        body: JSON.stringify(newEvent),
      });

      if (!res.ok) throw new Error("Error al guardar cita en GHL");

      await fetchEvents(); // refrescar lista
      setFormData({ title: "", date: "", time: "" });
    } catch (err) {
      console.error(" Error creando cita:", err);
    }
  };

  // 🔹 Eliminar cita en GHL
  const handleEventClick = async (info) => {
    const confirmDelete = window.confirm(
      `¿Eliminar la cita "${info.event.title}"?`
    );
    if (!confirmDelete) return;

    const eventId = info.event.id;

    try {
      const res = await fetch(`${GHL_API_BASE}calendars/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${GHL_PRIVATE_TOKEN}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
      });

      if (!res.ok) throw new Error("Error al eliminar cita en GHL");

      await fetchEvents(); // refrescar lista
    } catch (err) {
      console.error(" Error eliminando cita:", err);
    }
  };

  return (
    <div className="App">
      <h1> Calendario de Citas </h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="formulario">
        <input
          type="text"
          name="title"
          placeholder="Título de la cita"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        />
        <button type="submit">➕ Agregar Cita</button>
      </form>

      {/* Calendario */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />
    </div>
  );
}
