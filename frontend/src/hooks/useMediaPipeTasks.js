import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// 🔹 Conexiones manuales de la mano
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export const useMediaPipeTasks = ({
  videoRef,
  canvasRef,
  isCollecting,
  currentVowel,
  currentOpbasic,
  currentNumber,
  isModelTrained,
  isPredicting,
  onLandmarks,
  onPredict,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const landmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 1️⃣ Inicializar cámara
  useEffect(() => {
    const initCamera = async () => {
      try {
        if (!videoRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
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
        console.error("❌ Error cámara:", err);
        setError("Error al acceder a la cámara: " + err.message);
      }
    };

    initCamera();

    return () => {
      videoRef.current?.srcObject?.getTracks()?.forEach((t) => t.stop());
    };
  }, [videoRef]);

  // 2️⃣ Inicializar modelo
  useEffect(() => {
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-tasks/hand_landmarker/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        landmarkerRef.current = handLandmarker;
        setIsInitialized(true);
      } catch (err) {
        console.error("❌ Error modelo:", err);
        setError("Failed to load model: " + err.message);
      }
    };

    initModel();

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      landmarkerRef.current = null;
    };
  }, []);

  // 3️⃣ Render loop
  useEffect(() => {
    if (!isInitialized || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const render = () => {
      if (!landmarkerRef.current || !video) return;

      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const results = landmarkerRef.current.detectForVideo(
        video,
        performance.now()
      );

      if (results.landmarks && results.landmarks.length > 0) {
        for (const landmarks of results.landmarks) {
          // Dibujar conexiones
          ctx.strokeStyle = "lime";
          ctx.lineWidth = 2;
          for (const [start, end] of HAND_CONNECTIONS) {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            if (p1 && p2) {
              ctx.beginPath();
              ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
              ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              ctx.stroke();
            }
          }

          // Dibujar puntos
          ctx.fillStyle = "red";
          for (const point of landmarks) {
            ctx.beginPath();
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              4,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }

          // ✅ Callbacks
          const currentLabel = currentVowel || currentOpbasic || currentNumber;

          if (isCollecting && currentLabel && onLandmarks) {
            // 🔹 Solo manda landmarks; la lógica de cortar está en cada hook
            onLandmarks(landmarks, currentLabel);
          }

          if (isModelTrained && isPredicting && onPredict) {
            onPredict(landmarks, currentLabel);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  }, [
    isInitialized,
    isCameraReady,
    videoRef,
    canvasRef,
    isCollecting,
    currentVowel,
    currentOpbasic,
    currentNumber,
    isModelTrained,
    isPredicting,
    onLandmarks,
    onPredict,
  ]);

  return { isInitialized, isCameraReady, error };
};
