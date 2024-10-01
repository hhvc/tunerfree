import React from "react";

const TunerControl = ({ isTuning, onToggleTuning }) => {
  return (
    <button
      style={{
        padding: "10px 20px",
        fontSize: "1rem",
        backgroundColor: isTuning ? "#dc3545" : "#007bff", // Rojo para stop, azul para start
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background-color 0.3s",
      }}
      onClick={onToggleTuning}
    >
      {isTuning ? "Stop Tuning" : "Start Tuning"}
    </button>
  );
};

export default TunerControl;

// import React from "react";
// import { Button } from "react-bootstrap";

// const TunerControl = ({ isTuning, onToggleTuning }) => {
//   return (
//     <Button
//       variant={isTuning ? "danger" : "primary"}
//       onClick={onToggleTuning} // Cambiar aquí
//     >
//       {isTuning ? "Stop Tuning" : "Start Tuning"}
//     </Button>
//   );
// };

// export default TunerControl;
