import React, { useState } from 'react';
import './Popup.css';

const Popup = ({ isOpen, onClose, onTrade, symbol, price, type }) => {
  const [quantity, setQuantity] = useState('');

  const handleSubmit = () => {
    if (!quantity || quantity <= 0) return alert("Enter a valid quantity");
    onTrade(Number(quantity), type); // pass quantity and trade type to parent
    setQuantity('');
    onClose();
  };

  if (!isOpen) return null;

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
        <div className="modal-actions">
          <button className="btn-confirm" onClick={handleSubmit}>{type}</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
