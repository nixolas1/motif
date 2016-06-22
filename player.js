var songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
var song = songs[Math.floor(Math.random() * songs.length)]
var AUDIO_FILE = "./songs/"+song;
var canvas = $("#canvas")[0];
$("#test_out").text(song);

var ear = new Ear({ src: AUDIO_FILE });

ear.bind("loaded", loaded);
ear.bind("update", onUpdate);

var normalizer = new Ear.Normalizer({dynamic: true, damping: 1000, overflow: false, dampingMultiplier: 10, smoothness:10})
//var lowpass = new Ear.Filter(type="lowpass")
//var beat = new Ear.Beatalyzer(ear, {});
//beat = ear.onBeat(filter="lowpass", )

function loaded(){
    ear.waveform( canvas, { strokeStyle: '#666', strokeWidth: 2 });
    ear.play();
}
function onUpdate(){
    //console.log(ear.getWaveform());

    var out = normalizer.normalize(ear.getFrequency(30, 200));
    $("#test_out").css("font-size", (1+out)+"em");
}