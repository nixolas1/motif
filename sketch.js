var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element) {
    
    $scope.songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
    var song = $scope.songs[Math.floor(Math.random() * $scope.songs.length)];

    $scope.exposedProps = function(type){
        switch(type){
            case "color":
                return ["hue", "saturation", "brightness", "alpha"];
            default:
                return ["value"];
        }
    }


    $scope.scene = {
        objects: [],

        draw: function(p5js){
            for (var i = this.objects.length - 1; i >= 0; i--) {
                this.objects[i].draw(p5js);
            };
        },
    };




    $scope.objects = {
        ellipse: {
            name: "ellipse",
            draw: function(prop, p5){
                p5.strokeWeight(prop.stroke.value);
                p5.fill(prop.color.hue, prop.color.saturation, prop.color.brightness, prop.color.alpha);
                p5.ellipse(sizeMap(prop.x.value, p5.width), sizeMap(prop.y.value, p5.height), prop.width.value, prop.height.value);
            },
            update: function(p5){

            },
            live: {},
            props: {
                x: {value: 0, min: -100, max: 100},
                y: {value: 0, min: -100, max: 100},
                height: {min:0, value: 100},
                width: {min:0, value: 100},
                color: {hue:0, saturation:255, brightness: 100, alpha: 1, type:"color"},
                stroke: {value: 5, min:0},
            },
            inputs: [],
        },

        background: {
            name: "background",
            draw: function(p5){
                var p = this.props;
                p5.background(p.color.hue, p.color.saturation, p.color.brightness, p.color.alpha);
            },
            props: {
                color: {hue:0, saturation:255, brightness: 100, alpha: 1, type:"color"},
            },
            
            inputs: [
                {
                    input: function(p){
                        amp
                    },
                    affected: [color.saturation],
                },
            ]
        },
    };

    $scope.inputs = {
        amplitude: {

        }
    }

    $scope.updateObject = function(object){ //computes objects final values from inputs
        var inputs = object.inputs;
        for (var i = inputs.length - 1; i >= 0; i--) {
            input = inputs[i];
            for (var j = input.affected.length - 1; j >= 0; j--) {
                input.affected[j]
            };
        };   
    }

    $scope.addObject = function(object){
        var newObject = angular.copy(object);
        if(newObject.add)
            newObject.instance = newObject.add(newObject.props);
        $scope.scene.objects.push(newObject);
        $scope.open = newObject;
    }

    function sizeMap(input, biggest){
        $scope.sketch.map(input, -100, 100, 0, biggest);
    }

    var colorToParameters = function(color){
        return color.hue, color.saturation, color.brightness, color.alpha;
    }

    var sketch = function(p){
        var AUDIO_FILE = "songs/"+song;
        console.log(song);
        var parent;
        var audio, analyzer, fft, canvas, peakDetect;

        p.preload = function(){
            audio = p.loadSound(AUDIO_FILE);
            parent = $("#canvas-container");
        }

        p.setup = function () {
            canvas = p.createCanvas(parent.width(), parent.height());
            canvas.parent(parent.attr('id'));

            p.background(200,200,200);
            p.colorMode(p.HSB);

            analyzer = new p5.Amplitude();
            analyzer.setInput(audio);
            
            fft = new p5.FFT();
            fft.setInput(audio);

            peakDetect = new p5.PeakDetect();

            audio.play();
        }

        p.draw = function () {
            $scope.scene.draw(p);
        }
    }

    $scope.sketch = new p5(sketch, $element[0]);

    
});



