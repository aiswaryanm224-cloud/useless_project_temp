import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

export default function App() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* Background Soft Pastel Blobs */}
      <div className="bg-ambient-layer">
        <div className="blob-1" />
        <div className="blob-2" />
        <div className="blob-3" />
      </div>

      {/* Main Interface Content */}
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}
