var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element, $timeout) {
    var audio, canvas;
    var localTag = "motifs";
    $scope.con = {input:{}, output:{}, obj:{}, prop:{}, prName:null};
    $scope.saved = JSON.parse(localStorage.getItem(localTag));
    $scope.curSave = {name: ""};



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


    $scope.init = function(){

        $scope.sketch = new p5(sketch, $element[0]);

        //add default stuff if empty
        if($scope.scene.objects.length == 0){
            $scope.addObject($scope.objects.clear);

            var amp = $scope.addInput($scope.inputs.amplitude);
            $scope.addEffect(amp, $scope.effects.normalize);
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
                    //var val = input.live[outName];
                    //if(!val){
                      var val = aff[j].out.apply(input);
                      //out.cache = val;
                    //}

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
                stroke: new NumberField(0, 0),
            },
        },

        background: {
            name: "background",
            draw: function(p5){
                var p = this.props;
                p5.background(toArgs(p, "color"));
            },
            props: new ColorField
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
                level: {min:0, max:1, type:"number"},
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

    $scope.effects = {
      normalize: {
        update: function(input){
          var output = this.instance.normalize(input);
          return output;
        },
        add: function(p){
          //{dynamic: true, damping: 1000, overflow: false, dampingMultiplier: 10, smoothness:10}
          this.instance = new p5.Normalizer(this.props)
        },
        props: {
          /*dynamic: this.instance.dynamic,
          damping: this.instance.damping,
          dampingMultiplier: this.instance.dampingMultiplier,
          multiplier: this.instance.multiplier,
          overflow: this.instance.overflow,
          smoothness: this.instance.smoothness,
          debug: this.instance.debug,
          isArray: this.instance.isArray,*/
        },
        set: function(options){
          this.props = angular.extend(this.props, options);
        },
        instance: null,
      }
    }


    $scope.addObject = function(object, props){
        var newObject = angular.copy(object);
        if(props)
          angular.extend(newObject.props, props);

        if(newObject.add)
            newObject.instance = newObject.add(newObject.props);
        $scope.scene.objects.push(newObject);

        $scope.slowUpdate("select");
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
        $scope.slowUpdate("select");
        $scope.selected(newInput);

        return newInput;
    }


    $scope.addEffect = function(affected, effect, props){
        var newEffect = angular.copy(effect);
        if(props)
          angular.extend(newEffect.props, props);

        if(newEffect.add)
            newEffect.add(newEffect.props);

        if(!affected.effects)
            affected.effects = [];

        affected.effects.push(newEffect);

        newEffect.type = "effect";
        $scope.slowUpdate("collapsible");

        return newEffect;
    }

    $scope.addConnection = function(input, output, property, givenName, modifier){
        var mod = modifier || 1;
        var name = givenName || "unnamed";
        input.affected.push({out: output, prop: property, modifier: mod, name: name});
        $scope.slowUpdate("collapsible");

        return input.affected[input.affected.length -1];
    }

    $scope.selected = function(object){
        $scope.open = object;
        $scope.slowUpdate("collapsible");
    }

    $scope.clickSel = function(id){
        $scope.slowUpdate("select");
    };

    $scope.updateLocalStorage = function(){
        localStorage.setItem(localTag, JSON.stringify($scope.saved));
    }

    $scope.slowUpdate = function(type, selector, func){
      $timeout(function (){
        switch (type) {
          case "select":
            $('select').material_select();
            break;

          case "collapsible":
            $('.collapsible').collapsible();
            break;

          default:
            $(selector).call(func);
            break;
        }
      }, 0);
    };

    $scope.save = function(){
        if(!$scope.saved){
            $scope.saved = {};
        }

        $scope.curSave.scene = {objects: $scope.scene.objects, inputs: $scope.scene.inputs};
        $scope.curSave.song = $scope.song;
        $scope.saved[$scope.curSave.name] = angular.copy($scope.curSave);
        $scope.updateLocalStorage();

        $scope.slowUpdate("collapsible");
    };

    $scope.openSave = function(save){
        $scope.curSave = save;
        $scope.scene = angular.extend($scope.scene, save.scene);
        $scope.song = save.song;

        $scope.restart();

    }

    $scope.deleteSave = function(save){
        delete $scope.saved[save.name];
        $scope.updateLocalStorage();
    }


    $scope.selectSong = function(song){
        $scope.song = song;

        $scope.restart();
    }

    $scope.restart = function(){
        audio.stop();
        $scope.sketch.remove();
        $scope.init();
    }

    var sketch = function(p){
        var parent;

        p.preload = function(){
            $scope.songs = ["bepop.mp3", "better.mp3", "breeze.mp3", "cold.mp3", "fade.mp3", "fuck.mp3", "funk.mp3", "good.mp3", "hungry.mp3", "intro_altj.mp3", "ipaena.mp3", "love.mp3", "matilda.mp3", "mykonos.mp3", "norge.mp3", "nothingness.mp3", "pizza.mp3", "plans.mp3", "ridge.mp3", "sage.mp3"];
            
            if(!$scope.song)
                $scope.song = $scope.songs[Math.floor(Math.random() * $scope.songs.length)];

            var AUDIO_FILE = "songs/"+$scope.song;

            audio = p.loadSound(AUDIO_FILE);
            parent = $("#canvas-container");
        }

        p.setup = function () {
            canvas = p.createCanvas(parent.width(), parent.height());
            canvas.parent(parent.attr('id'));

            audio.play();

            canvas.mouseClicked(function() {
                if (audio.isPlaying() ){
                  audio.stop();
                } else {
                  audio.play();
                }
            });

            //init p5

            $scope.slowUpdate("collapsible");
            $scope.slowUpdate("select");

            p.background(200,200,200);
            p.colorMode(p.HSB, 360, 100, 100, 100);
            //audio.play();

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
