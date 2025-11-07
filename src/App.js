import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Calendar from './Calendar';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Survey from './pages/Survey';
import TwentyFourHourSchedule from './TwentyFourHourSchedule';
import ChannelsList from './pages/ChannelsList';
import ChannelScheduleAdmin from './pages/ChannelScheduleAdmin';
import WidgetLanding from './pages/WidgetLanding';
import StreamOverlay from './components/StreamOverlay';
import TimerOverlay from './components/TimerOverlay';
import StreamTimerWidget from './components/StreamTimerWidget';
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
        <Route path="/widgets" element={<WidgetLanding />} />
        <Route path="/widgets/:channelName" element={<WidgetLanding />} />
        <Route path="/widget/:channelName" element={<StreamOverlay />} />
        <Route path="/timer/:channelName" element={<TimerOverlay />} />
        <Route path="/widget-timer" element={<StreamTimerWidget />} />
      </Routes>
    </Router>
  );
}

export default App;