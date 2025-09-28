import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

const LandingTest = () => (
  <div style={{ padding: '20px' }}>
    <h1>Landing Page Test</h1>
    <p>This is a test of the landing page routing.</p>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingTest />} />
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;