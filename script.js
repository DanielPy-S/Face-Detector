const video = document.getElementById('video');

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('models'),
  faceapi.nets.faceExpressionNet.loadFromUri('models'),
  faceapi.nets.ageGenderNet.loadFromUri('models')
]).then(startVideo);
function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error('Error al acceder a la cámara:', err);
    });
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.id = 'overlay';
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    resizedDetections.forEach(detection => {
      const { age, gender, expressions, detection: box } = detection;
      const maxExpression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
      const label = `${maxExpression[0]} | ${gender} | ${Math.round(age)} años`;

      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(label, box.box.x, box.box.y - 10);
    });
  }, 100);
});
