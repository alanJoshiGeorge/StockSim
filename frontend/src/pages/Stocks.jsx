import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from '../components/Popup';
import './Stocks.css'; 

const StockCard = ({ symbol, name, sector, priceDisplay, price, change, volume, marketCap, onBuyClick }) => {
  const navigate = useNavigate();

  return (
    <div className="stock-card">
      <div className="card-header">
        <h3 className="symbol">{symbol}</h3>
        <span className={`sector-tag ${sector.toLowerCase().replace(/\s/g, '-')}`}>{sector}</span>
      </div>
      <p className="name">{name}</p>
      <div className="price-info">
        {/* show formatted price */}
        <span className="price">₹{priceDisplay}</span>
        <span className={`change ${change.toString().includes('+') ? 'positive' : 'negative'}`}>
          {change}
        </span>
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="label">Volume</span>
          <span className="value">{volume}</span>
        </div>
        <div className="metric">
          <span className="label">Market Cap</span>
          <span className="value">{formatIndianNumber(marketCap)}</span>
        </div>
      </div>
      <div className="card-actions">
        {/* Use numeric price here */}
        <button className="buy-button" onClick={() => onBuyClick(symbol, price)}>
          🛒 Buy Stock
        </button>
        <button className="view-chart-button" onClick={() => navigate(`/stock-chart/${symbol}`)}>
          View Chart
        </button>
      </div>
    </div>
  );
};

// --- Utility function for formatting numbers ---
function formatIndianNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e7) return (num / 1e7).toFixed(2) + ' Cr';
  if (num >= 1e5) return (num / 1e5).toFixed(2) + ' L';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + ' K';
  return num.toString();
}

const StockMarketPage = () => {
  const [stocks, setStocks] = useState([]);
  const [initialStocks, setInitialStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all-sectors');
  const [sortOption, setSortOption] = useState('symbol-a-z');

  const [showPopup, setShowPopup] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const userId = localStorage.getItem('id');

  // --- Fetch all stocks ---
  useEffect(() => {
    fetch('http://localhost:8080/api/stocks')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return setStocks([]);
        const formatted = data.map((stock) => ({
          ...stock,
          price: Number(stock.price),
          priceDisplay: stock.price.toFixed(2), // string for display
          change: `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}`,
          volume: stock.volume,
          marketCap: stock.marketCap,
        }));
        setStocks(formatted);
        setInitialStocks(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stocks:', err);
        setLoading(false);
      });
  }, []);

  // --- Search handler ---
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query) {
      setStocks(initialStocks);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/stocks/search?query=${query}`);
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) {
        setStocks([]);
      } else {
        const formatted = {
          ...data,
          price: Number(data.price),
          priceDisplay: Number(data.price).toFixed(2),
          change: `${data.change >= 0 ? '+' : ''}${Number(data.change).toFixed(2)}`,
          volume: data.volume,
          marketCap: data.marketCap,
        };
        setStocks([formatted]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setStocks([]);
    }
  };

  // --- Filtering and sorting ---
  const filteredStocks = stocks
    .filter(
      (stock) =>
        (stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedSector === 'all-sectors' || stock.sector.toLowerCase() === selectedSector)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'symbol-a-z':
          return a.symbol.localeCompare(b.symbol);
        case 'symbol-z-a':
          return b.symbol.localeCompare(a.symbol);
        case 'price-high-low':
          return b.price - a.price;
        case 'price-low-high':
          return a.price - b.price;
        default:
          return 0;
      }
    });

  // --- Popup handlers ---
  const handleBuyClick = (symbol, price) => {
    setSelectedSymbol(symbol);
    setSelectedPrice(price);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedSymbol('');
    setSelectedPrice(0);
  };

  const handleTradeComplete = () => {
    console.log('Trade completed!');
  };

  return (
    <div className="stocksim-app">
      <main className="main-content">
        <section className="hero-section">
          <h2>Stock Market</h2>
          <p>Discover and invest in your favorite stocks</p>
        </section>

        <section className="filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-dropdowns">
            <div className="filter">
              <span className="material-icons">filter_list</span>
              <select
                className="dropdown-select"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="all-sectors">All Sectors</option>
                <option value="technology">Technology</option>
                <option value="consumer discretionary">Consumer Discretionary</option>
                <option value="healthcare">Healthcare</option>
              </select>
            </div>

            <div className="filter">
              <select
                className="dropdown-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="symbol-a-z">Symbol (A-Z)</option>
                <option value="symbol-z-a">Symbol (Z-A)</option>
                <option value="price-high-low">Price (High to Low)</option>
                <option value="price-low-high">Price (Low to High)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="stock-grid">
          {loading ? (
            <p>Loading stocks...</p>
          ) : (
            filteredStocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                {...stock}
                priceDisplay={stock.priceDisplay} // string for UI
                price={stock.price}               // numeric for popup
                onBuyClick={handleBuyClick}
              />
            ))
          )}
        </section>
      </main>

      {/* Popup Component */}
      {showPopup && (
        <Popup
          isOpen={showPopup}
          symbol={selectedSymbol}
          price={selectedPrice} // numeric!
          type="BUY"
          userId={userId}
          onClose={handleClosePopup}
          onTradeComplete={handleTradeComplete}
        />
      )}
    </div>
  );
};

export default StockMarketPage;
