import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TYPE_COLORS = {
  CP: '#3b82f6',
  RTT: '#8b5cf6',
  'Sans Solde': '#f59e0b',
  Maladie: '#ef4444',
  Formation: '#10b981'
};

const JOURS_MOIS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS_NOMS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

// French public holidays (simplified)
const JOURS_FERIES = {
  '01-01': 'Jour de l\'An',
  '05-01': 'Fete du Travail',
  '05-08': 'Victoire 1945',
  '07-14': 'Fete Nationale',
  '08-15': 'Assomption',
  '11-01': 'Toussaint',
  '11-11': 'Armistice',
  '12-25': 'Noel'
};

function CalendrierGlobal() {
  const { user, api } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    fetchDemandes();
  }, [showTeam]);

  const fetchDemandes = async () => {
    try {
      const res = await api.get(`/calendar${showTeam ? '?equipe=true' : ''}`);
      setDemandes(res.data);
    } catch (error) {
      console.error('Erreur chargement calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getDemandesForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    return demandes.filter((d) => {
      const debut = new Date(d.dateDebut);
      debut.setHours(0, 0, 0, 0);
      const fin = new Date(d.dateFin);
      fin.setHours(0, 0, 0, 0);
      return date >= debut && date <= fin;
    });
  };

  const isJourFerie = (day) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const key = `${month}-${dayStr}`;
    return JOURS_FERIES[key] || null;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  // Empty cells for days before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<td key={`empty-${i}`} className="cal-cell empty"></td>);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDemandes = getDemandesForDay(d);
    const ferie = isJourFerie(d);
    const isToday = new Date().getDate() === d &&
      new Date().getMonth() === month &&
      new Date().getFullYear() === year;

    days.push(
      <td key={d} className={`cal-cell ${isToday ? 'today' : ''} ${ferie ? 'ferie' : ''}`}>
        <div className="cal-day-number">{d}</div>
        {ferie && <div className="cal-ferie">{ferie}</div>}
        {dayDemandes.map((dem, idx) => (
          <div
            key={idx}
            className="cal-event"
            style={{ backgroundColor: TYPE_COLORS[dem.type] || '#888' }}
            title={`${dem.user?.email}: ${dem.type} (${dem.nbJours}j)`}
          >
            {dem.type}
          </div>
        ))}
      </td>
    );
  }

  // Build rows
  const rows = [];
  let cells = [];
  days.forEach((cell, i) => {
    cells.push(cell);
    if ((i + 1) % 7 === 0 || i === days.length - 1) {
      rows.push(<tr key={`row-${i}`}>{cells}</tr>);
      cells = [];
    }
  });

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="page">
      <h1 className="page-title">Calendrier global</h1>

      <div className="calendar-nav">
        <button className="btn-secondary" onClick={prevMonth}>&laquo; Precedent</button>
        <h2>{MOIS_NOMS[month]} {year}</h2>
        <button className="btn-secondary" onClick={nextMonth}>Suivant &raquo;</button>
      </div>

      {user?.role === 'manager' && (
        <label className="filter-group">
          <input type="checkbox" checked={showTeam} onChange={(e) => setShowTeam(e.target.checked)} />
          Afficher les conges de mon equipe
        </label>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }}></span>
            {type}
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="calendar-table">
          <thead>
            <tr>
              {JOURS_MOIS.map((jour) => (
                <th key={jour}>{jour}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CalendrierGlobal;
