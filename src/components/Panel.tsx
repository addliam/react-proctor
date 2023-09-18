import React from "react";

interface SwitchSemaforoProps {
  field: String;
  status: Boolean;
}
const SwitchSemaforo = ({ field, status }: SwitchSemaforoProps) => {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <div>{field}</div>
      <div
        style={{
          borderRadius: "50%",
          width: "1rem",
          height: "1rem",
          backgroundColor: status ? "#34eb46" : "black",
        }}
      ></div>
      <div
        style={{
          borderRadius: "50%",
          width: "1rem",
          height: "1rem",
          backgroundColor: !status ? "#f20c0c" : "black",
        }}
      ></div>
    </div>
  );
};
interface PanelProps {
  pantalla: Boolean;
  camara: Boolean;
  fullScreen: Boolean;
  rostro: Boolean;
}
const Panel = ({ pantalla, camara, fullScreen, rostro }: PanelProps) => {
  return (
    <div
      style={{
        backgroundColor: "yellow",
        borderRadius: "5px",
        padding: "8px 16px",
      }}
    >
      <h4>Panel</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
        <SwitchSemaforo field="Pantalla" status={pantalla} />
        <SwitchSemaforo field="Camara" status={camara} />
        <SwitchSemaforo field="FullScreen" status={fullScreen} />
        <SwitchSemaforo field="Rostro" status={rostro} />
      </div>
    </div>
  );
};

export default Panel;
