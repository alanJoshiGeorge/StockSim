import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [gainingSectors, setGainingSectors] = useState([]);
  const [losingSectors, setLosingSectors] = useState([]);
  const [indianIndices, setIndianIndices] = useState([]);
  const [marketOverview, setMarketOverview] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/stocks/market/overview");
        const data = await res.json();
        console.log("Fetched Market Overview:", data);
        setMarketOverview(data);
      } catch (err) {
        console.error("Failed to fetch market overview:", err);
      }
    };

    fetchMarketOverview();
  }, []);

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

    const fetchIndianIndices = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/stocks/indices"); // your API endpoint
        const data = await res.json();
        console.log("Fetched Indian indices:", data);
        setIndianIndices(data); // assuming data is an array of objects like { name, value, change }
      } catch (err) {
        console.error("Failed to fetch Indian indices:", err);
      }
    };

    fetchTrending();
    fetchTrendingSectors();
    fetchIndianIndices();
  }, []);

  return (
    <div className="dashboard">
      <main className="main-content">
        <h1>Welcome back, User!</h1>
        <p className="subtitle">Here's your trading overview</p>

        <div className="cards-row">
          {/* Trending Stocks */}
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
                    {sector.name} <span className="negative">{sector.avgChange.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Indian Indices */}
          <div className="card">
            <h3>Indian Indices</h3>
            {indianIndices.length === 0 ? (
              <p>Loading indices...</p>
            ) : (
              <ul>
                {indianIndices.map((index, idx) => (
                  <li key={idx}>
                    <span>{index.name}</span>
                    <span className={index.change >= 0 ? "positive" : "negative"}>
                      {index.change >= 0 ? "+" : ""}{index.change.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bottom-panels">
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

          <div className="panel">
            <h3>Market Overview</h3>
            {marketOverview.length === 0 ? (
              <p>Loading...</p>
            ) : (
              <ul className="market-list">
                {marketOverview.map((index, idx) => (
                  <li key={idx}>
                    <span>{index.name}</span>
                    <span className={index.change >= 0 ? "positive" : "negative"}>
                      {index.change >= 0 ? "+" : ""}{index.change.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
