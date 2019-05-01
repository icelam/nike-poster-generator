/* eslint no-param-reassign: "off" */
/* eslint no-alert: "off" */
/* eslint no-nested-ternary: "off" */

/*
 * Reference:
 * https://css-tricks.com/manipulating-pixels-using-canvas/
 * https://stackoverflow.com/questions/10521978/html5-canvas-image-contrast
 * https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
 * https://stackoverflow.com/questions/40353049/how-can-i-adjust-the-huse-saturation-and-lightness-of-in-image-in-html5-canvas
 * https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing/Example
 */

import nikeLogo from '@images/just-do-it.svg';

const NikePosterGenerator = () => {
  // Flags
  let firstLoad = true;
  let imageLoaded = false;

  // Image to process
  const img = new Image();

  // Load logo
  const logo = new Image();
  logo.src = nikeLogo;

  // Canvas
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  // Cache image for text update
  let imageCache;

  // Set Composite Mode
  const _setCompositeMode = (context, compositeMode) => {
    context.globalCompositeOperation = compositeMode;
    return (context.globalCompositeOperation === compositeMode);
  };

  // Draw text
  const _drawText = (context, canvasWidth, canvasHeight, text) => {
    const fontSize = Math.floor(canvasWidth * 0.07);
    const canvasCenterX = Math.floor(canvasWidth / 2);
    const canvasCenterY = Math.floor(canvasHeight / 2);
    const maxLineWidth = Math.floor(canvasWidth * 0.9);
    const lineHeight = Math.floor(fontSize * 1.3);
    const words = text.split(' ');
    let line = '';
    const lines = [];

    context.font = `${fontSize}px Times,"Times New Roman","Microsoft JhengHei","Heiti TC",sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = 'white';

    // Split and count lines
    for (let n = 0; n < words.length; n++) {
      const testLine = `${line}${words[n]} `;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxLineWidth && n > 0) {
        lines.push(line);
        line = `${words[n]} `;
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw lines
    let y = canvasCenterY - Math.floor(lines.length * lineHeight / 2);
    for (let n = 0; n < lines.length; n++) {
      context.fillText(lines[n].trim(), canvasCenterX, y);
      y += lineHeight;
    }
  };

  // Update text
  const _updateTextOnCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageCache) {
      ctx.putImageData(imageCache, 0, 0);
      _drawText(ctx, canvas.width, canvas.height, document.getElementById('slogan').value);
    }
  };

  // Validate new color value
  const _truncateColor = value => (value < 0 ? 0 : ((value > 255) ? 255 : value));

  // Calculate rgb value after applying brightness - brightness range -100 to 100
  const _calculateBrightness = (value, brightness) => value + (255 * (brightness / 100));

  // Calculate rgb value after applying contrast - contrast range -100 to 100
  const _calculateContrast = (value, contrast) => {
    // Convert to decimal & shift range: [0..2]
    const convertedContrast = (contrast / 100) + 1;
    const intercept = 128 * (1 - convertedContrast);
    return _truncateColor(value * convertedContrast + intercept);
  };

  // Apply brightness and contrast
  const _applyBrightnessAndContrast = (cimg, brightness, contrast) => {
    const { data } = cimg;
    for (let i = 0, l = data.length; i < l; i += 4) {
      data[i] = _calculateBrightness(data[i], brightness);
      data[i] = _calculateContrast(data[i], contrast);
      data[i + 1] = data[i];
      data[i + 2] = data[i];
    }

    cimg.data = data;
    return cimg;
  };

  // Read and draw image to canvas
  const _drawImageOnCanvas = () => {
    if (imageLoaded) {
      // if (window.console && window.console.time) { console.time("Draw on canvas"); }

      // Orientation
      switch (document.getElementById('orientation').value) {
        case '1':
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.transform(1, 0, 0, 1, 0, 0); // Default
          break;

        case '2':
          canvas.width = img.height;
          canvas.height = img.width;
          ctx.transform(0, 1, -1, 0, img.height, 0); // 90deg
          break;

        case '3':
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.transform(-1, 0, 0, -1, img.width, img.height); // 180deg
          break;

        case '4':
          canvas.width = img.height;
          canvas.height = img.width;
          ctx.transform(0, -1, 1, 0, 0, img.width); // 270deg
          break;

        default:
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.transform(1, 0, 0, 1, 0, 0); // Default
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // ResetTransform

      // Remove saturation
      const modeChange = _setCompositeMode(ctx, 'saturation');

      if (modeChange) {
        ctx.fillStyle = 'hsl(0,0%,50%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      } else { // IE fallback
        ctx.filter = 'saturate(0%)';
        const coloredImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.putImageData(coloredImage, 0, 0);
        ctx.filter = 'none';
      }

      // Adjust color
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imageData = _applyBrightnessAndContrast(imageData, document.getElementById('brightness').value, document.getElementById('contrast').value);
      ctx.putImageData(imageData, 0, 0);

      // Black overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add logo
      const logoScaleRatio = 0.03;
      const logoRatio = logo.width / logo.height;
      const logoHeight = Math.floor(canvas.width * logoScaleRatio);
      const logoWidth = logoHeight * logoRatio;

      ctx.drawImage(logo, 0, 0,
        logo.width, logo.height,
        ((canvas.width - (logoWidth)) / 2), Math.floor(canvas.height - (canvas.height * 0.06) - logoHeight),
        logoWidth, logoHeight);

      imageCache = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Add text
      _drawText(ctx, canvas.width, canvas.height, document.getElementById('slogan').value);

      // if (window.console && window.console.time) { console.timeEnd("Draw on canvas"); }

      if (firstLoad) {
        document.getElementById('welcome').style.display = 'none';
        canvas.style.display = 'block';
        firstLoad = false;
      }
    }
  };

  // Process file
  const _loadImage = () => {
    const fileInput = document.getElementById('poster-source');
    const { files } = fileInput;

    // Can loop files using - for (let i = 0; i < files.length; i++) { /* ... */ }
    // But we will take the first one only
    const file = files[0];
    const imageType = /image.*/;

    if (file.type.match(imageType)) {
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        imageLoaded = true;
        _drawImageOnCanvas(img);
      };
    } else {
      alert('Seleted file is not an image, please select another one.');
    }
  };

  const _generateBlobFromCanvas = () => {
    let blob;
    if (canvas.msToBlob) { // For IE
      blob = canvas.msToBlob();
    } else {
      // Convert data url to blob for chrome to work
      const dataurl = canvas.toDataURL('image/jpeg');
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      blob = new Blob([u8arr], { type: mime });
    }

    return blob;
  };

  // Download image
  const _saveCanvas = () => {
    if (imageLoaded) {
      const canvasBlob = _generateBlobFromCanvas();

      const timestamp = new Date().getTime();
      const saveName = 'IT-poster-';
      const link = document.createElement('a');

      if (canvas.msToBlob) { // For IE
        window.navigator.msSaveBlob(canvasBlob, `${saveName}${timestamp}.jpg`);
      } else {
        const objectUrl = URL.createObjectURL(canvasBlob);

        if (/CriOS/i.test(navigator.userAgent) && /iphone|ipod|ipad/i.test(navigator.userAgent)) { // IOS Chrome not support blob download
          document.getElementById('not-supported').style.display = 'block';
        } else {
          // Create download link - Firefox hack
          document.body.appendChild(link);
          link.href = objectUrl;
          // Link.download = saveName + timestamp + '.png';
          link.download = `${saveName}${timestamp}.jpg`;
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  };

  return {
    loadImage: _loadImage,
    drawImageOnCanvas: _drawImageOnCanvas,
    truncateColor: _truncateColor,
    updateTextOnCanvas: _updateTextOnCanvas,
    saveCanvas: _saveCanvas
  };
};

export default NikePosterGenerator;
