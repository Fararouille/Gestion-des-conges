import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = (role) => {
    switch (role) {
      case 'rh': return 'RH';
      case 'manager': return 'Manager';
      default: return 'Employe';
    }
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>FINT2</h2>
        <p className="sidebar-subtitle">Gestion des Conges</p>
        <div className="user-info-small">
          <span className="user-email">{user?.email}</span>
          <span className={`role-badge role-${user?.role}`}>{roleLabel(user?.role)}</span>
        </div>
      </div>

      <div className="sidebar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">&#9632;</span> Tableau de bord
        </NavLink>

        <NavLink to="/mes-demandes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">&#9654;</span> Mes demandes
        </NavLink>

        <NavLink to="/nouvelle-demande" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">&#10010;</span> Nouvelle demande
        </NavLink>

        {(user?.role === 'manager' || user?.role === 'rh') && (
          <NavLink to="/gestion-demandes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">&#9998;</span> Gestion demandes
          </NavLink>
        )}

        <NavLink to="/calendrier" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">&#128197;</span> Calendrier
        </NavLink>

        {user?.role === 'rh' && (
          <NavLink to="/gestion-utilisateurs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">&#9775;</span> Utilisateurs
          </NavLink>
        )}

        <NavLink to="/profil" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">&#9786;</span> Mon profil
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn-logout">
          Deconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
