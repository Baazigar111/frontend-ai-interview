import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Welcome from './pages/Welcome';         // <-- New Import
import Interviewee from './pages/Interviewee';
import Interviewer from './pages/Interviewer';
// import { Provider } from 'react-redux';
// import store from './store/store'; // Assuming you have a store setup

function App() {
  return (
    // <Provider store={store}> {/* Assuming this is handled higher up */}
    <Router>
      <header style={{ padding: '10px 20px', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd' }}>
        <nav>
          <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', fontWeight: 'bold' }}>Home</Link>
          <Link to="/interviewee" style={{ marginRight: '15px', textDecoration: 'none', fontWeight: 'bold' }}>Interviewee (Chat)</Link>
          <Link to="/interviewer" style={{ textDecoration: 'none', fontWeight: 'bold' }}>Interviewer (Dashboard)</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Welcome />} />            {/* <-- Entry Point */}
        <Route path="/interviewee" element={<Interviewee />} />
        <Route path="/interviewer" element={<Interviewer />} />
      </Routes>
    </Router>
    // </Provider>
  );
}

export default App;