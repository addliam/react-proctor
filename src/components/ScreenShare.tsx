import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

const ScreenShare = forwardRef((props, ref) => {
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const videoHeight = 480 / 3;
  const videoWidth = 640 / 3;
  const displayMediaOptions = {
    video: {
      displaySurface: "window",
    },
    audio: false,
  };

  async function startCapture() {
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
    <div style={{ width: "100%" }}>
      <h4>Screen sharing!</h4>
      {isScreenSharing && (
        <div>
          <video
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
        <div>
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
        {capturedImages.map((imageData, index) => (
          <div key={index}>
            <img src={imageData} alt={`Captured Frame ${index}`} />
          </div>
        ))}
      </div>
    </div>
  );
});

export default ScreenShare;
