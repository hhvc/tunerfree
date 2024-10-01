import React, { useState, useEffect } from "react";
import TunerControl from "./TunerControl";
import TuningDisplay from "./TuningDisplay";
import { noteFrequencies } from "../services/noteFrequencies";

const Tuner = () => {
  const [currentNote, setCurrentNote] = useState(null);
  const [currentFrequency, setCurrentFrequency] = useState(null);
  const [isTuning, setIsTuning] = useState(false);
  const [targetNote, setTargetNote] = useState("E2");
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [animationFrameId, setAnimationFrameId] = useState(null);

  // Función para inicializar el afinador
  const startTuning = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(mic);
      source.connect(analyserNode);

      setAudioContext(context);
      setAnalyser(analyserNode);
      setMicrophone(mic);

      detectPitch(analyserNode, context); // Inicia la detección de la frecuencia
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsTuning(false); // Detener afinador si hay error
    }
  };

  // Función para detectar la frecuencia de tono
  const detectPitch = (analyserNode, context) => {
    const bufferLength = analyserNode.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserNode.getFloatTimeDomainData(buffer);

    const frequency = autoCorrelate(buffer, context.sampleRate);

    if (frequency !== -1) {
      const closestNote = getClosestNote(frequency);
      setCurrentNote(closestNote);
      setCurrentFrequency(frequency);
    }

    const frameId = requestAnimationFrame(() =>
      detectPitch(analyserNode, context)
    );
    setAnimationFrameId(frameId); // Guardar el ID de animación para detenerlo más tarde
  };

  // Función para detener la afinación
  const stopTuning = () => {
    if (microphone) {
      microphone.getTracks().forEach((track) => track.stop());
      setMicrophone(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    cancelAnimationFrame(animationFrameId); // Detener el ciclo de animación
    setAnalyser(null);
    setCurrentNote(null);
    setCurrentFrequency(null);
  };

  const toggleTuning = () => {
    setIsTuning((prev) => !prev);
  };

  useEffect(() => {
    if (isTuning) {
      startTuning(); // Inicia el proceso de afinación
    } else {
      stopTuning(); // Detiene el afinador si no está en uso
    }

    return () => {
      stopTuning(); // Limpia los recursos al desmontar el componente
    };
  }, [isTuning]);

  // Auto-correlación para detectar la frecuencia del sonido
  const autoCorrelate = (buffer, sampleRate) => {
    let SIZE = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      let val = buffer[i];
      sumOfSquares += val * val;
    }
    if (Math.sqrt(sumOfSquares / SIZE) < 0.01) return -1;

    let r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }
    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    let x1 = c[T0 - 1],
      x2 = c[T0],
      x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  // Calcular la dirección del ajuste de la cuerda
  const getTuningDirection = () => {
    if (!currentNote || !currentFrequency || !targetNote) return null;
    const targetFrequency = noteFrequencies[targetNote];

    if (currentFrequency < targetFrequency) {
      return "up"; // Más grave
    } else if (currentFrequency > targetFrequency) {
      return "down"; // Más aguda
    } else {
      return "in-tune"; // Afinada
    }
  };

  return (
    <div className="text-center mt-5">
      <TunerControl isTuning={isTuning} onToggleTuning={toggleTuning} />

      <TuningDisplay
        currentNote={currentNote}
        currentFrequency={currentFrequency}
        tuningDirection={getTuningDirection()}
        targetNote={targetNote}
        onNoteClick={setTargetNote} // Aquí se actualiza targetNote desde TuningDisplay
      />
    </div>
  );
};

// Función para encontrar la nota más cercana
const getClosestNote = (frequency) => {
  let closestNote = null;
  let minDifference = Infinity;

  Object.keys(noteFrequencies).forEach((note) => {
    const diff = Math.abs(frequency - noteFrequencies[note]);
    if (diff < minDifference) {
      minDifference = diff;
      closestNote = note;
    }
  });

  return closestNote;
};

export default Tuner;

// import React, { useState, useEffect } from "react";
// import TunerControl from "./TunerControl";
// import TuningDisplay from "./TuningDisplay";
// import { noteFrequencies } from "../services/noteFrequencies"; // Nota: Asegúrate de que pianoNotes y guitarStrings estén en este archivo

