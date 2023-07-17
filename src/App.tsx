import { useState, useEffect } from "react";
import "./App.css";
import alertAudioSource from "./assets/amber_alert_short.mp3";
import FaceDetection from "./components/FaceDetection";

interface StrikeElement {
  type: string;
  description: string;
  timestamp: string;
}

function App() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [shouldPlayAlertAudio, setShouldPlayAlertAudio] = useState(false);
  const [strikeHistory, setStrikeHistory] = useState<StrikeElement[]>([]);
  const [isTestTime, setIsTestTime] = useState(false);

  // Bloquear el evento de copiar
  document.addEventListener("copy", (event) => {
    event.preventDefault();
  });
  // Bloquear el evento de pegar
  document.addEventListener("paste", (event) => {
    event.preventDefault();
  });
  // Bloquear el evento de clic derecho en la página
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  // enlace al formulario de Google Form
  const googleFormLink =
    "https://docs.google.com/forms/d/e/1FAIpQLSdh7kAjkq9W0pi2D7zWstRASiJ_FseetRGd-TyyikJXcgcdEA/viewform";

  // funciona para agregar strike al historial, se agrega timestamp automatico
  const addStrikeHistory = (type: string, description: string) => {
    // const timestamp = new Date().getTime();
    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", "");
    let strike: StrikeElement = {
      type: type,
      description: description,
      timestamp: `${timestamp}`,
    };
    setStrikeHistory((prev) => [...prev, strike]);
    return strike;
  };

  // sonar el audio en funcion del estado shouldPlayAlertAudio
  const audio = new Audio(alertAudioSource);
  useEffect(() => {
    if (shouldPlayAlertAudio) {
      audio.play();
    } else {
      audio.pause();
    }
    return () => {};
  }, [shouldPlayAlertAudio]);

  useEffect(() => {
    if (!isFullScreen && isTestTime) {
      addStrikeHistory("fullscreen", "Salio de pantalla completa");
    }
    return () => {};
  }, [isFullScreen, isTestTime]);

  // Pantalla completa: Revisa si el alto de la pantalla es acorde con el de la ventana, debe estar cerrado las Dev Tools
  useEffect(() => {
    const handleResize = () => {
      setIsFullScreen(
        checkIfMatchesMarginError(window.innerHeight, screen.height)
      );
    };
    const heightMarginError = 3;
    const checkIfMatchesMarginError = (num: number, comparision: number) => {
      const min = comparision - heightMarginError;
      const max = comparision + heightMarginError;
      return num >= min && num <= max;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Revisar si esta haciendo foco a la pestana y pagina actual
  useEffect(() => {
    const focusFunction = () => {
      console.log("Focus trigger!");
      document.title = "React Proctor";
      setShouldPlayAlertAudio(false);
    };
    const blurFunction = () => {
      // Esta funcion se activa cuando cambia de pestana o cambia aplicacion (ALT+TAB)
      // Verificar si el elemento activo está dentro del iframe (solo si usariamos Google Form)
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "IFRAME") {
        // El cambio de foco ocurrió dentro del iframe
        return;
      }
      if (isTestTime) {
        document.title = "Alerta! Vuelve a la prueba";
        addStrikeHistory("pestana", "Salio de pestana");
        setShouldPlayAlertAudio(true);
      }
    };
    window.addEventListener("focus", focusFunction);
    window.addEventListener("blur", blurFunction);

    return () => {
      window.removeEventListener("focus", focusFunction);
      window.removeEventListener("blur", blurFunction);
    };
  }, [isTestTime]);

  // solicitar pantalla completa al navegador
  const setDocumentFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  // preparacion para empezar el Test
  const setupTest = () => {
    setDocumentFullScreen();
    // El tiempo de demora es necesario para que no haya una race condition y marque un strike inicial en el historial
    setTimeout(() => {
      setIsTestTime(true);
    }, 300);
  };

  return (
    <div>
      <h1>React Proctor</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores in
        consectetur molestiae doloremque dignissimos ratione aut.
      </p>
      <FaceDetection />
      <h3>
        Numero strikes: {strikeHistory.length} - Esta pantalla completa:{" "}
        {isFullScreen ? "SI" : "NO"}
      </h3>
      <h4>HISTORIAL</h4>
      {strikeHistory.length > 0 &&
        strikeHistory.map((element: StrikeElement, indx) => (
          <p key={indx}>
            {element.type} - {element.description} - {element.timestamp}
          </p>
        ))}
      <button onClick={() => setupTest()}>Empezar prueba</button>
      <br />
      <div>
        {/* clase css `no-select` desactiva la seleccion de texto para copiar */}
        <p className="no-select">
          1. No puedes seleccionar este contenido. Lorem ipsum dolor sit amet
          consectetur, adipisicing elit. Quaerat accusantium dolorum cumque
          mollitia adipisci veritatis incidunt, quibusdam fuga assumenda
          suscipit provident explicabo blanditiis modi voluptatibus cupiditate
          consequuntur deserunt inventore qui!
        </p>
        <div
          className="iframe-container"
          style={{ width: "100%", height: "auto" }}
        >
          <iframe
            style={{ width: "90%", height: "90vh" }}
            src={`${googleFormLink}?embedded=true`}
            title="Google Forms"
          ></iframe>
        </div>
        <button type="submit">Enviar</button>
      </div>
    </div>
  );
}

export default App;
