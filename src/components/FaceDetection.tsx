import * as faceapi from "face-api.js";
import React, { useState, useRef, useEffect } from "react";

interface FaceDetectionProps {
  addStrikeHistoryFunction: Function;
  isTestTime: Boolean;
  stateHandler: Function;
}
// socketServicio
import { socketService } from "../services/socketService";

function FaceDetection({
  addStrikeHistoryFunction,
  isTestTime,
  stateHandler,
}: FaceDetectionProps) {
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [timer, setTimer] = useState<number>(10); // New state variable

  const videoRef = useRef<HTMLVideoElement>(null);
  const standard = {
    "2160p": [3840, 2160],
    "1440p": [2560, 1440],
    "1080p": [1920, 1080],
    "720p": [1280, 720],
    "480p": [854, 480],
    "360p": [640, 360],
    "240p": [426, 240],
    "144p": [256, 144],
  };
  const resolution = "144p";
  const videoWidth = standard[resolution][0];
  const videoHeight = standard[resolution][1];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isTestTime) {
      if (timer >= 5000) {
        // window.alert("No se detecto rostro en 4 segundos");
        let idEvento = 1;
        addStrikeHistoryFunction(
          "webcam",
          `No se detecto rostro en 5 segundos - ${idEvento}`
        );
        setTimer(0); // Reset the timer
        // Registrar evento en el backend por conexion websocket
        socketService.emitLogEvent(`${idEvento}`);
      }
    }

    return () => {};
  }, [timer, isTestTime]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = import.meta.env.BASE_URL + "/models";
      Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)]).then(
        () => setModelsLoaded(true)
      );
    };
    loadModels();
  }, []);

  const startVideo = () => {
    // inicializar estado "camaraActiva" usando el handler
    stateHandler(true);
    // funcionamiento
    setCaptureVideo(true);
    setFaceDetected(false);
    // setTimer(0); // Reset timer when starting video
    navigator.mediaDevices
      .getUserMedia({ video: { width: videoWidth, height: videoHeight } })
      .then((stream) => {
        let video: HTMLVideoElement | null = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef.current) {
        canvasRef.current.appendChild(
          faceapi.createCanvasFromMedia(videoRef.current!)
        );
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi.detectAllFaces(
          videoRef.current!,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length === 0) {
          setFaceDetected(false); // Update faceDetected state
          setTimer((prev) => prev + 100); // Increment the timer by 100ms
        } else {
          setFaceDetected(true); // Update faceDetected state
          setTimer(0); // Reset the timer
        }

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        if (canvasRef.current) {
          const canvasElement = canvasRef.current;
          const context = canvasRef.current.getContext("2d");
          if (context) {
            context.clearRect(0, 0, videoWidth, videoHeight);
            faceapi.draw.drawDetections(canvasElement, resizedDetections);
          }
        }
      }
    }, 100);
  };

  const closeWebcam = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks()[0].stop();
      }
    }
    setCaptureVideo(false);
    setFaceDetected(false);
  };

  function captureFrame() {
    const videoElem = videoRef.current;
    const canvasElem = canvasRef.current;

    if (videoElem && canvasElem) {
      const context = canvasElem.getContext("2d");
      if (context) {
        context.drawImage(videoElem, 0, 0, videoWidth, videoHeight);
        const imageData = canvasElem.toDataURL("image/png");
        console.log(imageData);
      }
    }
  }

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        <div>
          <p>Rostro detectado: {!faceDetected ? "NO" : "SI"}</p>
        </div>
        {captureVideo && modelsLoaded ? (
          <>
            <button onClick={closeWebcam}>Close Webcam</button>
            <button onClick={captureFrame}>Capture Webcam</button>
          </>
        ) : (
          <button onClick={startVideo}>Open Webcam</button>
        )}
      </div>
      {captureVideo ? (
        modelsLoaded ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px",
              }}
            >
              <video
                ref={videoRef}
                height={videoHeight}
                width={videoWidth}
                onPlay={handleVideoOnPlay}
                style={{ borderRadius: "4px" }}
              />
              {/* <canvas
                ref={canvasRef}
                style={{ display: "none" }}
                width={videoWidth}
                height={videoHeight}
              /> */}
            </div>
            <div
              id="capture-div"
              style={{
                display: "none",
                width: videoWidth,
                height: videoHeight,
                border: "1px solid red",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ display: "none" }}
                width={videoWidth}
                height={videoHeight}
              />
            </div>
          </div>
        ) : (
          <div>loading...</div>
        )
      ) : (
        <></>
      )}
    </div>
  );
}

export default FaceDetection;