// const GuitarTuner = () => {
//   const [currentNote, setCurrentNote] = useState(null);
//   const [currentFrequency, setCurrentFrequency] = useState(null);
//   const [isTuning, setIsTuning] = useState(false);
//   const [targetNote, setTargetNote] = useState("E2");
//   const [audioContext, setAudioContext] = useState(null);
//   const [analyser, setAnalyser] = useState(null);
//   const [microphone, setMicrophone] = useState(null);
//   const [animationFrameId, setAnimationFrameId] = useState(null);

//   // Función para inicializar el afinador
//   const startTuning = async () => {
//     try {
//       const context = new (window.AudioContext || window.webkitAudioContext)();
//       const analyserNode = context.createAnalyser();
//       analyserNode.fftSize = 2048;

//       const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const source = context.createMediaStreamSource(mic);
//       source.connect(analyserNode);

//       setAudioContext(context);
//       setAnalyser(analyserNode);
//       setMicrophone(mic);

//       detectPitch(analyserNode, context); // Inicia la detección de la frecuencia
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//       setIsTuning(false); // Detener afinador si hay error
//     }
//   };

//   // Función para detectar la frecuencia de tono
//   const detectPitch = (analyserNode, context) => {
//     const bufferLength = analyserNode.fftSize;
//     const buffer = new Float32Array(bufferLength);
//     analyserNode.getFloatTimeDomainData(buffer);

//     const frequency = autoCorrelate(buffer, context.sampleRate);

//     if (frequency !== -1) {
//       const closestNote = getClosestNote(frequency);
//       setCurrentNote(closestNote);
//       setCurrentFrequency(frequency);
//     }

//     const frameId = requestAnimationFrame(() =>
//       detectPitch(analyserNode, context)
//     );
//     setAnimationFrameId(frameId); // Guardar el ID de animación para detenerlo más tarde
//   };

//   // Función para detener la afinación
//   const stopTuning = () => {
//     if (microphone) {
//       microphone.getTracks().forEach((track) => track.stop());
//       setMicrophone(null);
//     }
//     if (audioContext) {
//       audioContext.close();
//       setAudioContext(null);
//     }
//     cancelAnimationFrame(animationFrameId); // Detener el ciclo de animación
//     setAnalyser(null);
//     setCurrentNote(null);
//     setCurrentFrequency(null);
//   };

//   const toggleTuning = () => {
//     setIsTuning((prev) => !prev);
//   };

//   useEffect(() => {
//     if (isTuning) {
//       startTuning(); // Inicia el proceso de afinación
//     } else {
//       stopTuning(); // Detiene el afinador si no está en uso
//     }

//     return () => {
//       stopTuning(); // Limpia los recursos al desmontar el componente
//     };
//   }, [isTuning]);

//   // Auto-correlación para detectar la frecuencia del sonido
//   const autoCorrelate = (buffer, sampleRate) => {
//     let SIZE = buffer.length;
//     let sumOfSquares = 0;
//     for (let i = 0; i < SIZE; i++) {
//       let val = buffer[i];
//       sumOfSquares += val * val;
//     }
//     if (Math.sqrt(sumOfSquares / SIZE) < 0.01) return -1;

//     let r1 = 0,
//       r2 = SIZE - 1,
//       thres = 0.2;
//     for (let i = 0; i < SIZE / 2; i++) {
//       if (Math.abs(buffer[i]) < thres) {
//         r1 = i;
//         break;
//       }
//     }
//     for (let i = 1; i < SIZE / 2; i++) {
//       if (Math.abs(buffer[SIZE - i]) < thres) {
//         r2 = SIZE - i;
//         break;
//       }
//     }
//     buffer = buffer.slice(r1, r2);
//     SIZE = buffer.length;

//     let c = new Array(SIZE).fill(0);
//     for (let i = 0; i < SIZE; i++) {
//       for (let j = 0; j < SIZE - i; j++) {
//         c[i] = c[i] + buffer[j] * buffer[j + i];
//       }
//     }

//     let d = 0;
//     while (c[d] > c[d + 1]) d++;
//     let maxval = -1,
//       maxpos = -1;
//     for (let i = d; i < SIZE; i++) {
//       if (c[i] > maxval) {
//         maxval = c[i];
//         maxpos = i;
//       }
//     }
//     let T0 = maxpos;

