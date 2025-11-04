import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Calendar from './Calendar';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Survey from './pages/Survey';
import TwentyFourHourSchedule from './TwentyFourHourSchedule';
import ChannelsList from './pages/ChannelsList';
import ChannelScheduleAdmin from './pages/ChannelScheduleAdmin';
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
        <Route path="/channels" element={<ChannelsList />} />
        <Route path="/schedule/:channelName" element={<TwentyFourHourSchedule />} />
        <Route path="/schedule/:channelName/admin" element={<ChannelScheduleAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;