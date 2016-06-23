var songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
var song = songs[Math.floor(Math.random() * songs.length)]
var AUDIO_FILE = "songs/"+song;
var canvas = $("#canvas")[0];
$("#test_out").text(song);

var parent;

var audio, analyzer, fft, canvas;

function preload() {
    audio = loadSound(AUDIO_FILE);
    parent = $("#canvas-container");
}

function setup() {
    canvas = createCanvas(parent.width(), parent.height());
    canvas.parent(parent.attr('id'));

    background(200,200,200);

    analyzer = new p5.Amplitude();
    analyzer.setInput(audio);
    
    fft = new p5.FFT();
    fft.setInput(audio);

    audio.play();
}

function draw() {
    var rms = analyzer.getLevel();


    // Draw an ellipse with size based on volume
    //ellipse(width/2, height/2, 10+rms*200, 10+rms*200);


    var spectrum = fft.analyze();

    beginShape();
    for (i = 0; i<spectrum.length; i++) {
     vertex(i, map(spectrum[i], 0, 255, height, 0) );
    }
    endShape();
}