//     let x1 = c[T0 - 1],
//       x2 = c[T0],
//       x3 = c[T0 + 1];
//     let a = (x1 + x3 - 2 * x2) / 2;
//     let b = (x3 - x1) / 2;
//     if (a) T0 = T0 - b / (2 * a);

//     return sampleRate / T0;
//   };

//   // Calcular la dirección del ajuste de la cuerda
//   const getTuningDirection = () => {
//     if (!currentNote || !currentFrequency || !targetNote) return null;
//     const targetFrequency = noteFrequencies[targetNote];

//     if (currentFrequency < targetFrequency) {
//       return "up"; // Más grave
//     } else if (currentFrequency > targetFrequency) {
//       return "down"; // Más aguda
//     } else {
//       return "in-tune"; // Afinada
//     }
//   };

//   return (
//     <div className="text-center mt-5">
//       <h2>Guitar Tuner</h2>

//       <TunerControl isTuning={isTuning} onToggleTuning={toggleTuning} />

//       {/* Paso los datos relevantes al componente TuningDisplay */}
//       <TuningDisplay
//         currentNote={currentNote}
//         currentFrequency={currentFrequency}
//         tuningDirection={getTuningDirection()}
//         targetNote={targetNote}
//         onNoteClick={setTargetNote}
//       />
//     </div>
//   );
// };

// // Función para encontrar la nota más cercana
// const getClosestNote = (frequency) => {
//   let closestNote = null;
//   let minDifference = Infinity;

//   Object.keys(noteFrequencies).forEach((note) => {
//     const diff = Math.abs(frequency - noteFrequencies[note]);
//     if (diff < minDifference) {
//       minDifference = diff;
//       closestNote = note;
//     }
//   });

//   return closestNote;
// };

// export default GuitarTuner;

// import React, { useState, useEffect } from "react";
// import TunerControl from "./TunerControl";
// import TuningIndicators from "./TuningIndicators";
// import TuningDisplay from "./TuningDisplay";
// import { noteFrequencies } from "../services/noteFrequencies";
// import NoteSelector from "./NoteSelector";
// import Oscilloscope from "./Oscilloscope";

// const GuitarTuner = () => {
//   const [currentNote, setCurrentNote] = useState(null);
//   const [currentFrequency, setCurrentFrequency] = useState(null);
//   const [isTuning, setIsTuning] = useState(false);
//   const [targetNote, setTargetNote] = useState("E2");
//   const [audioContext, setAudioContext] = useState(null);
//   const [analyser, setAnalyser] = useState(null);
//   const [microphone, setMicrophone] = useState(null);
//   const [animationFrameId, setAnimationFrameId] = useState(null);

//   // Función para inicializar el afinador
//   const startTuning = async () => {
//     try {
//       const context = new (window.AudioContext || window.webkitAudioContext)();
//       const analyserNode = context.createAnalyser();
//       analyserNode.fftSize = 2048;

//       const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const source = context.createMediaStreamSource(mic);
//       source.connect(analyserNode);

//       setAudioContext(context);
//       setAnalyser(analyserNode);
//       setMicrophone(mic);

//       detectPitch(analyserNode, context); // Inicia la detección de la frecuencia
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//       setIsTuning(false); // Detener afinador si hay error
//     }
//   };

//   // Función para detectar la frecuencia de tono
//   const detectPitch = (analyserNode, context) => {
//     const bufferLength = analyserNode.fftSize;
//     const buffer = new Float32Array(bufferLength);
//     analyserNode.getFloatTimeDomainData(buffer);

//     const frequency = autoCorrelate(buffer, context.sampleRate);

//     if (frequency !== -1) {
//       const closestNote = getClosestNote(frequency);
//       setCurrentNote(closestNote);
//       setCurrentFrequency(frequency);
//     }

//     const frameId = requestAnimationFrame(() =>
//       detectPitch(analyserNode, context)
//     );
//     setAnimationFrameId(frameId); // Guardar el ID de animación para detenerlo más tarde
//   };

//   // Función para detener la afinación
//   const stopTuning = () => {
//     if (microphone) {
//       microphone.getTracks().forEach((track) => track.stop());
//       setMicrophone(null);
//     }
//     if (audioContext) {
//       audioContext.close();
//       setAudioContext(null);
//     }
//     cancelAnimationFrame(animationFrameId); // Detener el ciclo de animación
//     setAnalyser(null);
//     setCurrentNote(null);
//     setCurrentFrequency(null);
//   };

