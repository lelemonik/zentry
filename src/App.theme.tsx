import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdvancedThemeProvider } from "./contexts/AdvancedThemeContext";

const LandingTest = () => (
  <div style={{ padding: '20px' }}>
    <h1>Landing Page Test with AdvancedTheme</h1>
    <p>Testing AdvancedThemeProvider integration.</p>
  </div>
);

const App = () => {
  return (
    <AdvancedThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingTest />} />
          <Route path="*" element={<div>404 - Page not found</div>} />
        </Routes>
      </BrowserRouter>
    </AdvancedThemeProvider>
  );
};

export default App;