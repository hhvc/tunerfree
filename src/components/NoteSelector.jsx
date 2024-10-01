import React from "react";
import { noteFrequencies } from "../services/noteFrequencies";

const NoteSelector = ({ targetNote, onNoteChange }) => {
  return (
    <div>
      <h4 style={{ textAlign: "center" }}>Nota objetivo:</h4>
      <select
        style={{
          display: "block",
          margin: "0 auto",
          padding: "10px",
          fontSize: "1rem",
          textAlign: "center",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
        value={targetNote}
        onChange={(e) => onNoteChange(e.target.value)}
      >
        {Object.keys(noteFrequencies).map((note) => (
          <option key={note} value={note}>
            {note}
          </option>
        ))}
      </select>
    </div>
  );
};

export default NoteSelector;

// import React from "react";
// import { Form } from "react-bootstrap";
// import { noteFrequencies } from "../guitar_services/noteFrequencies";

// const NoteSelector = ({ targetNote, onNoteChange }) => {
//   return (
//     <div>
//       <h4>Nota objetivo:</h4>
//       <Form.Select
//         style={{ textAlign: "center" }}
//         value={targetNote}
//         onChange={(e) => onNoteChange(e.target.value)}
//         className="mb-3"
//       >
//         {Object.keys(noteFrequencies).map((note) => (
//           <option key={note} value={note}>
//             {note}
//           </option>
//         ))}
//       </Form.Select>
//     </div>
//   );
// };

// export default NoteSelector;
