import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, api } = useAuth();
  const [stats, setStats] = useState({ total: 0, enAttente: 0, validees: 0, refusees: 0 });
  const [recentDemandes, setRecentDemandes] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/demandes');
        const demandes = res.data;

        setStats({
          total: demandes.length,
          enAttente: demandes.filter((d) => d.statut === 'en_attente').length,
          validees: demandes.filter((d) => d.statut === 'validee').length,
          refusees: demandes.filter((d) => d.statut === 'refusee').length
        });

        setRecentDemandes(demandes.slice(0, 5));

        // Upcoming validated leaves
        const now = new Date();
        const upcoming = demandes
          .filter((d) => d.statut === 'validee' && new Date(d.dateFin) >= now)
          .slice(0, 5);
        setUpcomingLeaves(upcoming);
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  const statutBadge = (statut) => {
    const labels = {
      en_attente: 'En attente',
      validee: 'Validee',
      refusee: 'Refusee',
      annulee: 'Annulee'
    };
    return <span className={`statut-badge statut-${statut}`}>{labels[statut]}</span>;
  };

  const typeLabel = (type) => {
    const labels = { CP: 'Conges Payes', RTT: 'RTT', 'Sans Solde': 'Sans Solde', Maladie: 'Maladie', Formation: 'Formation' };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="page">
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-subtitle">Bienvenue, {user?.email}</p>

      <div className="stats-grid">
        <div className="stat-card stat-conges">
          <div className="stat-number">{user?.congesRestants || 0}</div>
          <div className="stat-label">Jours de conges restants</div>
        </div>
        <div className="stat-card stat-attente">
          <div className="stat-number">{stats.enAttente}</div>
          <div className="stat-label">Demandes en attente</div>
        </div>
        <div className="stat-card stat-valide">
          <div className="stat-number">{stats.validees}</div>
          <div className="stat-label">Demandes validees</div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total demandes</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Demandes recentes</h2>
          {recentDemandes.length === 0 ? (
            <p className="empty-message">Aucune demande pour le moment</p>
          ) : (
            <div className="demandes-list">
              {recentDemandes.map((d) => (
                <div key={d._id} className="demande-item">
                  <div className="demande-info">
                    <strong>{typeLabel(d.type)}</strong>
                    <span>{formatDate(d.dateDebut)} - {formatDate(d.dateFin)}</span>
                    <span>{d.nbJours} jour(s)</span>
                  </div>
                  <div>{statutBadge(d.statut)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Prochains conges valides</h2>
          {upcomingLeaves.length === 0 ? (
            <p className="empty-message">Aucun conge a venir</p>
          ) : (
            <div className="demandes-list">
              {upcomingLeaves.map((d) => (
                <div key={d._id} className="demande-item">
                  <div className="demande-info">
                    <strong>{typeLabel(d.type)}</strong>
                    <span>{d.user?.email}</span>
                    <span>{formatDate(d.dateDebut)} - {formatDate(d.dateFin)}</span>
                  </div>
                  <div><span className="statut-badge statut-validee">{d.nbJours} jour(s)</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
