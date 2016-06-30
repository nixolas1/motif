var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element) {
    
    var audio, canvas;
    $scope.con = {};
    $scope.sketch = new p5(sketch, $element[0]);



    var NumberField = function(val, minimum){
        return {value: val, min: minimum, live: 0}
    }

    var RangeField = function(start, minimum, maximum){
        return {value: start, min: minimum, max: maximum, step: 0.1, live: 0, type:"range"};
    }

    var ColorField = function(hue, bright){
        return {
            hue: new RangeField(0, 0, 100),
            saturation: new RangeField(100, 0, 100),
            brightness: new RangeField(100, 0, 100),
            alpha: new RangeField(100, 0, 100),
        }
    }

    function toArgs(p, type, sketch){
        switch(type){
            case "color":
                return [p.hue.value+p.hue.live, p.saturation.value+p.saturation.live, p.brightness.value+p.brightness.live, p.alpha.value+p.alpha.live];
            
            case "xywh":
               // console.log(p, [posMap(p.x.value + p.x.live, sketch.width), posMap(p.y.value + p.y.live, sketch.height), sizeMap(p.width.value + p.width.live, sketch.width), sizeMap(p.height.value + p.height.live, sketch.width)])
                return [posMap(p.x.value + p.x.live, sketch.width), posMap(p.y.value + p.y.live, sketch.height), sizeMap(p.width.value + p.width.live, sketch.width), sizeMap(p.height.value + p.height.live, sketch.width)];

        }
        
    }

    function remap(n, start1, stop1, start2, stop2) {
      return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
    };

    function sizeMap(input, biggest){
        return remap(input, 0, 100, 0, biggest);
    }

    function posMap(input, biggest){
        return remap(input, -100, 100, 0, biggest);
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

        play: function(p5js){
            this.clearLive()
            this.update();
            this.draw(p5js);
        },


        update: function(p5js){
            var inputs = this.inputs;
            for (var i = 0, inLen = inputs.length; i < inLen; i++) {

                var input = inputs[i];
                    aff = input.affected;

                for(var j = 0, affLen = aff.length; j < affLen; j++){
                    var val = aff[j].out.apply(input); //OPTIMIZE IMPORTANT: cache value for each tick
                    aff[j].prop.live += val * aff[j].modifier;
                }

            };
        },

        draw: function(p5js){
            var len = this.objects.length - 1;
            for (var i = 0; i <= len; i++) {
                this.objects[i].draw(p5js);
            };
        },

        //OPTIMIZE: clear live while in update function
        clearLive: function(p5js){
            var inputs = this.inputs;
            for (var i = 0, inLen = inputs.length; i < inLen; i++) {
                var aff = inputs[i].affected;
                for(var j = 0, affLen = aff.length; j < affLen; j++){
                    aff[j].prop.live = 0;
                }
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
                    p5.stroke(0);
                    p5.strokeWeight(prop.stroke.value + prop.stroke.live);
                }
                p5.fill.apply(p5, toArgs(prop, "color"));
                p5.ellipse.apply(p5, toArgs(prop, "xywh", p5));
            },

            //STRUCTURE: make xywh new Physical, join with toProps(new Physical, new Color)
            props: {
                x: new RangeField(0, -100, 100),
                y: new RangeField(0, -100, 100),
                height: new RangeField(20, 0, 200),
                width: new RangeField(20, 0, 200),
                hue: new RangeField(0, 0, 360),
                saturation: new RangeField(100, 0, 100),
                brightness: new RangeField(50, 0, 100),
                alpha: new RangeField(100, 0, 100),
                stroke: new NumberField(100, 0),
            },
        },

        background: {
            name: "background",
            draw: function(p5){
                var p = this.props;
                p5.background(toArgs(p, "color"));
            },
            props: new ColorField(),

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
            out: {
                level: function(p){
                    return this.instance.getLevel();
                },
            },
            outProps: {
                level: {min:0, max:1, type:"number", hidden:true},
            },
            props: {
                
            },
            live: {
                normalizeToggle: false,
            },
            instance: null,
            affected: [],
            effects: [],
        }
    }


    $scope.addObject = function(object){
        var newObject = angular.copy(object);
        if(newObject.add)
            newObject.instance = newObject.add(newObject.props);
        $scope.scene.objects.push(newObject);
        $scope.selected(newObject);
        newObject.type = "object";

        return newObject;
    }

    $scope.addInput = function(input){
        var newInput = angular.copy(input);
        if(newInput.add)
            newInput.add($scope.sketch);

        newInput.type = "input";

        $scope.scene.inputs.push(newInput);
        $scope.selected(newInput);

        return newInput;
    }

    $scope.addConnection = function(input, output, property, name){
        input.affected.push({out: output, prop: property, modifier: 1, name: name});
        return input.affected[input.affected.length -1];
    }

    $scope.selected = function(object){
        $scope.open = object;
        $('select').material_select();
        $('.collapsible').collapsible();
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

            canvas.mouseClicked(function() {
                if (audio.isPlaying() ){
                  audio.stop();
                } else {
                  audio.play();
                }
            });

            //init p5
            
            p.background(200,200,200);
            p.colorMode(p.HSB, 360, 100, 100, 100);
            //audio.play();
            $('.collapsible').collapsible();
            $('.modal-trigger').leanModal();
            $('select').material_select();

            console.log("Ready!");

        }

        p.draw = function () {
            //$scope.scene.play(p);
            if(audio.isPlaying()){
                $scope.scene.clearLive()
                $scope.scene.update();
            }
            $scope.scene.draw(p);
        }
    }



    
    $scope.init = function(){
        $scope.addObject($scope.objects.clear);
        var ellipse = $scope.addObject($scope.objects.ellipse);

        var amp = $scope.addInput($scope.inputs.amplitude);
        amp.affected.push({out: amp.out.level, prop: ellipse.props.width, modifier:30, name: "ellipse.width"});
        amp.affected.push({out: amp.out.level, prop: ellipse.props.height, modifier:30, name: "ellipse.height"});
        amp.affected.push({out: amp.out.level, prop: ellipse.props.stroke, modifier:30, name: "ellipse.stroke"});
        amp.affected.push({out: amp.out.level, prop: ellipse.props.brightness, modifier:100, name: "ellipse.brightness"});
    }

})





.directive('input', function() {
  return {
    restrict: 'E',
    require: '?ngModel',
    link: function(scope, element, attrs, ngModel) {
        if ('type' in attrs && attrs.type.toLowerCase() === 'range') {
            ngModel.$parsers.push(parseFloat);
        }
    }
  };
})


.directive('subnav', function() {
  return {
    restrict: 'EA',
    replace:true,
    scope: {
      title: '@'
    },
    transclude:true,
    templateUrl: 'templates/subnav.html',
    link: function(scope, element, attrs) {
    }
  };
});



