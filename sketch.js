var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element) {
    
    $scope.songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
    var song = $scope.songs[Math.floor(Math.random() * $scope.songs.length)]



    var sketch = function(p){
        var AUDIO_FILE = "songs/"+song;
        console.log(song);
        var parent;
        var audio, analyzer, fft, canvas, peakDetect;
        var ellipseWidth = 100;
        var vertexSize = 10;


        p.preload = function(){
            audio = p.loadSound(AUDIO_FILE);
            parent = $("#canvas-container");
        }

        p.setup = function () {
            canvas = p.createCanvas(parent.width(), parent.height());
            canvas.parent(parent.attr('id'));

            p.background(200,200,200);

            analyzer = new p5.Amplitude();
            analyzer.setInput(audio);
            
            fft = new p5.FFT();
            fft.setInput(audio);

            peakDetect = new p5.PeakDetect();

            audio.play();
        }

        p.draw = function () {
            p.clear();
            var rms = analyzer.getLevel();


            // Draw an ellipse with size based on volume
            p.ellipse(p.width/2-150, p.height/2, 10+rms*300, 10+rms*300);


            var spectrum = fft.analyze();

            peakDetect.update(fft);

            if ( peakDetect.isDetected ) {
                ellipseWidth = 50;
            } else {
                ellipseWidth *= 0.95;
            }

            p.ellipse(p.width/2, p.height/2, ellipseWidth, ellipseWidth);

            p.beginShape();
            p.vertex(0, p.height);
            var len = spectrum.length-vertexSize;
            for (i = 0; i<len; i+=vertexSize) {
             p.vertex(i, p.map(spectrum[i], 0, 255, p.height, 0) );
            }
            p.vertex(p.width, p.height);
            p.endShape();
        }
    }

    $scope.sketch = new p5(sketch, $element[0]);

    
});



