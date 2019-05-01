import NikePosterGenerator from '@js/nike';

let typingTimer;
const typingInterval = 300;
const uploadButton = document.getElementById('poster-source');
const inputSlogan = document.getElementById('slogan');
const inputOrientation = document.getElementById('orientation');
const inputBrightness = document.getElementById('brightness');
const inputContrast = document.getElementById('contrast');
const saveButton = document.getElementById('save-button');

const generator = new NikePosterGenerator();

uploadButton.addEventListener('change', generator.loadImage);

inputSlogan.addEventListener('keyup', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(generator.updateTextOnCanvas, typingInterval);
});
inputSlogan.addEventListener('keydown', () => {
  clearTimeout(typingTimer);
});
inputSlogan.addEventListener('change', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(generator.updateTextOnCanvas, typingInterval);
});
inputSlogan.addEventListener('blur', () => {
  clearTimeout(typingTimer);
  generator.updateTextOnCanvas();
});

inputOrientation.addEventListener('change', generator.drawImageOnCanvas);

inputBrightness.addEventListener('change', generator.drawImageOnCanvas);

inputContrast.addEventListener('change', generator.drawImageOnCanvas);

saveButton.addEventListener('click', generator.saveCanvas);

// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
