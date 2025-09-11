import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./index.css";

export default function App() {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ title: "", date: "", time: "" });

  // 🔹 Cargar citas al iniciar
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/appointments/")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Guardar cita en el backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newEvent = {
      title: formData.title,
      start: `${formData.date}T${formData.time}`,
    };

    await fetch("http://127.0.0.1:8000/api/appointments/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    });

    // Refrescar lista
    fetch("http://127.0.0.1:8000/api/appointments/")
      .then((res) => res.json())
      .then((data) => setEvents(data));

    setFormData({ title: "", date: "", time: "" });
  };

  // 🔹 Eliminar cita con click
  const handleEventClick = async (info) => {
    const confirmDelete = window.confirm(
      `¿Eliminar la cita "${info.event.title}"?`
    );
    if (!confirmDelete) return;

    const eventId = info.event.id;

    await fetch(`http://127.0.0.1:8000/api/appointments/${eventId}/`, {
      method: "DELETE",
    });

    // Refrescar lista
    fetch("http://127.0.0.1:8000/api/appointments/")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  };

  return (
    <div className="App">
      <h1>Calendario de Citas</h1>

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
