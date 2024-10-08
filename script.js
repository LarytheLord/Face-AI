let video = document.getElementById("video");
let model;
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let startBtn = document.getElementById("startBtn");
let stopBtn = document.getElementById("stopBtn");
let stats = document.getElementById("stats");

let stream;
let detectInterval;
let faceCount = 0;
let lastDetectionTime = 0;

const setupCamera = () => {
    navigator.mediaDevices.getUserMedia({
        video: { width: 600, height: 400 },
        audio: false,
    }).then(videoStream => {
        video.srcObject = videoStream;
        stream = videoStream;
        startDetection();
    }).catch(error => {
        console.error("Error accessing the camera", error);
        stats.textContent = "Error: Unable to access the camera";
    });
};

const startDetection = async () => {
    model = await blazeface.load();
    detectInterval = setInterval(detectFaces, 100);
    stats.textContent = "Face detection started";
};

const stopDetection = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (detectInterval) {
        clearInterval(detectInterval);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stats.textContent = "Face detection stopped";
    faceCount = 0;
};

const detectFaces = async () => {
    const prediction = await model.estimateFaces(video, false);
    
    ctx.drawImage(video, 0, 0, 600, 400);
    
    faceCount = prediction.length;
    lastDetectionTime = new Date().toLocaleTimeString();
    
    prediction.forEach((pred, index) => {
        ctx.beginPath();
        ctx.lineWidth = "4";
        ctx.strokeStyle = "green";
        ctx.rect(
            pred.topLeft[0],
            pred.topLeft[1],
            pred.bottomRight[0] - pred.topLeft[0],
            pred.bottomRight[1] - pred.topLeft[1]
        );
        ctx.stroke();
        
        // Draw face landmarks
        const landmarks = pred.landmarks;
        const nose = landmarks[2];
        const leftEye = landmarks[1];
        const rightEye = landmarks[0];
        const leftEar = landmarks[4];
        const rightEar = landmarks[5];
        
        ctx.fillStyle = "red";
        [nose, leftEye, rightEye, leftEar, rightEar].forEach(point => {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Display face number
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(`Face ${index + 1}`, pred.topLeft[0], pred.topLeft[1] - 5);
    });
    
    updateStats();
};

const updateStats = () => {
    stats.textContent = `Faces detected: ${faceCount} | Last detection: ${lastDetectionTime}`;
};

startBtn.addEventListener("click", setupCamera);
stopBtn.addEventListener("click", stopDetection);

video.addEventListener("loadeddata", async () => {
    startDetection();
});