import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Calendar from './Calendar';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Calendar />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;