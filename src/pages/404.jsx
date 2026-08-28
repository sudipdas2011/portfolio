import React from 'react';
import { Link } from 'react-router-dom'; // or standard 'a' tags if not using react-router

export default function NotFound() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif'
    }}>
      {/* Target this with your custom cursor to frame it */}
      <h1 cursor-select="true" style={{ fontSize: '10rem', margin: 0, fontWeight: '900' }}>404</h1>
      <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', margin: '20px 0' }}>[ERR] PAGE_NOT_FOUND // OUT_OF_BOUNDS</p>
      
      <Link to="/" cursor-select="true" style={{
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: '10px 20px',
        textDecoration: 'none',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        Return to Matrix
      </Link>
    </div>
  );
}
