import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MesDemandes from './pages/MesDemandes';
import NouvelleDemande from './pages/NouvelleDemande';
import GestionDemandes from './pages/GestionDemandes';
import CalendrierGlobal from './pages/CalendrierGlobal';
import GestionUtilisateurs from './pages/GestionUtilisateurs';
import Profil from './pages/Profil';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/" element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />
            <Route path="/mes-demandes" element={
              <PrivateRoute><MesDemandes /></PrivateRoute>
            } />
            <Route path="/nouvelle-demande" element={
              <PrivateRoute><NouvelleDemande /></PrivateRoute>
            } />
            <Route path="/gestion-demandes" element={
              <PrivateRoute><GestionDemandes /></PrivateRoute>
            } />
            <Route path="/calendrier" element={
              <PrivateRoute><CalendrierGlobal /></PrivateRoute>
            } />
            <Route path="/gestion-utilisateurs" element={
              <PrivateRoute><GestionUtilisateurs /></PrivateRoute>
            } />
            <Route path="/profil" element={
              <PrivateRoute><Profil /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
