import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [gainingSectors, setGainingSectors] = useState([]);
  const [losingSectors, setLosingSectors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/stocks/trending");
        const data = await res.json();
        console.log("Fetched trending stocks:", data);
        setTrendingStocks(data);
      } catch (err) {
        console.error("Failed to fetch trending stocks:", err);
      }
    };

    const fetchTrendingSectors = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/stocks/sectors/trending");
        const data = await res.json();
        console.log("Fetched trending sectors:", data);
        setGainingSectors(data.gaining);
        setLosingSectors(data.losing);
      } catch (err) {
        console.error("Failed to fetch trending sectors:", err);
      }
    };

    fetchTrending();
    fetchTrendingSectors();
  }, []);

  return (
    <div className="dashboard">
      {/* Main Content */}
      <main className="main-content">
        <h1>Welcome back, User!</h1>
        <p className="subtitle">Here's your trading overview</p>

        {/* Top Row: Trending Stocks + Sector Cards */}
        <div className="cards-row">
          {/* Trending Stocks Panel */}
          <div className="card trending-card">
            <h3>Trending Stocks</h3>
            {trendingStocks.length === 0 ? (
              <p>Loading trending stocks...</p>
            ) : (
              <table className="trending-table">
                <tbody>
                  {trendingStocks.map((stock, idx) => (
                    <tr key={idx}>
                      <td>{stock.symbol}</td>
                      <td className={stock.change >= 0 ? "positive" : "negative"}>
                        {stock.change.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Gaining Sectors */}
          <div className="card">
            <h3>Gaining Sectors</h3>
            {gainingSectors.length === 0 ? (
              <p>Loading...</p>
            ) : (
              <ul>
                {gainingSectors.map((sector, idx) => (
                  <li key={idx}>
                    {sector.name}: <span className="positive">{sector.avgChange.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Losing Sectors */}
          <div className="card">
            <h3>Losing Sectors</h3>
            {losingSectors.length === 0 ? (
              <p>Loading...</p>
            ) : (
              <ul>
                {losingSectors.map((sector, idx) => (
                  <li key={idx}>
                    {sector.name}: <span className="negative">{sector.avgChange.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Today's Change */}
          <div className="card">
            <h3>Today's Change</h3>
            <p className="big positive">+$0.00</p>
            <span>+0.00%</span>
          </div>
        </div>

        {/* Bottom Panels */}
        <div className="bottom-panels">
          {/* Quick Actions */}
          <div className="panel">
            <h3>Quick Actions</h3>
            <button className="btn dark" onClick={()=>navigate('/stocks')}>
              <span className="material-icons">trending_up</span>
              Browse Stocks
            </button>
            <button className="btn light" onClick={()=>navigate('/portfolio')}>
              <span className="material-icons">pie_chart</span>
              View Portfolio
            </button>
          </div>

          {/* Market Overview */}
          <div className="panel">
            <h3>Market Overview</h3>
            <ul className="market-list">
              <li>
                <span>S&amp;P 500</span>
                <span className="positive">4,500.00 (+1.2%)</span>
              </li>
              <li>
                <span>NASDAQ</span>
                <span className="negative">14,200.00 (-0.5%)</span>
              </li>
              <li>
                <span>DOW</span>
                <span className="positive">35,800.00 (+0.8%)</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
