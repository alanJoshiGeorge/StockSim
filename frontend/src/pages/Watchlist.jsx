import { useState, useEffect } from "react";
import "./Watchlist.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const userId = localStorage.getItem("id");

  useEffect(() => {
  fetch(`http://localhost:8080/api/watchlist/${userId}`)
    .then((res) => res.json())
    .then((data) => {setWatchlist(data); console.log(data)})
    .catch((err) => console.error(err));
}, []);

  // 🔹 Remove stock
  const removeStock = (symbol) => {
    fetch("http://localhost:8080/api/watchlist/remove-stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        symbol: symbol,
      }),
    })
      .then((res) => res.text())
      .then(() => {
        // update UI after delete
        setWatchlist((prev) =>
          prev.filter((stock) => stock.symbol !== symbol)
        );
      });
  };

  return (
    <div className="watchlist-container">
      <h1 className="title">My Watchlist</h1>
      <p className="subtitle">Track stocks you're interested in</p>

      <div className="watchlist-grid">
        {watchlist.map((stock, index) => (
          <div className="watchlist-card" key={index}>
            <div className="card-header">
              <h2>{stock.symbol}</h2>
              <button
                className="remove-btn"
                onClick={() => removeStock(stock.symbol)}
              >
                ✕
              </button>
            </div>

            <p className="company-name">{stock.name}</p>

            <div className="price">₹{Number(stock.price).toFixed(2)}</div>

            <div
              className={`change ${
                stock.change >= 0 ? "positive" : "negative"
              }`}
            >
              {stock.change >= 0 ? "+" : ""}
              {stock.change}
            </div>

            <div className="card-actions">
              <button className="buy-btn">Buy</button>
              <button className="chart-btn">View Chart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;