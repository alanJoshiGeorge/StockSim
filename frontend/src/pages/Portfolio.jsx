import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Portfolio.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const MetricCard = ({ title, value, subtitle, iconClass, colorClass, currency }) => (
  <div className="card metric-card">
    <div className="card-header">
      <h3 className="card-title">{title}</h3>
      {iconClass && (
        <span className={`material-icons card-icon ${iconClass}`}>{iconClass}</span>
      )}
    </div>
    <p className="card-value">
      {currency && <span className="currency-symbol">₹</span>}
      <span className={`big ${colorClass}`}>{value}</span>
    </p>
    <p className="card-subtitle">{subtitle}</p>
  </div>
);

const Portfolio = () => {
  const userId = localStorage.getItem("id");
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState({});
  const [totalValue, setTotalValue] = useState(0);
  const [gainLoss, setGainLoss] = useState(0);
  const navigate = useNavigate();

  // --- Fetch user balance ---
  const fetchBalance = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/user/${userId}/balance`);
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  // --- Fetch trades and compute holdings ---
  const fetchTrades = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/trades/user/${userId}`);
      const trades = await res.json();

      const stockHoldings = {};
      let portfolioValue = 0;
      let totalGainLoss = 0;

      trades.forEach((t) => {
        const { stockSymbol, quantity, price, tradeType, currentPrice } = t;
        const qty = tradeType === "BUY" ? quantity : -quantity;

        if (!stockHoldings[stockSymbol]) {
          stockHoldings[stockSymbol] = {
            quantity: 0,
            avgBuyPrice: 0,
            currentPrice: currentPrice || price,
          };
        }

        if (tradeType === "BUY") {
          const totalCost = stockHoldings[stockSymbol].avgBuyPrice * stockHoldings[stockSymbol].quantity + price * quantity;
          const newQty = stockHoldings[stockSymbol].quantity + quantity;
          stockHoldings[stockSymbol].avgBuyPrice = totalCost / newQty;
          stockHoldings[stockSymbol].quantity = newQty;
        } else if (tradeType === "SELL") {
          stockHoldings[stockSymbol].quantity -= quantity;
        }

        // Update current price (prefer latest)
        if (currentPrice) stockHoldings[stockSymbol].currentPrice = currentPrice;
      });

      // Compute values
      Object.keys(stockHoldings).forEach((symbol) => {
        const { quantity, avgBuyPrice, currentPrice } = stockHoldings[symbol];
        if (quantity > 0) {
          const currentValue = quantity * currentPrice;
          const costValue = quantity * avgBuyPrice;
          portfolioValue += currentValue;
          totalGainLoss += currentValue - costValue;
        }
      });

      // Remove zero holdings
      for (const symbol in stockHoldings) {
        if (stockHoldings[symbol].quantity <= 0) delete stockHoldings[symbol];
      }

      setHoldings(stockHoldings);
      setTotalValue(balance + portfolioValue);
      setGainLoss(totalGainLoss);
    } catch (err) {
      console.error("Error fetching trades:", err);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTrades();
  }, []);

  // --- Pie Chart Data ---
  const chartData = {
    labels: Object.keys(holdings),
    datasets: [
      {
        label: "Portfolio Allocation",
        data: Object.values(holdings).map((h) => h.quantity * h.currentPrice),
        backgroundColor: [
          "#4CAF50",
          "#2196F3",
          "#FFC107",
          "#FF5722",
          "#9C27B0",
          "#00BCD4",
          "#E91E63",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { position: "bottom" },
    },
  };

  return (
    <div className="portfolio">

      <main className="main-content">
        <section className="page-header">
          <h1 className="page-title">My Portfolio</h1>
          <p className="subtitle">Track your investments and performance</p>
        </section>

        <div className="cards-row">
          <MetricCard
            title="Total Portfolio Value"
            value={totalValue.toFixed(2)}
            subtitle={`${Object.keys(holdings).length} holdings`}
            iconClass="schedule"
            currency={true}
          />
          <MetricCard
            title="Total Gain/Loss"
            value={gainLoss.toFixed(2)}
            subtitle={`${((gainLoss / totalValue) * 100 || 0).toFixed(2)}%`}
            iconClass={gainLoss >= 0 ? "trending_up" : "trending_down"}
            colorClass={gainLoss >= 0 ? "positive" : "negative"}
            currency={true}
          />
          <MetricCard
            title="Available Cash"
            value={balance.toFixed(2)}
            subtitle="Ready to invest"
            iconClass=""
            currency={true}
          />
          <MetricCard
            title="Holdings"
            value={Object.keys(holdings).length}
            subtitle="Different stocks"
            iconClass="schedule"
            currency={false}
          />
        </div>

        <div className="bottom-panels">
          <div className="panel allocation-panel">
            <h3 className="panel-title">Portfolio Allocation</h3>
            <p className="panel-subtitle">Your portfolio distribution by stock</p>
            <div style={{ width: "100%", height: "300px", padding: "20px" }}>
              {Object.keys(holdings).length > 0 ? (
                <Pie data={chartData} options={chartOptions} />
              ) : (
                <p
                  style={{
                    color: "#ccc",
                    textAlign: "center",
                    marginTop: "50px",
                  }}
                >
                  No holdings yet to show.
                </p>
              )}
            </div>
          </div>

          <div className="panel actions-panel">
            <h3 className="panel-title">Quick Actions</h3>
            <p className="panel-subtitle">Manage your portfolio</p>
            <button className="btn dark action-btn" onClick={()=>navigate('/stocks')}>
              <span className="material-icons">+</span>
              Buy More Stocks
            </button>
            <button className="btn light action-btn" onClick={()=>navigate('/dashboard')}>
              <span className="material-icons">visibility</span>
              View Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
