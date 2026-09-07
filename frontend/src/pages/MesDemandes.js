import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function MesDemandes() {
  const { api } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterStatut, setFilterStatut] = useState('tous');
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annulating, setAnnulating] = useState(null);

  useEffect(() => {
    fetchDemandes();
  }, []);

  useEffect(() => {
    if (filterStatut === 'tous') {
      setFiltered(demandes);
    } else {
      setFiltered(demandes.filter((d) => d.statut === filterStatut));
    }
  }, [demandes, filterStatut]);

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

  const handleAnnuler = async (id) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette demande ?')) return;
    setAnnulating(id);
    try {
      await api.put(`/demandes/${id}/annuler`);
      fetchDemandes();
      setSelectedDemande(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setAnnulating(null);
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
      <h1 className="page-title">Mes demandes</h1>

      <div className="filters-bar">
        <label>Filtrer par statut :</label>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="tous">Tous</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validee</option>
          <option value="refusee">Refusee</option>
          <option value="annulee">Annulee</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-message">Aucune demande trouvee</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
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
                <tr key={d._id} onClick={() => setSelectedDemande(d)} className="clickable-row">
                  <td>{typeLabel(d.type)}</td>
                  <td>{formatDate(d.dateDebut)}</td>
                  <td>{formatDate(d.dateFin)}</td>
                  <td>{d.nbJours}</td>
                  <td>{statutBadge(d.statut)}</td>
                  <td>
                    {d.statut === 'en_attente' && (
                      <button
                        className="btn-danger btn-small"
                        onClick={(e) => { e.stopPropagation(); handleAnnuler(d._id); }}
                        disabled={annulating === d._id}
                      >
                        {annulating === d._id ? '...' : 'Annuler'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selectedDemande && (
        <div className="modal-overlay" onClick={() => setSelectedDemande(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Demande details</h2>
              <button className="modal-close" onClick={() => setSelectedDemande(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Type :</strong> {typeLabel(selectedDemande.type)}
              </div>
              <div className="detail-row">
                <strong>Periode :</strong> {formatDate(selectedDemande.dateDebut)} - {formatDate(selectedDemande.dateFin)}
              </div>
              <div className="detail-row">
                <strong>Nombre de jours :</strong> {selectedDemande.nbJours}
              </div>
              <div className="detail-row">
                <strong>Statut :</strong> {statutBadge(selectedDemande.statut)}
              </div>
              {selectedDemande.commentaire && (
                <div className="detail-row">
                  <strong>Commentaire :</strong> {selectedDemande.commentaire}
                </div>
              )}
              {selectedDemande.motifRefus && (
                <div className="detail-row">
                  <strong>Motif du refus :</strong> {selectedDemande.motifRefus}
                </div>
              )}
              {selectedDemande.justificatif && (
                <div className="detail-row">
                  <strong>Justificatif :</strong>{' '}
                  <a href={`http://localhost:5001/uploads/${selectedDemande.justificatif}`} target="_blank" rel="noreferrer">
                    Ouvrir le fichier
                  </a>
                </div>
              )}
              {selectedDemande.traitePar && (
                <div className="detail-row">
                  <strong>Traite par :</strong> {selectedDemande.traitePar.email}
                </div>
              )}
              <div className="detail-row">
                <strong>Date de creation :</strong> {formatDate(selectedDemande.createdAt)}
              </div>
            </div>
            <div className="modal-footer">
              {selectedDemande.statut === 'en_attente' && (
                <button
                  className="btn-danger"
                  onClick={() => handleAnnuler(selectedDemande._id)}
                  disabled={annulating === selectedDemande._id}
                >
                  Annuler la demande
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedDemande(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesDemandes;
