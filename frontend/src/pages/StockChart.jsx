import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import Popup from '../components/Popup';
import './StockChart.css';

// --- API endpoints by timeframe ---
const TIMEFRAME_ENDPOINTS = {
  '1D': (symbol) => `/api/stocks/${symbol}/history?period=1d`,
  '1W': (symbol) => `/api/stocks/${symbol}/history?period=7d`,
  '1M': (symbol) => `/api/stocks/${symbol}/history?period=1mo`,
  '1Y': (symbol) => `/api/stocks/${symbol}/history?period=1y`,
};

// --- Dynamic chart formatting ---
const TIMEFRAME_CONFIG = {
  '1D': { unit: 'minute', displayFormat: 'HH:mm' },
  '1W': { unit: 'hour', displayFormat: 'MMM d, HH:mm' },
  '1M': { unit: 'day', displayFormat: 'MMM d' },
  '1Y': { unit: 'month', displayFormat: 'MMM yyyy' },
};

const StockChart = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [stockData, setStockData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [availableCash, setAvailableCash] = useState(0);
  const [holding, setHolding] = useState('No position');
  const [showPopup, setShowPopup] = useState(false);
  const [tradeType, setTradeType] = useState(null);
  const symbol = useParams().symbol;
  const userId = localStorage.getItem('id');

  // --- Fetch user balance ---
  const fetchBalance = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/user/${userId}/balance`);
      const data = await res.json();
      if (res.ok) setAvailableCash(data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  // --- Fetch user's holding for this stock ---
  const fetchHolding = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/trades/user/${userId}`);
      const data = await res.json();
      if (!res.ok) return;

      const symbolTrades = data.filter(t => t.stockSymbol === symbol);
      const netQty = symbolTrades.reduce(
        (sum, t) => sum + (t.tradeType === 'BUY' ? t.quantity : -t.quantity),
        0
      );

      setHolding(netQty > 0 ? `${netQty}` : 'No position');
    } catch (err) {
      console.error('Error fetching holdings:', err);
    }
  };

  // --- Fetch stock price history ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8080' + TIMEFRAME_ENDPOINTS[timeframe](symbol));
        const data = await res.json();

        // Clean + sort data
        const filtered = data
          .map(d => ({
            datetime: new Date(d.Datetime),
            close: Number(d.Close)
          }))
          .filter(d => !isNaN(d.close) && d.datetime instanceof Date && !isNaN(d.datetime))
          .sort((a, b) => a.datetime - b.datetime);

        setStockData(filtered);
        if (filtered.length) setCurrentPrice(filtered[filtered.length - 1].close);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      }
    };

    fetchData();
  }, [timeframe, symbol]);

  // --- Render Chart ---
  useEffect(() => {
    if (!chartRef.current || !stockData.length) return;
    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const config = TIMEFRAME_CONFIG[timeframe];

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stockData.map(d => d.datetime),
        datasets: [
          {
            label: 'Close Price',
            data: stockData.map(d => ({ x: d.datetime, y: d.close })),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4, // smooth curve
            pointRadius: 0,
            pointHoverRadius: 3,
            borderWidth: 2,
            spanGaps: true // fills gaps for missing data
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].parsed.x);
                if (timeframe === '1D')
                  return date.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });
                if (timeframe === '1W')
                  return date.toLocaleString('en-IN', { weekday: 'short', hour: '2-digit' });
                if (timeframe === '1M')
                  return date.toLocaleString('en-IN', { month: 'short', day: 'numeric' });
                return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
              },
              label: (context) => `Price: ₹${context.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            time: {
              unit: config.unit,
              displayFormats: {
                minute: 'HH:mm',
                hour: 'MMM d HH:mm',
                day: 'MMM d',
                month: 'MMM yyyy'
              }
            },
            grid: { display: false },
            ticks: {
              display: false

            }
          },
          y: {
            position: 'right',
            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
            ticks: {
              color: '#6b7280',
              font: { size: 10 },
              callback: value => `₹${value.toFixed(0)}`
            }
          }
        }
      }
    });

    return () => chartInstanceRef.current?.destroy();
  }, [stockData, timeframe]);

  // --- Trade popup logic ---
  const handleTradeClick = (type) => {
    setTradeType(type);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTradeType(null);
  };

  const handleTrade = async (quantity, type) => {
    try {
      const endpoint = type === 'BUY' ? '/api/trades/buy' : '/api/trades/sell';
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, symbol, quantity, price: currentPrice })
      });
      const message = await res.text();

      if (!res.ok) return alert(`❌ ${message}`);
      alert(`✅ ${message}`);

      await fetchBalance();
      await fetchHolding();
    } catch (err) {
      console.error('Trade error:', err);
      alert('⚠️ Trade failed.');
    }
  };

  // --- Initial fetch ---
  useEffect(() => {
    fetchBalance();
    fetchHolding();
  }, [symbol]);

  return (
    <div className="stock-chart-container">
      <header className="chart-header">
        <h1>{symbol}</h1>
        <p>Interactive line chart</p>
      </header>

      <div className="chart-controls">
        {['1D', '1W', '1M', '1Y'].map(tf => (
          <button
            key={tf}
            className={timeframe === tf ? 'btn-active' : 'btn-inactive'}
            onClick={() => setTimeframe(tf)}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
      </div>

      <div className="trade-section">
        <div className="trade-header">
          <h2>Trade {symbol}</h2>
          <p>Current price: ₹{currentPrice.toFixed(2)}</p>
        </div>
        <div className="trade-info">
          <div className="info-card">
            <p>Available Cash</p>
            <p>₹{availableCash.toFixed(2)}</p>
          </div>
          <div className="info-card">
            <p>Your Holding</p>
            <p>{holding}</p>
          </div>
        </div>
        <div className="trade-actions">
          <button className="btn-buy" onClick={() => handleTradeClick('BUY')}>Buy</button>
          <button className="btn-sell" onClick={() => handleTradeClick('SELL')}>Sell</button>
        </div>
      </div>

      {showPopup && (
        <Popup
          isOpen={showPopup}
          symbol={symbol}
          type={tradeType}
          price={currentPrice}
          onClose={handleClosePopup}
          onTrade={handleTrade}
        />
      )}
    </div>
  );
};

export default StockChart;



/*
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import Popup from '../components/Popup';
import './StockChart.css';

const TIMEFRAME_ENDPOINTS = {
  '1D': (symbol) => `/api/stocks/${symbol}/history?period=1d`,
  '1W': (symbol) => `/api/stocks/${symbol}/history?period=7d`,
  '1M': (symbol) => `/api/stocks/${symbol}/history?period=1mo`,
  '1Y': (symbol) => `/api/stocks/${symbol}/history?period=1y`,
};

const TIMEFRAME_CONFIG = {
  '1D': { unit: 'minute', displayFormat: 'HH:mm' },
  '1W': { unit: 'hour', displayFormat: 'MMM d, HH:mm' },
  '1M': { unit: 'day', displayFormat: 'MMM d' },
  '1Y': { unit: 'month', displayFormat: 'MMM yyyy' }
};

const StockChart = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [stockData, setStockData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [availableCash, setAvailableCash] = useState(0);
  const [holding, setHolding] = useState('No position');
  const [showPopup, setShowPopup] = useState(false);
  const [tradeType, setTradeType] = useState(null);
  const symbol = useParams().symbol;
  const userId = localStorage.getItem('id');

  // --- Fetch user balance from backend ---
  const fetchBalance = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/user/${userId}/balance`);
      const data = await res.json();
      if (res.ok) setAvailableCash(data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  // --- Fetch user's holding for this symbol ---
  const fetchHolding = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/trades/user/${userId}`);
      const data = await res.json();
      if (!res.ok) return;

      const symbolTrades = data.filter(t => t.stockSymbol === symbol);
      const netQty = symbolTrades.reduce((sum, t) => {
        return sum + (t.tradeType === 'BUY' ? t.quantity : -t.quantity);
      }, 0);

      setHolding(netQty > 0 ? `${netQty}` : 'No position');
    } catch (err) {
      console.error('Error fetching holdings:', err);
    }
  };

  // --- Fetch stock history data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8080' + TIMEFRAME_ENDPOINTS[timeframe](symbol));
        const data = await res.json();
        const filtered = data.map(d => ({
          datetime: new Date(d.Datetime),
          close: Number(d.Close)
        }));
        setStockData(filtered);
        if (filtered.length) setCurrentPrice(filtered[filtered.length - 1].close);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      }
    };
    fetchData();
  }, [timeframe, symbol]);

  // --- Render Chart ---
  useEffect(() => {
    if (!chartRef.current || !stockData.length) return;
    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const config = TIMEFRAME_CONFIG[timeframe];

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stockData.map(d => d.datetime),
        datasets: [
          {
            label: 'Close Price',
            data: stockData.map(d => d.close),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].parsed.x);
                if (timeframe === '1D') {
                  return date.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                } else if (timeframe === '1W') {
                  return date.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit'
                  });
                } else if (timeframe === '1M') {
                  return date.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  });
                } else {
                  return date.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                }
              },
              label: (context) => `Price: ₹${context.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: config.unit,
              displayFormats: {
                minute: 'HH:mm',
                hour: 'MMM d',
                day: 'MMM d',
                month: 'MMM yyyy'
              }
            },
            grid: { display: false },
            ticks: { 
              display: false,
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            position: 'right',
            grid: { 
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: { 
              display: true,
              font: { size: 10 },
              color: '#6b7280',
              callback: function(value) {
                return '₹' + value.toFixed(0);
              }
            }
          }
        }
      }
    });

    return () => chartInstanceRef.current?.destroy();
  }, [stockData, timeframe]);

  // --- Popup Handlers ---
  const handleTradeClick = (type) => {
    setTradeType(type);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTradeType(null);
  };

  // --- Perform Buy/Sell Trade ---
  const handleTrade = async (quantity, type) => {
    try {
      const endpoint = type === 'BUY' ? '/api/trades/buy' : '/api/trades/sell';
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symbol,
          quantity,
          price: currentPrice
        })
      });

      const message = await res.text();

      if (!res.ok) {
        alert(`❌ ${message}`);
        return;
      }

      alert(`✅ ${message}`);

      await fetchBalance();
      await fetchHolding();

    } catch (err) {
      console.error('Trade error:', err);
      alert('⚠️ Trade failed.');
    }
  };

  // --- Initial fetch of balance and holdings ---
  useEffect(() => {
    fetchBalance();
    fetchHolding();
  }, [symbol]);

  return (
    <div className="stock-chart-container">
      <header className="chart-header">
        <h1>{symbol}</h1>
        <p>Interactive line chart</p>
      </header>

      <div className="chart-controls">
        {['1D', '1W', '1M', '1Y'].map(tf => (
          <button
            key={tf}
            className={timeframe === tf ? 'btn-active' : 'btn-inactive'}
            onClick={() => setTimeframe(tf)}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
      </div>

      <div className="trade-section">
        <div className="trade-header">
          <h2>Trade {symbol}</h2>
          <p>Current price: ₹{currentPrice.toFixed(2)}</p>
        </div>
        <div className="trade-info">
          <div className="info-card">
            <p>Available Cash</p>
            <p>₹{availableCash.toFixed(2)}</p>
          </div>
          <div className="info-card">
            <p>Your Holding</p>
            <p>{holding}</p>
          </div>
        </div>
        <div className="trade-actions">
          <button className="btn-buy" onClick={() => handleTradeClick('BUY')}>Buy</button>
          <button className="btn-sell" onClick={() => handleTradeClick('SELL')}>Sell</button>
        </div>
      </div>

      {showPopup && (
        <Popup
          isOpen={showPopup}
          symbol={symbol}
          type={tradeType}
          price={currentPrice}
          onClose={handleClosePopup}
          onTrade={handleTrade}
        />
      )}
    </div>
  );
};

export default StockChart;

*/