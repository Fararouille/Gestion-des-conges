import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function GestionDemandes() {
  const { user, api } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: 'tous',
    type: 'tous',
    employe: 'tous',
    dateDebut: '',
    dateFin: ''
  });
  const [refusModal, setRefusModal] = useState(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchDemandes();
  }, []);

  useEffect(() => {
    let result = [...demandes];
    if (filters.statut !== 'tous') {
      result = result.filter((d) => d.statut === filters.statut);
    }
    if (filters.type !== 'tous') {
      result = result.filter((d) => d.type === filters.type);
    }
    if (filters.employe !== 'tous') {
      result = result.filter((d) => d.user?._id === filters.employe);
    }
    if (filters.dateDebut) {
      result = result.filter((d) => new Date(d.dateFin) >= new Date(filters.dateDebut));
    }
    if (filters.dateFin) {
      result = result.filter((d) => new Date(d.dateDebut) <= new Date(filters.dateFin));
    }
    setFiltered(result);
  }, [demandes, filters]);

  const fetchDemandes = async () => {
    try {
      const res = await api.get('/demandes');
      setDemandes(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id) => {
    if (!window.confirm('Valider cette demande ?')) return;
    setProcessing(id);
    try {
      await api.put(`/demandes/${id}/valider`);
      fetchDemandes();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setProcessing(null);
    }
  };

  const handleRefuser = async () => {
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer un motif de refus');
      return;
    }
    setProcessing(refusModal);
    try {
      await api.put(`/demandes/${refusModal}/refuse`, { motifRefus });
      setRefusModal(null);
      setMotifRefus('');
      fetchDemandes();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setProcessing(null);
    }
  };

  const handleModifierStatut = async (id, newStatut) => {
    try {
      await api.put(`/demandes/${id}/modifier-statut`, { statut: newStatut });
      fetchDemandes();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

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
      <h1 className="page-title">Gestion des demandes</h1>
      <p className="page-subtitle">
        {user?.role === 'rh' ? 'Vue globale de toutes les demandes' : 'Demandes de votre equipe'}
      </p>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Statut :</label>
          <select value={filters.statut} onChange={(e) => setFilters({ ...filters, statut: e.target.value })}>
            <option value="tous">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="validee">Validee</option>
            <option value="refusee">Refusee</option>
            <option value="annulee">Annulee</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type :</label>
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="tous">Tous</option>
            <option value="CP">Conges Payes</option>
            <option value="RTT">RTT</option>
            <option value="Sans Solde">Sans Solde</option>
            <option value="Maladie">Maladie</option>
            <option value="Formation">Formation</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Employe :</label>
          <select value={filters.employe} onChange={(e) => setFilters({ ...filters, employe: e.target.value })}>
            <option value="tous">Tous</option>
            {[...new Map(demandes.filter((d) => d.user?._id).map((d) => [d.user._id, d.user])).values()].map((employee) => (
              <option key={employee._id} value={employee._id}>{employee.email}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Du :</label>
          <input type="date" value={filters.dateDebut} onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })} />
        </div>
        <div className="filter-group">
          <label>Au :</label>
          <input type="date" value={filters.dateFin} onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-message">Aucune demande trouvee</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employe</th>
                <th>Type</th>
                <th>Date debut</th>
                <th>Date fin</th>
                <th>Nb jours</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id}>
                  <td>{d.user?.email || 'N/A'}</td>
                  <td>{typeLabel(d.type)}</td>
                  <td>{formatDate(d.dateDebut)}</td>
                  <td>{formatDate(d.dateFin)}</td>
                  <td>{d.nbJours}</td>
                  <td>{statutBadge(d.statut)}</td>
                  <td className="actions-cell">
                    {d.statut === 'en_attente' && (user?.role === 'manager' || user?.role === 'rh') && (
                      <>
                        <button
                          className="btn-success btn-small"
                          onClick={() => handleValider(d._id)}
                          disabled={processing === d._id}
                        >
                          Valider
                        </button>
                        <button
                          className="btn-danger btn-small"
                          onClick={() => setRefusModal(d._id)}
                          disabled={processing === d._id}
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {user?.role === 'rh' && (
                      <select
                        className="statut-select"
                        value={d.statut}
                        onChange={(e) => handleModifierStatut(d._id, e.target.value)}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="validee">Validee</option>
                        <option value="refusee">Refusee</option>
                        <option value="annulee">Annulee</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Refus modal */}
      {refusModal && (
        <div className="modal-overlay" onClick={() => setRefusModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Motif du refus</h2>
              <button className="modal-close" onClick={() => setRefusModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Motif du refus (obligatoire)</label>
                <textarea
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                  placeholder="Indiquez la raison du refus..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setRefusModal(null)}>Annuler</button>
              <button
                className="btn-danger"
                onClick={handleRefuser}
                disabled={processing === refusModal}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionDemandes;
