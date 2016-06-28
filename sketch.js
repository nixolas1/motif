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

    //add html input field type here, else it will be a number field
    $scope.htmlType = function(type){
        switch(type){
            case "range":
            case "text":
                return type;

            case "color":
                return "range";
            
            default:
                return "number";
        }
    }



    $scope.scene = {
        objects: [],
        /*update: function(p5js){
            for (var i = this.objects.length - 1; i >= 0; i--) {
                this.objects[i].update(p5js);
            };
        },*/
        draw: function(p5js){
            var len = this.objects.length - 1;
            for (var i = 0; i <= len; i++) {
                this.objects[i].draw(p5js);
            };
        },
    };




    $scope.objects = {
        ellipse: {
            name: "ellipse",
            draw: function(p5){
                var prop = this.props;
                p5.strokeWeight(prop.stroke.value);
                p5.fill(prop.color.hue, prop.color.saturation, prop.color.brightness, prop.color.alpha);
                p5.ellipse(posMap(prop.x.value, p5.width), posMap(prop.y.value, p5.height), sizeMap(prop.width.value, p5.height), sizeMap(prop.height.value, p5.height));
            },

            live: {},
            props: {
                x: {value: 0, min: -100, max: 100, step: 0.1, type:"range"},
                y: {value: 0, min: -100, max: 100, step: 0.1, type:"range"},
                height: {value: 20, min: 0, max: 100, step: 0.1, type:"range"},
                width: {value: 20, min: 0, max: 100, step: 0.1, type:"range"},
                color: {hue:0, saturation:100, brightness: 100, alpha: 50, type:"color"},
                stroke: {value: 5, min:0},
            },
        },

        background: {
            name: "background",
            draw: function(p5){
                var p = this.props;
                p5.background(p.color.hue, p.color.saturation, p.color.brightness, p.color.alpha);
            },
            props: {
                color: {hue:0, saturation:0, brightness: 100, alpha: 100, type:"color", min: 0, max: 100, step:0.1},
            },

        },

        clear: {
            name: "clear",
            draw: function(p5){
                this.live.every -= 1;
                if(this.live.every <= 0){
                    this.live.every = this.props.every.value;
                    p5.clear();
                }
            },
            live: {
                every: 0,
            },
            props: {
                every: {value: 0}
            }
        }
    };

    $scope.inputs = {
        amplitude: {
            name: "amplitude",
            add: function(p5){
                this.instance = new p5.Amplitude();
                this.instance.setInput(audio);
            },
            value: function(p5){
                if(this.props.smoothing > 0)
                    this.instance.smooth(this.props.smoothing);

                if(this.props.normalize != this.live.normalizeToggle){
                    this.instance.toggleNormalize(this.props.normalize);
                    this.live.normalizeToggle = this.props.normalize;
                }

                return this.instance.getLevel();
            },
            props: {
                smoothing: {value: 0.5, min:0, max:1, step:0.01, type:"range"},
                normalize: {value: true, type:"boolean"},
            },
            live: {
                normalizeToggle: false,
            },
            instance: null,
            type: "number",
            affected: [],
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

    $scope.selected = function(object){
        $scope.open = object;
    }

    function sizeMap(input, biggest){
        return $scope.sketch.map(input, 0, 100, 0, biggest);
    }

    function posMap(input, biggest){
        return $scope.sketch.map(input, -100, 100, 0, biggest);
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
            p.colorMode(p.HSB, 100, 100, 100, 100);

            
            
            fft = new p5.FFT();
            fft.setInput(audio);

            peakDetect = new p5.PeakDetect();

            audio.play();

            $scope.addObject($scope.objects.clear);
        }

        p.draw = function () {
            $scope.scene.draw(p);
        }
    }

    $scope.sketch = new p5(sketch, $element[0]);

    
});



