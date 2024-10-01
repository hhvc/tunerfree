import React, { useState, useRef } from "react";
import { guitarStrings, pianoNotes } from "../services/noteFrequencies";
import "./TuningDisplay.css"; // Archivo CSS para estilos personalizados

const TuningDisplay = ({
  currentNote,
  currentFrequency,
  tuningDirection,
  targetNote,
  onNoteClick,
  viewMode = "guitar", // Por defecto en guitarra
  notationMode = "anglosajona", // Modo de notación por defecto
}) => {
  const [currentView, setCurrentView] = useState(viewMode);
  const [currentNotation, setCurrentNotation] = useState(notationMode);
  const oscillatorRef = useRef(null); // Para almacenar el oscilador actual

  // Agrupar las notas de guitarra por cuerda
  const groupedStrings = guitarStrings.reduce((acc, note) => {
    if (!acc[note.cuerda]) {
      acc[note.cuerda] = [];
    }
    acc[note.cuerda].push(note);
    return acc;
  }, {});

  // Cambiar la vista (piano o guitarra)
  const handleViewChange = (event) => {
    setCurrentView(event.target.value);
  };

  // Cambiar entre notación anglosajona o franco-belga
  const handleNotationChange = (event) => {
    setCurrentNotation(event.target.value);
  };

  // Función para obtener la notación correcta
  const getNoteDisplay = (note, notationMode) => {
    return notationMode === "anglosajona" ? note.anglosajona : note.francoBelga;
  };

  // Función para determinar la nota más cercana en todas las cuerdas o teclas de piano
  const getClosestNote = (allNotes, frequency) => {
    if (!frequency) return null;

    let closestNote = allNotes[0];
    let minDifference = Math.abs(frequency - allNotes[0].frecuencia);

    allNotes.forEach((note) => {
      const diff = Math.abs(frequency - note.frecuencia);
      if (diff < minDifference) {
        closestNote = note;
        minDifference = diff;
      }
    });

    return closestNote;
  };

  // Obtener una lista de todas las notas de todas las cuerdas
  const allNotes = guitarStrings;

  // Encontrar la nota más cercana en todas las cuerdas
  const closestNote = getClosestNote(allNotes, currentFrequency);

  // Dividir las notas de piano en filas de 12
  const pianoNotesRows = [];
  for (let i = 0; i < pianoNotes.length; i += 12) {
    pianoNotesRows.push(pianoNotes.slice(i, i + 12));
  }

  // Lógica para iluminar las teclas cercanas (la tecla principal verde y las dos adyacentes amarillas)
  const getHighlightClass = (index, closestIndex) => {
    if (index === closestIndex) return "highlighted-green"; // Verde para la tecla más cercana
    if (index === closestIndex - 1 || index === closestIndex + 1)
      return "highlighted-yellow"; // Amarillo para las teclas adyacentes
    return ""; // Sin clase para las demás teclas
  };

  // Iniciar el sonido cuando se presiona la tecla
  const startNote = (frequency) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine"; // Tipo de onda (puede ser "sine", "square", "triangle", "sawtooth")
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime); // Fijar la frecuencia de la nota
    oscillator.connect(audioCtx.destination);
    oscillator.start();

    // Guardar el oscilador en la referencia para poder detenerlo luego
    oscillatorRef.current = { oscillator, audioCtx };
  };

  // Detener el sonido cuando se suelta la tecla
  const stopNote = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.oscillator.stop();
      oscillatorRef.current.audioCtx.close();
      oscillatorRef.current = null;
    }
  };

  return (
    <div className="tuning-display">
      <h3>Tuning Display</h3>

      <div className="current-note-display">
        <p>Nota actual: {currentNote || "No detectada"}</p>
        <p>
          Frecuencia actual:{" "}
          {currentFrequency ? currentFrequency.toFixed(2) : "No disponible"} Hz
        </p>
      </div>

      <div className="target-note-display">
        <p>
          Nota objetivo:{" "}
          {targetNote ? getNoteDisplay(targetNote, currentNotation) : "Ninguna"}
        </p>
        {tuningDirection === "up" && (
          <img src="/icons/swipe_up.svg" alt="Subir frecuencia" />
        )}
        {tuningDirection === "down" && (
          <img src="/icons/swipe_down.svg" alt="Bajar frecuencia" />
        )}
        {tuningDirection === "in-tune" && <p>Afinada</p>}
      </div>

      {/* Selector de vista */}
      <div className="view-mode-selector">
        <p>Vista de guitarra o piano</p>
        <label>
          <input
            type="radio"
            value="guitar"
            checked={currentView === "guitar"}
            onChange={handleViewChange}
          />
          Guitarra
        </label>
        <label>
          <input
            type="radio"
            value="piano"
            checked={currentView === "piano"}
            onChange={handleViewChange}
          />
          Piano
        </label>
      </div>

      {/* Selector de notación */}
      <div className="notation-mode-selector">
        <p>Modo de notación:</p>
        <label>
          <input
            type="radio"
            value="anglosajona"
            checked={currentNotation === "anglosajona"}
            onChange={handleNotationChange}
          />
          Anglosajona
        </label>
        <label>
          <input
            type="radio"
            value="francoBelga"
            checked={currentNotation === "francoBelga"}
            onChange={handleNotationChange}
          />
          Franco-Belga
        </label>
      </div>
      {/* Renderizar las cuerdas de guitarra */}
      {currentView === "guitar" && (
        <div className="guitar-strings">
          {Object.keys(groupedStrings).map((cuerda) => (
            <div key={cuerda} className="guitar-string">
              {groupedStrings[cuerda].map((note) => {
                // Aplicar colores: verde para la afinación estándar, amarillo para grave/aguda
                let noteClass = "note-circle";
                if (
                  note === closestNote &&
                  note.tipo === "afinación estándar"
                ) {
                  noteClass += " highlighted-note-standard"; // Verde
                } else if (
                  note === closestNote &&
                  note.tipo !== "afinación estándar"
                ) {
                  noteClass += " highlighted-note-other"; // Amarillo
                }

                return (
                  <div
                    key={note.key}
                    className={noteClass}
                    onClick={() => onNoteClick(note)}
                  >
                    {getNoteDisplay(note, currentNotation)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {/* Renderizar las notas de piano en 12 columnas */}
      {currentView === "piano" && (
        <div className="piano-keys">
          {pianoNotesRows.map((row, rowIndex) => (
            <div key={rowIndex} className="piano-row">
              {row.map((note, index) => {
                // Buscar la posición más cercana a la nota captada
                const closestIndex = pianoNotes.findIndex(
                  (n) =>
                    n.anglosajona === closestNote?.anglosajona ||
                    n.francoBelga === closestNote?.francoBelga
                );
                const highlightClass = getHighlightClass(
                  index + rowIndex * 12,
                  closestIndex
                );
                return (
                  <div
                    key={index}
                    className={`piano-key ${highlightClass}`}
                    onMouseDown={() => {
                      startNote(note.frecuencia); // Iniciar sonido al presionar
                      onNoteClick(note);
                    }}
                    onMouseUp={stopNote} // Detener sonido al soltar
                    onMouseLeave={stopNote} // Detener si el clic se suelta fuera de la tecla
                  >
                    {getNoteDisplay(note, currentNotation)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TuningDisplay;

// import React, { useState, useEffect } from "react";
// import { guitarStrings, pianoNotes } from "../services/noteFrequencies";
// import "./TuningDisplay.css"; // Archivo CSS para estilos personalizados

// const TuningDisplay = ({
//   currentNote,
//   currentFrequency,
//   tuningDirection,
//   targetNote,
//   onNoteClick,
//   viewMode = "guitar", // Se puede cambiar a piano
//   notationMode = "anglosajona", // Se puede cambiar a francoBelga según la selección
// }) => {
//   // Estado local para cambiar la notación
//   const [currentView, setcurrentView] = useState(viewMode); // 'piano' o 'guitar'
//   const [currentNotation, setCurrentNotation] = useState(notationMode);
//   const notesList = currentView === "piano" ? pianoNotes : guitarStrings;

//   const handleViewChange = (event) => {
//     setcurrentView(event.target.value); // Actualiza la notación seleccionada
//   };

//   const handleNotationChange = (event) => {
//     setCurrentNotation(event.target.value); // Actualiza la notación seleccionada
//   };

//   const getNoteDisplay = (note, notationMode = "anglosajona") => {
//     // Buscamos la nota en el array de guitarStrings
//     const foundNote = notesList.find((string) => string.key === note);

//     // Si encontramos la nota, retornamos la notación correspondiente
//     if (foundNote) {
//       return foundNote[notationMode] || "Error: Notación no encontrada";
//     } else {
//       return "Nota no encontrada";
//     }
//   };

//   return (
//     <div className="tuning-display">
//       <h3>Tuning Display</h3>

//       {/* Renderizar la nota actual y la frecuencia detectada */}
//       <div className="current-note-display">
//         <p>Nota actual: {currentNote || "No detectada"}</p>
//         <p>
//           Frecuencia actual:{" "}
//           {currentFrequency ? currentFrequency.toFixed(2) : "No disponible"} Hz
//         </p>
//       </div>

//       {/* Renderizar la nota objetivo */}
//       <div className="target-note-display">
//         <p>Nota objetivo: {getNoteDisplay(targetNote)}</p>

//         {/* Mostrar ícono swipe_up o swipe_down según el ajuste necesario */}
//         {tuningDirection === "up" && (
//           <img src="/icons/swipe_up.svg" alt="Subir frecuencia" />
//         )}
//         {tuningDirection === "down" && (
//           <img src="/icons/swipe_down.svg" alt="Bajar frecuencia" />
//         )}
//         {tuningDirection === "in-tune" && <p>Afinada</p>}
//       </div>

//       {/* Selector de vista */}
//       <div className="view-mode-selector">
//         <p>Vista de guitarra o piano</p>
//         <label>
//           <input
//             type="radio"
//             value="guitar"
//             checked={currentView === "guitar"}
//             onChange={handleViewChange}
//           />
//           Guitarra
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="piano"
//             checked={currentView === "piano"}
//             onChange={handleViewChange}
//           />
//           Piano
//         </label>
//       </div>

//       {/* Selector de notación */}
//       <div className="notation-mode-selector">
//         <p>Modo de notación:</p>
//         <label>
//           <input
//             type="radio"
//             value="anglosajona"
//             checked={currentNotation === "anglosajona"}
//             onChange={handleNotationChange}
//           />
//           Anglosajona
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="francoBelga"
//             checked={currentNotation === "francoBelga"}
//             onChange={handleNotationChange}
//           />
//           Franco-Belga
//         </label>
//       </div>

//       {/* Renderizar las notas de guitarra y piano) */}
//       <div className="notes-list">
//         {notesList.map((note, index) => {
//           const isClosestNote = note === currentNote;
//           const noteClass = `note ${isClosestNote ? "highlighted" : ""}`; // Combinar clases en una sola variable

//           // Aplicamos el estilo del piano solo si la vista es 'piano'
//           const style =
//             currentView === "piano"
//               ? { width: "50px", height: "150px", margin: "5px" }
//               : {};

//           return (
//             <div
//               key={index}
//               className={noteClass} // Aplicamos la clase combinada
//               style={style}
//               onClick={() => onNoteClick(note)}
//             >
//               {getNoteDisplay(note.key, currentNotation)}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default TuningDisplay;

// import React, { useState, useEffect } from "react";
// import { guitarStrings, pianoNotes } from "../services/noteFrequencies"; // Asegúrate de que estas notas estén definidas
// import "./TuningDisplay.css";

// const TuningDisplay = ({ currentFrequency }) => {
//   const [viewMode, setViewMode] = useState("guitar"); // 'piano' o 'guitar'
//   const [notationMode, setNotationMode] = useState("anglosajona"); // 'francoBelga' o 'anglosajona'
//   const [currentNote, setCurrentNote] = useState(null); // La nota actual captada por el micrófono

//   const notesList = viewMode === "piano" ? pianoNotes : guitarStrings;

//   // Encuentra la nota más cercana a la frecuencia actual captada por el micrófono
//   useEffect(() => {
//     if (currentFrequency) {
//       const closestNote = findClosestNote(currentFrequency, notesList);
//       setCurrentNote(closestNote);
//     } else {
//       // Si no se está captando ninguna nota, mostramos C4 como predeterminado
//       const defaultNote = notesList.find(
//         (note) => note.key === (viewMode === "guitar" ? 4 : 40)
//       );
//       setCurrentNote(defaultNote);
//     }
//   }, [currentFrequency, viewMode, notesList]);

//   // Función para encontrar la nota más cercana a la frecuencia
//   const findClosestNote = (frequency, notes) => {
//     return notes.reduce((prev, curr) => {
//       return Math.abs(curr.frecuencia - frequency) <
//         Math.abs(prev.frecuencia - frequency)
//         ? curr
//         : prev;
//     });
//   };

//   // Obtener la nota más grave y la nota más aguda alrededor de la nota actual
//   const getSurroundingNotes = (note) => {
//     const noteIndex = notesList.findIndex((n) => n === note);
//     const lowerNote = notesList[noteIndex - 1] || null;
//     const higherNote = notesList[noteIndex + 1] || null;
//     return { lowerNote, higherNote };
//   };

//   const { lowerNote, higherNote } = currentNote
//     ? getSurroundingNotes(currentNote)
//     : { lowerNote: null, higherNote: null };

//   // Manejadores de eventos para los selectores de vista y notación
//   const handleViewModeChange = (e) => {
//     setViewMode(e.target.value);
//   };

//   const handleNotationModeChange = (e) => {
//     setNotationMode(e.target.value);
//   };

//   return (
//     <div>
//       {/* Selector para Notación */}
//       <div className="notation-switch">
//         <label>
//           <input
//             type="radio"
//             value="anglosajona"
//             checked={notationMode === "anglosajona"}
//             onChange={handleNotationModeChange}
//           />
//           Notación Anglosajona
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="francoBelga"
//             checked={notationMode === "francoBelga"}
//             onChange={handleNotationModeChange}
//           />
//           Notación Franco-Belga
//         </label>
//       </div>

//       {/* Selector para visualización */}
//       <div className="view-switch">
//         <label>
//           <input
//             type="radio"
//             value="guitar"
//             checked={viewMode === "guitar"}
//             onChange={handleViewModeChange}
//           />
//           Ver cuerdas de guitarra
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="piano"
//             checked={viewMode === "piano"}
//             onChange={handleViewModeChange}
//           />
//           Ver teclas de piano
//         </label>
//       </div>

//       {/* Contenedor principal de la visualización */}
//       <div className="tuning-display-container">
//         {/* Columna izquierda: Notas */}
//         <div className="notes-column">
//           <table>
//             <thead>
//               <tr>
//                 <th>Nota</th>
//                 <th>Frecuencia (Hz)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {notesList.map((note) => (
//                 <tr key={note.key}>
//                   <td>
//                     {notationMode === "anglosajona"
//                       ? note.anglosajona
//                       : note.francoBelga}
//                   </td>
//                   <td>{note.frecuencia.toFixed(2)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Columna derecha: Nota actual */}
//         <div className="current-note-column">
//           <div className="current-note-box">
//             {higherNote && (
//               <div className="smaller-note">
//                 {notationMode === "anglosajona"
//                   ? higherNote?.anglosajona
//                   : higherNote?.francoBelga}{" "}
//                 {higherNote?.frecuencia?.toFixed(2)} Hz
//               </div>
//             )}

//             {/* Asegurarnos de que currentNote no sea null */}
//             {currentNote && (
//               <h4>
//                 {notationMode === "anglosajona"
//                   ? currentNote.anglosajona
//                   : currentNote.francoBelga}{" "}
//                 {currentNote.frecuencia.toFixed(2)} Hz
//               </h4>
//             )}

//             {lowerNote && (
//               <div className="smaller-note">
//                 {notationMode === "anglosajona"
//                   ? lowerNote?.anglosajona
//                   : lowerNote?.francoBelga}{" "}
//                 {lowerNote?.frecuencia?.toFixed(2)} Hz
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TuningDisplay;

// const TuningDisplay = ({
//   currentNote,
//   currentFrequency,
//   tuningDirection,
//   targetNote,
//   onNoteClick,
// }) => {
//   const [viewMode, setViewMode] = useState("guitar"); // 'piano' o 'guitar'
//   const [notationMode, setNotationMode] = useState("anglosajona"); // 'francoBelga' o 'anglosajona'
//   const [selectedNote, setSelectedNote] = useState(null); // Para guardar la nota seleccionada manualmente

//   const handleViewModeChange = (e) => {
//     setViewMode(e.target.value);
//   };

//   const handleNotationModeChange = (e) => {
//     setNotationMode(e.target.value);
//   };

//   // Manejar la selección de nota
//   const handleNoteClick = (note) => {
//     setSelectedNote(note); // Actualiza la nota seleccionada
//     onNoteClick(note); // Si tienes una función para pasar la nota seleccionada al componente padre
//   };

//   // Obtener el ícono de la dirección de afinación (solo si hay una nota seleccionada)
//   const getNoteIcon = () => {
//     if (tuningDirection === "up") {
//       return "🔺"; // Más grave
//     } else if (tuningDirection === "down") {
//       return "🔻"; // Más aguda
//     } else if (tuningDirection === "in-tune") {
//       return "✅"; // Afinada
//     } else {
//       return "";
//     }
//   };

//   // Define las notas a mostrar (piano o guitarra)
//   const notesList = viewMode === "piano" ? pianoNotes : guitarStrings;

//   return (
//     <div>
//       {/* Selectores para Notación y Modo de Vista */}
//       <div className="notation-switch">
//         <label>
//           <input
//             type="radio"
//             value="anglosajona"
//             checked={notationMode === "anglosajona"}
//             onChange={handleNotationModeChange}
//           />
//           Notación Anglosajona
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="francoBelga"
//             checked={notationMode === "francoBelga"}
//             onChange={handleNotationModeChange}
//           />
//           Notación Franco-Belga
//         </label>
//       </div>

//       <div className="view-switch">
//         <label>
//           <input
//             type="radio"
//             value="guitar"
//             checked={viewMode === "guitar"}
//             onChange={handleViewModeChange}
//           />
//           Ver cuerdas de guitarra
//         </label>
//         <label>
//           <input
//             type="radio"
//             value="piano"
//             checked={viewMode === "piano"}
//             onChange={handleViewModeChange}
//           />
//           Ver teclas de piano
//         </label>
//       </div>

//       <div className="tuning-display-container">
//         {/* Columna de las notas */}
//         <div className="tuning-column guitar-notes">
//           <table className="notes-table">
//             <thead>
//               <tr>
//                 <th>Nota</th>
//                 <th>Frecuencia (Hz)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {notesList.map((note) => (
//                 <tr
//                   key={note.key}
//                   className={`guitar-note
//                     ${note.anglosajona === currentNote ? "highlighted" : ""}
//                     ${note.anglosajona === selectedNote ? "selected" : ""}`}
//                   onClick={() => handleNoteClick(note.anglosajona)}
//                 >
//                   <td>
//                     {notationMode === "anglosajona"
//                       ? note.anglosajona
//                       : note.francoBelga}
//                   </td>
//                   <td>{note.frecuencia.toFixed(2)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Columna de la nota captada */}
//         <div className="tuning-column current-note-box">
//           <h4>Nota actual</h4>
//           <p>{currentNote || "Ninguna"}</p>
//           <p>
//             {currentFrequency ? `${currentFrequency.toFixed(2)} Hz` : "N/A"}
//           </p>
//           {targetNote && <div className="note-icon">{getNoteIcon()}</div>}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TuningDisplay;

// import React from "react";
// import { noteFrequencies } from "../services/noteFrequencies";
// import "./TuningDisplay.css";

// const TuningDisplay = ({
//   currentNote,
//   currentFrequency,
//   tuningDirection,
//   targetNote,
//   onNoteClick,
// }) => {
//   // Función para obtener el estilo de la nota de guitarra (izquierda)
//   const getNoteStyle = (note) => {
//     const isActive = currentNote === note;
//     const isSelected = targetNote === note;
//     if (isActive) {
//       return { backgroundColor: "green", color: "#fff", fontWeight: "bold" };
//     } else if (isSelected) {
//       return { backgroundColor: "#ccc", fontWeight: "bold" };
//     } else {
//       return {};
//     }
//   };

//   return (
//     <div className="tuning-display-container">
//       <div className="tuning-column">
//         <h5>Notas de Guitarra</h5>
//         <div className="guitar-notes">
//           {Object.keys(noteFrequencies).map((note) => (
//             <div
//               key={note}
//               className="guitar-note"
//               onClick={() => onNoteClick(note)}
//               style={getNoteStyle(note)}
//             >
//               {note}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="tuning-column">
//         <h5>Nota Actual</h5>
//         <div className="current-note-box">
//           <h4>{currentNote || "N/A"}</h4>
//           {currentFrequency && (
//             <p>Frecuencia: {currentFrequency.toFixed(2)} Hz</p>
//           )}
//           {/* Mostrar solo la flecha que corresponde */}
//           {tuningDirection === "up" && (
//             <img
//             src="../../public/icons/swipe_up.svg"
//               // src="../../../public/icons/swipe_up.svg"
//               alt="Subir afinación"
//               style={{ width: "30px", height: "30px", color: "green" }}
//             />
//           )}
//           {tuningDirection === "down" && (
//             <img
//               src="../../public/icons/swipe_down.svg"
//               alt="Bajar afinación"
//               style={{ width: "30px", height: "30px", color: "green" }}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TuningDisplay;

// import React from "react";
// import SwipeUpIcon from "@mui/icons-material/SwipeUp";
// import SwipeDownIcon from "@mui/icons-material/SwipeDown";
// import { noteFrequencies } from "../services/noteFrequencies";
// import "./TuningDisplay.css";

// const TuningDisplay = ({
//   currentNote,
//   currentFrequency,
//   tuningDirection,
//   targetNote,
//   onNoteClick,
// }) => {
//   // Función para obtener el estilo de la nota de guitarra (izquierda)
//   const getNoteStyle = (note) => {
//     const isActive = currentNote === note;
//     const isSelected = targetNote === note;
//     if (isActive) {
//       return { backgroundColor: "green", color: "#fff", fontWeight: "bold" };
//     } else if (isSelected) {
//       return { backgroundColor: "#ccc", fontWeight: "bold" };
//     } else {
//       return {};
//     }
//   };

//   return (
//     <div className="tuning-display-container">
//       <div className="tuning-column">
//         <h5>Notas de Guitarra</h5>
//         <div className="guitar-notes">
//           {Object.keys(noteFrequencies).map((note) => (
//             <div
//               key={note}
//               className="guitar-note"
//               onClick={() => onNoteClick(note)}
//               style={getNoteStyle(note)}
//             >
//               {note}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="tuning-column">
//         <h5>Nota Actual</h5>
//         <div className="current-note-box">
//           <h4>{currentNote || "N/A"}</h4>
//           {currentFrequency && (
//             <p>Frecuencia: {currentFrequency.toFixed(2)} Hz</p>
//           )}
//           {/* Mostrar solo la flecha que corresponde */}
//           {tuningDirection === "up" && (
//             <SwipeUpIcon style={{ color: "green", fontSize: "2rem" }} />
//           )}
//           {tuningDirection === "down" && (
//             <SwipeDownIcon style={{ color: "green", fontSize: "2rem" }} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TuningDisplay;
