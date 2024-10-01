import React from 'react';
import Tuner from './components/Tuner'; // Importa el componente GuitarTuner

const App = () => {
  return (
    <div>
      <h1>Welcome to TunerFree</h1>
      <Tuner /> {/* Renderiza el afinador */}
    </div>
  );
};

export default App;

