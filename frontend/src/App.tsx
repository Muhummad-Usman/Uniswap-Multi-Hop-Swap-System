import React from 'react';
import { AppProvider } from './context/AppContext';
import { Home } from './pages/Home';
import './index.css';

function App() {
  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
}

export default App;
