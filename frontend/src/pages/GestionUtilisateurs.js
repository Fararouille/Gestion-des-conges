import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function GestionUtilisateurs() {
  const { api } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('employe');
  const [formManager, setFormManager] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users?limit=200');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormRole('employe');
    setFormManager('');
    setFormError('');
    setEditingUser(null);
    setShowForm(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/users/${editingUser._id}`, {
          role: formRole,
          manager: formManager || null
        });
      } else {
        // Create new user
        if (!formEmail) {
          setFormError('Email requis');
          setFormLoading(false);
          return;
        }
        if (!formPassword || formPassword.length < 6) {
          setFormError('Le mot de passe doit contenir au moins 6 caracteres');
          setFormLoading(false);
          return;
        }
        await api.post('/users', {
          email: formEmail,
          password: formPassword,
          role: formRole,
          manager: formManager || null
        });
      }
      resetForm();
      success(editingUser ? 'Utilisateur modifie avec succes' : 'Utilisateur cree avec succes');
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur');
      error(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormManager(u.manager?._id || '');
    setShowForm(true);
  };

  const handleResetPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      setResetError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    try {
      await api.put(`/users/${resetModal._id}/reset-password`, { password: resetPassword });
      setResetModal(null);
      setResetPassword('');
      setResetError('');
      success('Mot de passe modifie avec succes');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Erreur');
      error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/toggle-active`);
      success(res.data.message || 'Statut du compte mis a jour');
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Erreur');
    }
  };

  const roleLabel = (role) => {
    const labels = { employe: 'Employe', manager: 'Manager', rh: 'RH' };
    return labels[role] || role;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Gestion des utilisateurs</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Annuler' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="form-card">
          <h2>{editingUser ? `Modifier ${editingUser.email}` : 'Creer un utilisateur'}</h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@supherman.com"
                  disabled={!!editingUser}
                  required={!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimum 6 caracteres"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Role</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="employe">Employe</option>
                  <option value="manager">Manager</option>
                  <option value="rh">RH</option>
                </select>
              </div>
              <div className="form-group">
                <label>Manager</label>
                <select value={formManager} onChange={(e) => setFormManager(e.target.value)}>
                  <option value="">Aucun</option>
                  {users.filter((u) => u.role === 'manager' || u.role === 'rh').map((u) => (
                    <option key={u._id} value={u._id}>{u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <div className="error-message">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'En cours...' : editingUser ? 'Modifier' : 'Creer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      {users.length === 0 ? (
        <p className="empty-message">Aucun utilisateur</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Conges restants</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{roleLabel(u.role)}</span></td>
                  <td>{u.manager?.email || '-'}</td>
                  <td>{u.congesRestants}</td>
                  <td>
                    <span className={`statut-badge ${u.isActive ? 'statut-validee' : 'statut-refusee'}`}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-secondary btn-small" onClick={() => handleEdit(u)}>
                      Modifier
                    </button>
                    <button className="btn-warning btn-small" onClick={() => { setResetModal(u); setResetPassword(''); setResetError(''); }}>
                      Modifier MDP
                    </button>
                    <button
                      className={u.isActive ? 'btn-danger btn-small' : 'btn-success btn-small'}
                      onClick={() => handleToggleActive(u._id)}
                    >
                      {u.isActive ? 'Desactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetModal && (
        <div className="modal-overlay" onClick={() => { setResetModal(null); setResetPassword(''); setResetError(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Modifier le mot de passe</h2>
            <p style={{ marginBottom: '12px', color: '#6b7280' }}>
              Utilisateur : <strong>{resetModal.email}</strong>
            </p>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minimum 6 caracteres"
                autoFocus
              />
            </div>
            {resetError && <div className="error-message">{resetError}</div>}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setResetModal(null); setResetPassword(''); setResetError(''); }}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleResetPassword}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionUtilisateurs;
