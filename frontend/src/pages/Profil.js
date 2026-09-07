import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Profil() {
  const { user, api } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roleLabel = (role) => {
    const labels = { employe: 'Employe', manager: 'Manager', rh: 'RH' };
    return labels[role] || role;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('Tous les champs sont requis');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Mot de passe modifie avec succes');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Mon profil</h1>

      <div className="profil-grid">
        {/* Account info card */}
        <div className="form-card">
          <h2>Informations du compte</h2>
          <div className="profil-info">
            <div className="profil-field">
              <span className="profil-label">Email</span>
              <span className="profil-value">{user?.email}</span>
            </div>
            <div className="profil-field">
              <span className="profil-label">Role</span>
              <span className="profil-value">
                <span className={`role-badge role-${user?.role}`}>{roleLabel(user?.role)}</span>
              </span>
            </div>
            <div className="profil-field">
              <span className="profil-label">Manager</span>
              <span className="profil-value">{user?.manager?.email || 'Non assigne'}</span>
            </div>
            <div className="profil-field">
              <span className="profil-label">Conges restants</span>
              <span className="profil-value profil-conges">{user?.congesRestants} jour(s)</span>
            </div>
            <div className="profil-field">
              <span className="profil-label">Date de creation</span>
              <span className="profil-value">{formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Change password form */}
        <div className="form-card">
          <h2>Changer le mot de passe</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mot de passe actuel"
              />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caracteres"
              />
            </div>
            <div className="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le nouveau mot de passe"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'En cours...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profil;
