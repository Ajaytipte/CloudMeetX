import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import MeetingRoom from './pages/MeetingRoom';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import RecentMeetings from './pages/RecentMeetings';
import UpcomingMeetings from './pages/UpcomingMeetings';
import CreateMeetingPage from './pages/CreateMeetingPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/meetings/recent" element={<RecentMeetings />} />
          <Route path="/meetings/upcoming" element={<UpcomingMeetings />} />
          <Route path="/create-meeting" element={<CreateMeetingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
