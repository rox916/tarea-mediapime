import { useEffect, useRef, useState, useCallback } from "react";

// Conexiones entre los puntos de la mano
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export const useMediaPipe = ({
  videoRef,
  canvasRef,
  isCollecting,
  currentVowel,
  isModelTrained,
  isPredicting,
  onLandmarks,
  onPredict
}) => {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const isActiveRef = useRef(false); // 🚩 bandera de vida
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);

  const onResults = useCallback(
    (results) => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");

      // Ajustar tamaño del canvas al del video
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks?.length) {
        for (const landmarks of results.multiHandLandmarks) {
          // Dibujar conexiones y landmarks
          window.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5,
          });
          window.drawLandmarks(ctx, landmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });

          // ✅ callbacks
          if (isCollecting && currentVowel && onLandmarks) {
            onLandmarks(landmarks, currentVowel);
          }
          if (isModelTrained && isPredicting && onPredict) {
            onPredict(landmarks);
          }
        }
      }

      ctx.restore();
    },
    [canvasRef, videoRef, isCollecting, currentVowel, isModelTrained, isPredicting, onLandmarks, onPredict]
  );

  // useEffect 1: Inicializa la cámara
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (!videoRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });

        setIsCameraReady(true);
        setError(null);
      } catch (err) {
        console.error("❌ Error al acceder a la cámara:", err);
        setError("Error al acceder a la cámara: " + err.message);
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject?.getTracks()?.forEach((track) => track.stop());
      }
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [videoRef]);

  // useEffect 2: Inicializa MediaPipe
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        if (!isCameraReady || !window.Hands || !window.Camera) return;

        const hands = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        hands.onResults(onResults);
        handsRef.current = hands;

        // 🚩 activamos la bandera
        isActiveRef.current = true;

        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (!isActiveRef.current || !videoRef.current || !handsRef.current) return;
            await handsRef.current.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });
        await camera.start();
        cameraRef.current = camera;

        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error("❌ Error al inicializar MediaPipe:", err);
        setError("Error al inicializar MediaPipe: " + err.message);
      }
    };

    initializeMediaPipe();

    return () => {
      // 🚩 primero desactivamos
      isActiveRef.current = false;

      // 1. detenemos cámara
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("⚠️ Error al detener cámara:", e);
        }
      }

      // 2. cerramos hands
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          console.warn("⚠️ Error al cerrar hands:", e);
        }
      }

      cameraRef.current = null;
      handsRef.current = null;
    };
  }, [isCameraReady, onResults, videoRef]);

  return { handsRef, cameraRef, isInitialized, isCameraReady, error };
};
