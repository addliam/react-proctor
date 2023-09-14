import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
interface ScreenShareProps {
  stateHandler: Function;
}
const ScreenShare = forwardRef((props: ScreenShareProps, ref) => {
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const standard = {
    "2160p": [3840, 2160],
    "1440p": [2560, 1440],
    "1080p": [1920, 1080],
    "720p": [1280, 720],
    "480p": [854, 480],
    "360p": [640, 360],
    "240p": [426, 240],
  };

  const resolution = "480p";
  const videoWidth = standard[resolution][0];
  const videoHeight = standard[resolution][1];
  const displayMediaOptions = {
    video: {
      displaySurface: "monitor",
    },
    audio: false,
  };

  async function startCapture() {
    // inicializar estado "camaraActiva" usando el handler
    props.stateHandler(true);
    // funcionamiento
    setIsScreenSharing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      );
      videoRef.current!.srcObject = stream;
      videoRef.current!.play().catch((error) => {
        console.error("Failed to play the video:", error);
      });
    } catch (err) {
      console.error(err);
    }
  }

  function stopCapture() {
    setIsScreenSharing(false);
    const videoElem = videoRef.current;
    if (videoElem && videoElem.srcObject instanceof MediaStream) {
      const tracks = videoElem.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoElem.srcObject = null;
    }
  }

  function captureFrame() {
    const videoElem = videoRef.current;
    const canvasElem = canvasRef.current;

    if (videoElem && canvasElem) {
      const context = canvasElem.getContext("2d");
      if (context) {
        context.drawImage(videoElem, 0, 0, videoWidth, videoHeight);
        const imageData = canvasElem.toDataURL("image/png");
        // API_CALL: subir elemento png a la api de ScreenshotStorage.

        setCapturedImages((prevImages) => [...prevImages, imageData]);
      }
    }
  }
  // Exponer la función captureFrame a través de la ref
  useImperativeHandle(ref, () => ({
    captureFrame,
  }));

  return (
    <div style={{ width: "auto" }}>
      <h4>Screen sharing!</h4>
      {isScreenSharing && (
        <div
          style={{
            width: videoWidth,
            height: videoHeight,
            border: "1px solid red",
          }}
        >
          <video
            id="screen-sharing"
            ref={videoRef}
            height={videoHeight}
            width={videoWidth}
            style={{ borderRadius: "4px" }}
          />
        </div>
      )}
      <button onClick={startCapture}>START</button>
      <button onClick={stopCapture}>STOP</button>
      {isScreenSharing && (
        <div
          id="capture-div"
          style={{
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
          <button onClick={() => captureFrame()}>Capture</button>
        </div>
      )}
      <div
        className="images-container"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {capturedImages.map((imageData, index) => {
          console.log(imageData);
          return (
            <div key={index}>
              <img
                width={videoWidth}
                height={videoHeight}
                src={imageData}
                alt={`Captured Frame ${index}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ScreenShare;
