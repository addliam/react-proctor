import { useState, useEffect, useRef } from "react";
import "./App.css";
import alertAudioSource from "./assets/amber_alert_short.mp3";
import FaceDetection from "./components/FaceDetection";
import ScreenShare from "./components/ScreenShare";
// servicio de conexion websocket
import { socketService } from "./services/socketService";
import Panel from "./components/Panel";
import { socket } from "./socket";
import { config } from "./config";

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
  // valores necesarios para las API call
  const [userId, setUserId] = useState("");
  const [testId, setTestId] = useState("");
  const [duracionSegundos, setDuracionSegundos] = useState<Number>(0);
  // websocket
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [socketId, setSocketId] = useState("null-id");
  // estados de verificacion, camaraActiva, pantallaCompartida
  const [camaraActiva, setCamaraActiva] = useState<Boolean>(false);
  const [pantallaCompartida, setPantallaCompartida] = useState<Boolean>(false);
  const [rostroDetectado, setRostroDetectado] = useState<Boolean>(false);
  // valor cargado posteriormente por websocket
  const [userTestId, setUserTestId] = useState<string | null>("");

  // manejador de finalizacion de prueba  para finalizacion automatico cuando se alcance el tope de eventos
  useEffect(() => {
    if (strikeHistory.length >= config.numeroMaximoEventos) {
      console.log(
        `Se alcanzo el numero maximo de eventos: ${config.numeroMaximoEventos}.\nFinalizando test`
      );
      finishTest();
    }
    return () => {};
  }, [strikeHistory]);

  useEffect(() => {
    // TODO: cambiar esto
    // Iniciar DATA por defecto hard-codeados, en implementacion sera dinamico
    setUserId("U1809-1219");
    setTestId("TEST2");
    setDuracionSegundos(1 * 60 * 10);
    // conexion socket inicial
    socketService.connect((socketId: any) => {
      setSocketId(socketId);
      setIsConnected(true);
    });
    // setSocketId("id");
    return () => {};
  }, []);

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
      let idEvento = 3;
      addStrikeHistory(
        "fullscreen",
        `Salio de pantalla completa - ${idEvento}`
      );
      // Registrar evento en el backend por conexion websocket
      socketService.emitLogEvent(`${idEvento}`);
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
        let idEvento = 2;
        addStrikeHistory("pestana", `Salio de pestana - ${idEvento}`);
        // Registrar evento en el backend por conexion websocket
        socketService.emitLogEvent(`${idEvento}`);

        setShouldPlayAlertAudio(true);
        // tomar captura de pantalla cuando hay un cambio de pestana
        // establecer un tiempo de espera moderado para tener una buena captura de la pantalla del candidato
        const tiempoEsperaCapturaPantallaMs = 1000;
        setTimeout(() => {
          callFunctionScreenShare();
        }, tiempoEsperaCapturaPantallaMs);
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
    // revisar si se inicializo la camara y pantalla compartida
    console.log({ camaraActiva, pantallaCompartida });
    if (!camaraActiva || !pantallaCompartida) {
      alert("ERROR. La camara y pantalla deben inicialiarze!");
      return;
    }
    // Inicializar llamada "start" en websocket
    console.log("Starting conn");
    socketService.emitStart(userId, testId, duracionSegundos);
    // obtener userTestId dado por sockets
    socket.once("usuario_test_id", (...args) => {
      // obtiene el userTest asignado
      let asssignedUserTestId = args[0];
      // si la respuesta del usuario_test_id se nula o no existe quiere decir que el test no esta disponible
      if (!asssignedUserTestId || asssignedUserTestId === "null") {
        setUserTestId(null);
        finishTest();
        alert("Prueba no disponible!");
        return;
      } else {
        setUserTestId(asssignedUserTestId);
        // Iniciar propias de la funcionalidad supervision
        setDocumentFullScreen();
        let tiempoDemoraMillis = 1000;
        // El tiempo de demora es necesario para que no haya una race condition y marque un strike inicial en el historial
        // El tiempo de demora varia de acuerdo a los recurso de la pc
        setTimeout(() => {
          setIsTestTime(true);
        }, tiempoDemoraMillis);
      }
    });
  };
  const finishTest = () => {
    setIsTestTime(false);
    alert("La prueba ha finalizado!");
  };

  document.body.addEventListener("beforeunload", function (event) {
    // Cancel the event as a fallback
    event.preventDefault();

    // Chrome requires returnValue to be set
    const confirmationMessage = "Are you sure you want to leave this page?";

    return confirmationMessage;
  });

  // mensaje de confirmacion al salir
  const thereAreUnsavedChanges = (): boolean => {
    // TODO: cambiar esta funcion de acuerdo a algun estado
    return true;
  };
  function onBeforeUnload(e: any) {
    if (thereAreUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = "";
      return;
    }
    delete e["returnValue"];
  }
  window.addEventListener("beforeunload", onBeforeUnload);
  // crear referencia a ScreenShare para acceder a su funcion captureFrame
  const screenShareRef = useRef<any>(null);
  const callFunctionScreenShare = () => {
    screenShareRef.current.captureFrame();
  };

  return (
    <div>
      {/* <PreventExit /> */}
      <div style={{ position: "fixed", right: 10 }}>
        <Panel
          pantalla={pantallaCompartida}
          camara={camaraActiva}
          fullScreen={isFullScreen}
          rostro={rostroDetectado}
        />
      </div>
      <h1>React Proctor</h1>
      <p>
        VITE_BACKEND_SUPERVISION_API{" "}
        {import.meta.env.VITE_BACKEND_SUPERVISION_API}
      </p>
      <h4>DATA PARA LA COMUNICACION CON APIS</h4>
      {
        <>
          <p>userId: {userId}</p>
          <p>testId: {testId}</p>
          <p>duracionSegundos: {`${duracionSegundos}`}</p>
        </>
      }
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores in
        consectetur molestiae doloremque dignissimos ratione aut.
      </p>
      {
        <p>
          Connectado a websocket: {`${isConnected}`} - {socketId}
        </p>
      }
      <FaceDetection
        userTestId={`${userTestId}`}
        addStrikeHistoryFunction={addStrikeHistory}
        isTestTime={isTestTime}
        stateHandler={setCamaraActiva}
        setRostroDetectado={setRostroDetectado}
      />
      {/* Pasar la funcion hija ScreenShare al padre App.tsx  */}
      <ScreenShare
        userTestId={`${userTestId}`}
        ref={screenShareRef}
        stateHandler={setPantallaCompartida}
      />
      {/* <button onClick={() => callFunctionScreenShare()}>Capturar Frame</button> */}
      <h3>
        Numero strikes: {strikeHistory.length} - Esta pantalla completa:{" "}
        {isFullScreen ? "SI" : "NO"}
      </h3>
      <h4>HISTORIAL - USERTESTID: {userTestId}</h4>
      {strikeHistory.length > 0 &&
        strikeHistory.map((element: StrikeElement, indx) => (
          <p key={indx}>
            {element.type} - {element.description} - {element.timestamp}
          </p>
        ))}
      <button onClick={() => setupTest()}>Empezar prueba</button>
      <button onClick={() => finishTest()}>Finalizar prueba</button>
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
