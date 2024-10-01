import React from "react";

const TuningIndicators = ({
  targetNote,
  currentNote,
  currentFrequency,
  tuningDirection,
}) => {
  // Flechas de ajuste con color
  const getArrowColor = (direction) => {
    return tuningDirection === direction ? "green" : "#9e9e9e";
  };

  return (
    <div className="mt-4">
      {/* Reloj con la nota objetivo */}
      <div style={{ display: "inline-block", marginRight: "50px" }}>
        <h5>Nota objetivo: {targetNote}</h5>
        <div style={{ position: "relative", width: "120px", height: "120px" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px solid #333",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <h4>{targetNote}</h4>
          </div>
          {/* Flechas */}
          {tuningDirection === "down" && (
            <img
              src="../../public/icons/swipe_down.svg"
              alt="Bajar afinación"
              style={{
                position: "absolute",
                top: "20%",
                right: "20%",
                width: "30px",
                height: "30px",
                color: getArrowColor("down"),
              }}
            />
          )}
          {tuningDirection === "up" && (
            <img
              src="../../public/icons/swipe_up.svg"
              alt="Subir afinación"
              style={{
                position: "absolute",
                top: "80%",
                right: "20%",
                width: "30px",
                height: "30px",
                color: getArrowColor("up"),
              }}
            />
          )}
        </div>
      </div>

      {/* Reloj con la nota actual */}
      <div style={{ display: "inline-block" }}>
        <h5>Nota actual:</h5>
        <div style={{ position: "relative", width: "120px", height: "120px" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px solid #333",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <h4>{currentNote || "N/A"}</h4>
          </div>
        </div>
        {currentFrequency && (
          <h6>Frecuencia: {currentFrequency.toFixed(2)} Hz</h6>
        )}
      </div>
    </div>
  );
};

export default TuningIndicators;
