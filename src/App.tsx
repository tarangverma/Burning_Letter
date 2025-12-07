import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Loader } from '@react-three/drei';
import { BurningLoveLetter } from './components/Letter';

const App: React.FC = () => {
  const [burnTrigger, setBurnTrigger] = useState(0);

  const handleIgnite = () => {
    setBurnTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full h-screen bg-stone-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-black pointer-events-none" />

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        shadows
        className="z-10"
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#1c1917']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#fff" />
          
          {/* Flicker light to simulate fire ambience */}
          <pointLight position={[2, -2, 2]} intensity={1.5} distance={5} color="#ff6600" decay={2} />

          <BurningLoveLetter key={burnTrigger} />
          
          <OrbitControls 
            enableZoom={true} 
            minDistance={2} 
            maxDistance={8}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Suspense>
      </Canvas>
      <Loader />

      {/* UI Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        
        <button
          onClick={handleIgnite}
          className="px-6 py-2 bg-orange-700 hover:bg-orange-600 text-orange-50 font-serif tracking-wider uppercase text-sm transition-all duration-300 shadow-[0_0_20px_rgba(194,65,12,0.4)] border border-orange-800/50 rounded-sm hover:shadow-[0_0_30px_rgba(234,88,12,0.6)]"
        >
          Ignite Again
        </button>
        
      </div>
    </div>
  );
};

export default App;