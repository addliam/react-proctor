import * as faceapi from "face-api.js";
import React, { useState, useRef, useEffect } from "react";

interface FaceDetectionProps {
  addStrikeHistoryFunction: Function;
}

function FaceDetection({ addStrikeHistoryFunction }: FaceDetectionProps) {
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [timer, setTimer] = useState<number>(10); // New state variable

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoHeight = 480 / 3;
  const videoWidth = 640 / 3;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log(timer);

    if (timer >= 4000) {
      // window.alert("No se detecto rostro en 4 segundos");
      addStrikeHistoryFunction("webcam", "No se detecto rostro en 4 segundos");
      setTimer(0); // Reset the timer
    }

    return () => {};
  }, [timer]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = import.meta.env.BASE_URL + "/models";
      console.log(MODEL_URL);

      Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)]).then(
        () => setModelsLoaded(true)
      );
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    setFaceDetected(false);
    // setTimer(0); // Reset timer when starting video
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
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
          console.log("[-] No hay rostros");

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

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        <div>
          <p>Rostro detectado: {!faceDetected ? "NO" : "SI"}</p>
        </div>
        {captureVideo && modelsLoaded ? (
          <button onClick={closeWebcam}>Close Webcam</button>
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
              <canvas ref={canvasRef} style={{ position: "absolute" }} />
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
