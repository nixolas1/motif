var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element) {
    
    var audio, canvas;

    var Number = function(minimum){
        return {value: 0, min: minimum, live: 0}
    }

    var Range = function(start, minimum, maximum){
        return {value: start, min: minimum, max: maximum, step: 0.1, live: 0, type:"range"};
    }

    var Color = function(hue, bright){
        return {hue: {live:0, value: hue||0}, saturation: {live:0, value: 100}, brightness: {live:0, value: bright||100}, alpha: {live:0, value: 100}, min: 0, max: 100, step:0.1, type:"color"};
    }

    function toArgs(p, type, sketch){
        //[color.hue.value+color.hue.live, prop.color.saturation, prop.color.brightness, prop.color.alpha]
        //posMap(prop.x.value + prop.x.live, p5.width), posMap(prop.y.value, p5.height), sizeMap(prop.width.value, p5.width), sizeMap(prop.height.value, p5.width)
        switch(type){
            case "color":
                p = p.color;
                return [p.hue.value+p.hue.live, p.saturation.value+p.saturation.live, p.brightness.value+p.brightness.live, p.alpha.value+p.alpha.live];
            
            case "xywh":
                return [posMap(p.x.value + p.x.live, sketch.width), posMap(p.y.value + p.y.live, sketch.height), sizeMap(p.width.value + p.width.live, sketch.width), sizeMap(p.height.value +  + p.x.live, sketch.width)];

        }
        
    }


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

            case "boolean":
                return "checkbox";
            
            default:
                return "number";
        }
    }

    $scope.scene = {
        objects: [],
        inputs: [],

        update: function(p5js){
            var inputs = this.inputs;
            for (var i = 0, inLen = inputs.length; i < inLen; i++) {

                var input = inputs[i];
                    aff = input.affected;
                    val = input.value;

                for(var j = 0, affLen = aff.length; j < affLen; j++){
                    affected[j].live += val * affected[j].modifier;
                }

            };
        },

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
                if(!prop.stroke.value){
                    p5.noStroke();
                } else {
                    p5.stroke();
                    p5.strokeWeight(prop.stroke.value);
                }

                p5.fill.apply(p5, toArgs(prop, "color"));
                p5.ellipse.apply(p5, toArgs(prop, "xywh", p5));
            },

            props: {
                x: new Range(0, -100, 100),
                y: new Range(0, -100, 100),
                height: new Range(20, 0, 200),
                width: new Range(20, 0, 200),
                color: new Color(0, 0),
                stroke: new Number(0),
            },
        },

        background: {
            name: "background",
            draw: function(p5){
                var p = this.props;
                p5.background(toArgs(prop, "color"));
            },
            props: {
                color: new Color(),
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
            add: function(){
                this.instance = new p5.Amplitude();
                this.instance.setInput(audio);
            },
            value: function(p){
                if(this.props.smoothing > 0)
                    this.instance.smooth(this.props.smoothing);

                if(this.props.normalize != this.live.normalizeToggle){
                    this.instance.toggleNormalize(this.props.normalize);
                    this.live.normalizeToggle = this.props.normalize;
                }

                return this.instance.getLevel();
            },
            props: {
                smoothing: new Range(0.5, 0, 1),
                normalize: {value: true, type:"boolean"},
                output: {min:0, max:1, type:"number"},
            },
            live: {
                normalizeToggle: false,
            },
            instance: null,
            type: "number",
            affected: [],
        }
    }


    $scope.addObject = function(object){
        var newObject = angular.copy(object);
        if(newObject.add)
            newObject.instance = newObject.add(newObject.props);
        $scope.scene.objects.push(newObject);
        $scope.open = newObject;

        return newObject;
    }

    $scope.addInput = function(input){
        var newInput = angular.copy(input);
        if(newInput.add)
            newInput.add($scope.sketch);

        $scope.scene.inputs.push(newInput);
        $scope.open = newInput;

        return newInput;
    }
/*
    OK: scene.inputs[0].affected.push(scene.objects[0].live.stroke.value)

    vs
    scene.objects[0].inputs.push({affects: stroke, value: inputs[0].value})

*/
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
        var parent;

        p.preload = function(){
            $scope.songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
            var song = $scope.songs[Math.floor(Math.random() * $scope.songs.length)];
            var AUDIO_FILE = "songs/"+song;
            
            audio = p.loadSound(AUDIO_FILE);
            parent = $("#canvas-container");
        }

        p.setup = function () {
            canvas = p.createCanvas(parent.width(), parent.height());
            canvas.parent(parent.attr('id'));

            //init p5
            
            p.background(200,200,200);
            p.colorMode(p.HSB, 100, 100, 100, 100);
            audio.play();


        }

        p.draw = function () {
            $scope.scene.draw(p);
        }
    }

    $scope.sketch = new p5(sketch, $element[0]);


    //testing
    

            $scope.addObject($scope.objects.clear);
            var ellipse = $scope.addObject($scope.objects.ellipse);

            var amp = $scope.addInput($scope.inputs.amplitude);
            amp.affected.push({obj:ellipse, prop:"height", modifier:10});
    
});



