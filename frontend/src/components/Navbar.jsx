import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const logout = () => {
    localStorage.removeItem('id');
    setDropdownOpen(false);
    navigate('/'); // redirect to login
  };

  return (
    <header className="navbar">
      <div className="logo">StockSim</div>
      <nav className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Dashboard</NavLink>
        <NavLink to="/stocks" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Stocks</NavLink>
        <NavLink to="/portfolio" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Portfolio</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Leaderboard</NavLink>

        {/* Account dropdown */}
        <div className="dropdown">
          <span className="material-icons account-icon" onClick={toggleDropdown}>
            account_circle
          </span>
          {dropdownOpen && (
            <div className="dropdown-menu">
                <button className="dropdown-item" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
