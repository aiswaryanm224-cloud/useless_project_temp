import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CameraScanner from './components/Scanner/CameraScanner';

export default function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleOpenScanner = () => {
    setIsScannerOpen(true);
  };

  const handleCloseScanner = () => {
    setIsScannerOpen(false);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* Background Soft Pastel Blobs */}
      <div className="bg-ambient-layer">
        <div className="blob-1" />
        <div className="blob-2" />
        <div className="blob-3" />
      </div>

      {/* Main Interface Content */}
      <Navbar onOpenScanner={handleOpenScanner} />
      <main>
        <Hero onOpenScanner={handleOpenScanner} />
      </main>

      {/* STEP 2 Live Camera Scanner Modal */}
      <CameraScanner 
        isOpen={isScannerOpen} 
        onClose={handleCloseScanner} 
      />
    </div>
  );
}
