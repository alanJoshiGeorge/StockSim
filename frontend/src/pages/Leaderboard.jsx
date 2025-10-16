// Leaderboard.js

import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard from backend
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/leaderboard');
        const data = await res.json();

        // Add rank based on sorted totalValue
        const rankedData = data.map((trader, index) => ({
          rank: index + 1,
          trader: trader.username,
          totalValue: trader.totalValue
        }));

        setTraders(rankedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="app-container">

      {/* --- Main Content --- */}
      <div className="leaderboard-main-content">
        <header className="page-header">
          <h1>Leaderboard</h1>
          <p>Market leaders and top traders</p>
        </header>

        <div className="leaderboard-card">
          <div className="card-header">
            <h2>Top Traders</h2>
            <p>Ranking by total portfolio value</p>
          </div>

          {loading ? (
            <p>Loading leaderboard...</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="th-rank">Rank</th>
                  <th className="th-trader">Trader</th>
                  <th className="th-value">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {traders.map((trader) => (
                  <tr key={trader.rank}>
                    <td className="td-rank">{trader.rank}</td>
                    <td className="td-trader">{trader.trader}</td>
                    <td className="td-value">{formatCurrency(trader.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
