import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Calculate business days between two dates (excluding weekends)
function calculerJoursOuvrables(dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  let jours = 0;
  const courant = new Date(debut);

  while (courant <= fin) {
    const jour = courant.getDay();
    if (jour !== 0 && jour !== 6) {
      jours++;
    }
    courant.setDate(courant.getDate() + 1);
  }
  return jours;
}

function NouvelleDemande() {
  const { user, api } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [type, setType] = useState('CP');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [justificatif, setJustificatif] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nbJoursCalcules = dateDebut && dateFin
    ? calculerJoursOuvrables(dateDebut, dateFin)
    : 0;

  const congesApres = user?.congesRestants - nbJoursCalcules;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!dateDebut || !dateFin) {
      setError('Veuillez selectionner les dates');
      return;
    }

    if (new Date(dateFin) < new Date(dateDebut)) {
      setError('La date de fin doit etre apres la date de debut');
      return;
    }

    if (nbJoursCalcules === 0) {
      setError('Aucun jour ouvrable dans cette periode');
      return;
    }

    // Check remaining days for CP and RTT
    if ((type === 'CP' || type === 'RTT' || type === 'Formation') && nbJoursCalcules > user.congesRestants) {
      setError(`Solde insuffisant. Vous avez ${user.congesRestants} jours restants, la demande est de ${nbJoursCalcules} jours`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('dateDebut', dateDebut);
      formData.append('dateFin', dateFin);
      formData.append('commentaire', commentaire);
      if (justificatif) formData.append('justificatif', justificatif);
      await api.post('/demandes', formData);
      success('Demande envoyee avec succes');
      navigate('/mes-demandes');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la creation de la demande');
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    CP: 'Conges Payes (CP)',
    RTT: 'RTT',
    'Sans Solde': 'Sans Solde',
    Maladie: 'Maladie',
    Formation: 'Formation'
  };

  return (
    <div className="page">
      <h1 className="page-title">Nouvelle demande de conge</h1>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type de conge</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de debut</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Date de fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Commentaire (optionnel)</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Justificatif (optionnel, JPG, PNG ou PDF, 5 Mo maximum)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setJustificatif(e.target.files[0] || null)}
            />
          </div>

          <div className="info-box">
            <p><strong>Jours ouvrables calcules :</strong> {nbJoursCalcules} jour(s)</p>
            <p><strong>Conges restants :</strong> {user?.congesRestants} jour(s)</p>
            {nbJoursCalcules > 0 && (type === 'CP' || type === 'RTT' || type === 'Formation') && (
              <p className={congesApres < 0 ? 'text-danger' : ''}>
                <strong>Apres validation :</strong> {congesApres} jour(s) restant(s)
              </p>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/mes-demandes')}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NouvelleDemande;
