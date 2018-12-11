/* 
 * Reference: 
 * https://css-tricks.com/manipulating-pixels-using-canvas/ 
 * https://stackoverflow.com/questions/10521978/html5-canvas-image-contrast
 * https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
 * https://stackoverflow.com/questions/40353049/how-can-i-adjust-the-huse-saturation-and-lightness-of-in-image-in-html5-canvas
 * https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing/Example
 */

var nikePosterGenerator = function() {
  //flags
  var firstLoad = true;
  var imageLoaded = false;

  //image to process
  var img = new Image();

  //load logo
  var logo = new Image();
  logo.src = 'assets/images/just-do-it.svg';

  //canvas
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d', { alpha: false });

  //cache image for text update
  var imageCache;
  
  //read and draw image to canvas
  var _drawImageOnCanvas = function() {
    if(imageLoaded) {
        //if (window.console && window.console.time) { console.time("Draw on canvas"); }

        //orientation
        switch (document.getElementById('orientation').value) {
          case "1":
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.transform(1, 0, 0, 1, 0, 0); //default
            break;

          case "2":
            canvas.width = img.height;
            canvas.height = img.width;
            ctx.transform(0, 1, -1, 0, img.height, 0); //90deg
            break;

          case "3":
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.transform(-1, 0, 0, -1, img.width, img.height); //180deg
            break;

          case "4":
            canvas.width = img.height;
            canvas.height = img.width;
            ctx.transform(0, -1, 1, 0, 0, img.width); //270deg
            break;

          default:
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.transform(1, 0, 0, 1, 0, 0); //default
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0,0);
        ctx.setTransform(1, 0, 0, 1, 0, 0); //resetTransform

        // remove saturation
        var modeChange = _setCompositeMode(ctx, 'saturation');
        
        if (modeChange) {
          ctx.fillStyle = 'hsl(0,0%,50%)';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        } else { //IE fallback
          ctx.filter = "saturate(0%)";
          var coloredImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ctx.putImageData(coloredImage, 0, 0);
          ctx.filter="none";
        }    

        //adjust color
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        imageData = _applyBrightnessAndContrast(imageData, document.getElementById("brightness").value, document.getElementById("contrast").value);
        ctx.putImageData(imageData, 0, 0);

        //black overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        //add logo
        var logoScaleRatio = 0.03;
        var logoRatio = logo.width / logo.height;
        var logoHeight = Math.floor(canvas.width * logoScaleRatio);
        var logoWidth = logoHeight * logoRatio;

        ctx.drawImage(logo, 0, 0, 
                      logo.width, logo.height, 
                      ((canvas.width - (logoWidth)) / 2), Math.floor(canvas.height - (canvas.height * 0.06) - logoHeight), 
                      logoWidth, logoHeight);

        imageCache = ctx.getImageData(0, 0, canvas.width, canvas.height);

        //add text
        _drawText(ctx, canvas.width, canvas.height, document.getElementById("slogan").value);

        //if (window.console && window.console.time) { console.timeEnd("Draw on canvas"); }

        if(firstLoad) {
          document.getElementById('welcome').style.display = 'none';
          canvas.style.display = 'block';
          firstLoad = false;
        }
    }
  }; 

  var _setCompositeMode = function(context, compositeMode) {
    context.globalCompositeOperation = compositeMode;
    return ( context.globalCompositeOperation == compositeMode ) ;
  }

  //update text
  var _updateTextOnCanvas = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(imageCache){
      ctx.putImageData(imageCache, 0, 0);
      _drawText(ctx, canvas.width, canvas.height, document.getElementById("slogan").value);
    }
  }

  //draw text
  var _drawText = function(context, canvasWidth, canvasHeight, text) {
    var fontSize = Math.floor(canvasWidth * 0.07);
    var canvasCenterX = Math.floor(canvasWidth / 2); 
    var canvasCenterY = Math.floor(canvasHeight / 2);
    var maxLineWidth = Math.floor(canvasWidth * 0.9);
    var lineHeight = Math.floor(fontSize * 1.3);
    var words = text.split(' ');
    var line = '';
    var lines = [];

    context.font = fontSize + 'px Times,"Times New Roman","Microsoft JhengHei","Heiti TC",sans-serif';
    context.textAlign = 'center'; 
    context.textBaseline = 'top';
    context.fillStyle = "white";
    
    //split and count lines
    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxLineWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      }
      else {
        line = testLine;
      }
    }
    lines.push(line);

    //draw lines
    var y = canvasCenterY - Math.floor(lines.length * lineHeight / 2);
    for (var n = 0; n < lines.length; n++) {
      context.fillText(lines[n].trim(), canvasCenterX, y);
      y += lineHeight;
    }
  }

  //validate new color value
  var _truncateColor = function(value) {
    return value < 0 ? 0 : ((value > 255) ? 255 : value);
  }

  //apply brightness and contrast
  var _applyBrightnessAndContrast = function(cimg, brightness, contrast) {
    var data = cimg.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i] = _calculateBrightness(data[i], brightness);
      data[i] = _calculateContrast(data[i], contrast);
      data[i + 1] = data[i];
      data[i + 2] = data[i];
    }
    cimg.data = data;
    return cimg;
  }

  //calculate rgb value after applying brightness - brightness range -100 to 100
  var _calculateBrightness = function(value, brightness) {
    return (value += 255 * (brightness / 100));
  };

  //calculate rgb value after applying contrast - contrast range -100 to 100
  var _calculateContrast = function(value, contrast) { 
    contrast = (contrast/100) + 1;
    var intercept = 128 * (1 - contrast);
    value = _truncateColor(value * contrast + intercept);
    return value;
  }

  //process file
  var _loadImage = function() {
    var fileInput = document.getElementById('poster-source');

    var files = fileInput.files;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var imageType = /image.*/;

      if (file.type.match(imageType)) {
        
        img.src = URL.createObjectURL(file);

        img.onload = function() {
          imageLoaded = true;
          _drawImageOnCanvas(img);
        }
      } else {
        alert ('Seleted file is not an image, please select another one.');
      }
    } 
  };

  var _generateBlobFromCanvas = function() {
    var blob;
    if (canvas.msToBlob) { //for IE
      blob = canvas.msToBlob();
    } else { 
      //Convert data url to blob for chrome to work
      var dataurl = canvas.toDataURL('image/jpeg');
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }

      blob = new Blob([u8arr], {type:mime});
    }

    return blob;
  }

  //download image
  var _saveCanvas = function() {
    var canvasBlob = _generateBlobFromCanvas();

    if(imageLoaded){
      var timestamp = new Date().getTime();
      var saveName = 'IT-poster-';
      var link  = document.createElement('a');
      
      if (canvas.msToBlob) { //for IE
        window.navigator.msSaveBlob(canvasBlob, saveName + timestamp + '.jpg');
      } else { 
        //create download link - Firefox hack
        document.body.appendChild(link);
        link.href = URL.createObjectURL(canvasBlob);
        //link.download = saveName + timestamp + '.png';
        link.download = saveName + timestamp + '.jpg';
        link.click();
        document.body.removeChild(link);
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
}