//   const toggleTuning = () => {
//     setIsTuning((prev) => !prev);
//   };

//   useEffect(() => {
//     console.log("isTuning changed:", isTuning); // Para depuración
//     if (isTuning) {
//       startTuning(); // Inicia el proceso de afinación
//     } else {
//       stopTuning(); // Detiene el afinador si no está en uso
//     }

//     return () => {
//       stopTuning(); // Limpia los recursos al desmontar el componente
//     };
//   }, [isTuning]);

//   // Auto-correlación para detectar la frecuencia del sonido
//   const autoCorrelate = (buffer, sampleRate) => {
//     let SIZE = buffer.length;
//     let sumOfSquares = 0;
//     for (let i = 0; i < SIZE; i++) {
//       let val = buffer[i];
//       sumOfSquares += val * val;
//     }
//     if (Math.sqrt(sumOfSquares / SIZE) < 0.01) return -1;

//     let r1 = 0,
//       r2 = SIZE - 1,
//       thres = 0.2;
//     for (let i = 0; i < SIZE / 2; i++) {
//       if (Math.abs(buffer[i]) < thres) {
//         r1 = i;
//         break;
//       }
//     }
//     for (let i = 1; i < SIZE / 2; i++) {
//       if (Math.abs(buffer[SIZE - i]) < thres) {
//         r2 = SIZE - i;
//         break;
//       }
//     }
//     buffer = buffer.slice(r1, r2);
//     SIZE = buffer.length;

//     let c = new Array(SIZE).fill(0);
//     for (let i = 0; i < SIZE; i++) {
//       for (let j = 0; j < SIZE - i; j++) {
//         c[i] = c[i] + buffer[j] * buffer[j + i];
//       }
//     }

//     let d = 0;
//     while (c[d] > c[d + 1]) d++;
//     let maxval = -1,
//       maxpos = -1;
//     for (let i = d; i < SIZE; i++) {
//       if (c[i] > maxval) {
//         maxval = c[i];
//         maxpos = i;
//       }
//     }
//     let T0 = maxpos;

//     let x1 = c[T0 - 1],
//       x2 = c[T0],
//       x3 = c[T0 + 1];
//     let a = (x1 + x3 - 2 * x2) / 2;
//     let b = (x3 - x1) / 2;
//     if (a) T0 = T0 - b / (2 * a);

//     return sampleRate / T0;
//   };

//   // Calcular la dirección del ajuste de la cuerda
//   const getTuningDirection = () => {
//     if (!currentNote || !currentFrequency || !targetNote) return null;
//     const targetFrequency = noteFrequencies[targetNote];

//     if (currentFrequency < targetFrequency) {
//       return "up";
//     } else if (currentFrequency > targetFrequency) {
//       return "down";
//     } else {
//       return "in-tune";
//     }
//   };

//   return (
//     <div className="text-center mt-5">
//       <h2>Guitar Tuner</h2>

//       {/* Componente de control */}
//       <TunerControl
//         isTuning={isTuning}
//         onToggleTuning={toggleTuning} // Usa la nueva función
//       />

//       {/* Selector de nota */}
//       <NoteSelector targetNote={targetNote} onNoteChange={setTargetNote} />

//       {/* Indicadores gráficos */}
//       <TuningIndicators
//         targetNote={targetNote}
//         currentNote={currentNote}
//         currentFrequency={currentFrequency}
//         tuningDirection={getTuningDirection()}
//       />

//       {/* Nuevo TuningDisplay */}
//       <TuningDisplay
//         currentNote={currentNote}
//         currentFrequency={currentFrequency}
//         tuningDirection={getTuningDirection()}
//         targetNote={targetNote}
//         onNoteClick={setTargetNote}
//       />

//       {/* Visualización de osciloscopio */}
//       {analyser && <Oscilloscope analyser={analyser} />}
//     </div>
//   );
// };

// // Función para encontrar la nota más cercana
// const getClosestNote = (frequency) => {
//   let closestNote = null;
//   let minDifference = Infinity;

//   Object.keys(noteFrequencies).forEach((note) => {
//     const diff = Math.abs(frequency - noteFrequencies[note]);
//     if (diff < minDifference) {
//       minDifference = diff;
//       closestNote = note;
//     }
//   });

//   return closestNote;
// };

// export default GuitarTuner;
