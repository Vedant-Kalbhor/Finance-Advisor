import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Investments from './pages/Investments';
import Goals from './pages/Goals';
import TaxPlanner from './pages/TaxPlanner';
import Chatbot from './pages/Chatbot';
import ZerodhaCallback from './pages/ZerodhaCallback';
import AnomalyDetection from './pages/AnomalyDetection';
import MonteCarlo from './pages/MonteCarlo';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <PrivateRoute>
              <Budget />
            </PrivateRoute>
          }
        />
        <Route
          path="/investments"
          element={
            <PrivateRoute>
              <Investments />
            </PrivateRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <PrivateRoute>
              <Goals />
            </PrivateRoute>
          }
        />
        <Route
          path="/tax"
          element={
            <PrivateRoute>
              <TaxPlanner />
            </PrivateRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <PrivateRoute>
              <Chatbot />
            </PrivateRoute>
          }
        />
        <Route
          path="/zerodha/callback"
          element={
            <PrivateRoute>
              <ZerodhaCallback />
            </PrivateRoute>
          }
        />
        <Route
          path="/anomaly"
          element={
            <PrivateRoute>
              <AnomalyDetection />
            </PrivateRoute>
          }
        />
        <Route
          path="/monte-carlo"
          element={
            <PrivateRoute>
              <MonteCarlo />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;

