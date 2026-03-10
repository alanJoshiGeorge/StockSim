import React, { useState } from 'react';
import './Popup.css';

const Popup = ({ isOpen, symbol, price, type, userId, onClose, onTradeComplete }) => {
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  console.log('Popup props:', { isOpen, symbol, price, type, userId });
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!quantity || quantity <= 0) return alert('Enter a valid quantity');
    setIsSubmitting(true);

    try {
      const endpoint = type === 'BUY' ? '/api/trades/buy' : '/api/trades/sell';
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, symbol, quantity: Number(quantity), price }),
      });

      const message = await res.text();

      if (!res.ok) {
        alert(`❌ ${message}`);
      } else {
        setMessage("Order executed");
        if (onTradeComplete) onTradeComplete(); // refresh balance/holdings
        setTimeout(() => {
          onClose(); // close popup
        }, 1000);
      }
    } catch (err) {
      console.error('Trade error:', err);
      alert('⚠️ Trade failed.');
    } finally {
      setIsSubmitting(false);
      setQuantity('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{type} {symbol}</h2>
        <p>Current Price: ₹{price.toFixed(2)}</p>
        <input
          type="number"
          min="1"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
          {message && <p className="message">{message}</p>}
        <div className="modal-actions">
          <button
            className="btn-confirm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : type}
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
