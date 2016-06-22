var songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
var song = songs[Math.floor(Math.random() * songs.length)]
var AUDIO_FILE = "songs/"+song;
var canvas = $("#canvas")[0];
$("#test_out").text(song);

var audio, analyzer;

function preload() {
    audio = loadSound(AUDIO_FILE);

}

function setup() {
    createCanvas(710, 200);
    background(200,200,200);

    analyzer = new p5.Amplitude();
    analyzer.setInput(audio);
    

    audio.play();
}

function draw() {
    var rms = analyzer.getLevel();
    fill(127);
    stroke(0);

    // Draw an ellipse with size based on volume
    ellipse(width/2, height/2, 10+rms*200, 10+rms*200);
}