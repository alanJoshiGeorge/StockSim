import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your page components
import App from './App'; // Login page
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockMarketPage from './pages/StockChart';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/LeaderBoard';
import Layout from './components/Layout';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Login page, rendered outside layout */}
        <Route path="/" element={<App />} />

        {/* Pages wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/stock-chart/:symbol" element={<StockMarketPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
