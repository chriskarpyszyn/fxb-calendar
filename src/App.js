import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Calendar from './Calendar';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Survey from './pages/Survey';
import TwentyFourHourSchedule from './TwentyFourHourSchedule';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/24hour-schedule" element={<TwentyFourHourSchedule />} />
      </Routes>
    </Router>
  );
}

export default App;