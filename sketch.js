var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element, $timeout, $rootScope) {
    var audio, canvas;
    var localTag = "motifs";
    var MAX_FREQ = 22050;
    $scope.con = {input:{}, output:{}, obj:{}, prop:{}, prName:null};
    $scope.eff = {input:{}, output:{}, eff:{}};
    $scope.saved = JSON.parse(localStorage.getItem(localTag));
    $scope.curSave = {name: ""};
    $scope.offsets = [{dir:1, name:"down", icon:"arrow_downward"}, {dir:-1, name:"up", icon:"arrow_upward"}]


    //Creates a dict for number inputs
    var NumberField = function(val, minimum, func){
        var mini = minimum || -Infinity;
        if(minimum == 0) mini = 0;

        return {value: val, min: minimum, live: 0, func: func, real: 0, type: "number", htmlType: "number"}
    }

    var BooleanField = function(val, func){
        return {value: val, type: "boolean", live: val, func: func, htmlType: "checkbox"}
    }

    var ArrayField = function(val, func){
        var value = val || [];
        return {value: value, type: "array", live: value, func: func, htmlType: "text"}
    }

    //Creates a dict for range inputs
    var RangeField = function(start, minimum, maximum, func, inStep){
        var step = inStep || 0.1;
        return {value: start, min: minimum, max: maximum, step: step, live: 0, type:"number", htmlType: "range", func: func, real: start};
    }

    var ColorField = function(hue, bright, func){
        return {
            hue: new RangeField(0, 0, 360, func),
            saturation: new RangeField(100, 0, 100, func),
            brightness: new RangeField(100, 0, 100, func),
            alpha: new RangeField(100, 0, 100, func),
        }
    }

    //Returns a list of calculated parameters of given type
    function toArgs(p, type, sketch){
        switch(type){
            case "color":
                return [(p.hue.value+p.hue.live) % 360, p.saturation.value+p.saturation.live, p.brightness.value+p.brightness.live, p.alpha.value+p.alpha.live];

            case "xywhs":
               // console.log(p, [posMap(p.x.value + p.x.live, sketch.width), posMap(p.y.value + p.y.live, sketch.height), sizeMap(p.width.value + p.width.live, sketch.width), sizeMap(p.height.value + p.height.live, sketch.width)])
                return [posMap(p.x.value + p.x.live, sketch.width), posMap(p.y.value + p.y.live, sketch.height), sizeMap(p.width.value + p.width.live + p.size.value + p.size.live, sketch.width), sizeMap(p.height.value + p.height.live + p.size.value + p.size.live, sketch.width)];

        }

    }

    //returns object with key:value instead of key:field
    function toValues(propertiesObject){
        var props = angular.copy(propertiesObject);
        angular.forEach(props, function(prop, name){
            props[name] = prop.value;
        });

        return props;
    }

    //Applies defined effects to an output and caches it
    function processOutput(out, input){
        var processed = out.update.apply(input);
        var effs = out.effects;
        var effLen = effs.length;

        for (var i = 0; i < effLen; i++) {
            processed = effs[i].update(processed); 
        };

        out.live = processed;
        return processed;
    }

    function setupNormalDrawing(props, p5){
        if(!props.stroke.value){
            p5.noStroke();
        } else {
            p5.stroke(0);
            p5.strokeWeight(props.stroke.value + props.stroke.live);
        }
        p5.fill.apply(p5, toArgs(props, "color"));

        if(props.rotation.value || props.rotation.live){
            //translate(props.width.real/2, props.height.real/2);
            p5.rotate(props.rotation.value + props.rotation.live);
        }
    }

    //maps a value n with range between start1 and stop1 to a range between start2 and stop2
    function remap(n, start1, stop1, start2, stop2) {
      return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
    };

    //convert number to a positive integer
    function toPosInt(num){
        return Math.abs(Math.round(num));
    }

    //helper function for mapping canvas objects' size to canvas size, so they are displayed with same size on different monitors
    function sizeMap(input, biggest){
        return remap(input, 0, 100, 0, biggest);
    }

    function posMap(input, biggest){
        return remap(input, -100, 100, 0, biggest);
    }


    //called when angular is ready to start controller
    $scope.init = function(){

        $scope.sketch = new p5(sketch, $element[0]);

        //add default stuff if empty
        if($scope.scene.objects.length == 0){
            $scope.addObject($scope.objects.background, {saturation: 90, brightness: 90, hue:20});
            var ellipse = $scope.addObject($scope.objects.multiline);
            var input = $scope.addInput($scope.inputs.frequencies);
            var conn = $scope.addConnection(input, input.out.waveform, ellipse.props.points, "points_test", 1);
            //$scope.addEffect(input.out.level, $scope.effects.normalize, {smoothness: 5});
        } else {

            //re-initialize all input instances
            angular.forEach($scope.scene.inputs, function(input, name){
                if(input.add){
                    input.add($scope.sketch);
                }
            });
        }
    }

    //main drawer object with all added objects, inputs and connections stored
    $scope.scene = {
        objects: [],
        inputs: [],

        //helper function for running a normal tick
        play: function(p5js){
            this.clearLive()
            this.update();
            this.draw(p5js);
        },

        //main function for updating input values and object properties
        update: function(p5js){
            var inputs = this.inputs;
            for (var i = 0, inLen = inputs.length; i < inLen; i++) {

                var input = inputs[i];
                    affectList = input.affected;

                for(var j = 0, affectListLen = affectList.length; j < affectListLen; j++){
                    var affected = affectList[j];
                    var val = affected.out.live;

                    if(val == null){
                        val = processOutput(affected.out, input);
                    }

                    if(affected.prop.type != "array"){
                        affected.prop.live += val * affected.modifier;
                    } else {
                        affected.prop.live = val;
                        //console.log(val)
                    }
                }
            };
        },

        //actually draw the object on canvas
        draw: function(p5js){
            var len = this.objects.length - 1;
            for (var i = 0; i <= len; i++) {
                this.objects[i].draw(p5js);
            };
        },

        //OPTIMIZE: clear live while in update function
        //clears the live values from objects and inputs to prepare for a new tick
        clearLive: function(p5js){
            var inputs = this.inputs;

            for (var i = inputs.length - 1; i >= 0; i--) {
                var aff = inputs[i].affected;
                for (var j = aff.length - 1; j >= 0; j--) {
                    aff[j].prop.live = 0;
                    aff[j].out.live = null;
                };
            };
        },
    };


    //definitions of drawable objects
    $scope.objects = {
        ellipse: {
            name: "ellipse",
            draw: function(p5){
                var prop = this.props;
                var args = toArgs(prop, "xywhs", p5);
                prop.width.real = args[2];
                prop.height.real = args[3];

                setupNormalDrawing(prop, p5);

                p5.ellipse.apply(p5, args);
            },

            //STRUCTURE: make xywh new Physical, join with toProps(new Physical, new Color)
            props: {
                x: new RangeField(0, -200, 200),
                y: new RangeField(0, -200, 200),
                height: new RangeField(0, 0, 200),
                width: new RangeField(0, 0, 200),
                size: new RangeField(20, 0, 200),
                hue: new RangeField(0, 0, 360),
                saturation: new RangeField(100, 0, 100),
                brightness: new RangeField(50, 0, 100),
                alpha: new RangeField(100, 0, 100),
                rotation: new NumberField(0),
                stroke: new NumberField(0, 0),
            },
        },

        rect: {
            name: "rect",
            draw: function(p5){
                var prop = this.props;
                var args = toArgs(prop, "xywhs", p5);

                prop.width.real = args[2];
                prop.height.real = args[3];
                setupNormalDrawing(prop, p5);

                //args.push(prop.roundness);
                p5.rect.apply(p5, args);
            },

            //STRUCTURE: make xywh new Physical, join with toProps(new Physical, new Color)
            props: {
                x: new RangeField(0, -200, 200),
                y: new RangeField(0, -200, 200),
                height: new RangeField(0, 0, 200),
                width: new RangeField(0, 0, 200),
                size: new RangeField(20, 0, 200),
                roundness: new NumberField(0, 0),
                hue: new RangeField(0, 0, 360),
                saturation: new RangeField(100, 0, 100),
                brightness: new RangeField(50, 0, 100),
                alpha: new RangeField(100, 0, 100),
                rotation: new NumberField(0, -Infinity),
                stroke: new NumberField(0, 0),
            },
        },


        multiline: {
            name: "multiline",
            draw: function(p5){
               
                var props = this.props;

                if(!props.points.value.length && !props.points.live.length){
                    //no point data. No point (HA!) in continuing.
                    return;
                }

                p5.noFill();

                p5.strokeWeight(props.stroke.value + props.stroke.live);
                p5.stroke(toArgs(props, "color"));
                p5.strokeJoin(toPosInt(props.joints.value + props.joints.live) % 3);
                p5.strokeCap(toPosInt(props.caps.value + props.caps.live) % 3);
                p5.curveTightness(props.tightness.value + props.tightness.live);

                var xywh = toArgs(props, "xywhs", p5);
                //p5.translate(xywh[0], xywh[1]);
                //p5.scale(xywh[2], xywh[3]);
                //rotate


                /*
                Array possibilities:
                Defined point list CONNECTED TO number: all entries multiplied/affected by number
                ONE point in point list connected to number
                empty connected to array: display array
                point list connected to array: additive where lists overlap


                */
                var points = props.points.live; //props.points.real
                var curved = toPosInt(props.curved.value + props.curved.live) % 2;
                var isCoords = typeof(points[0][1]) != "undefined";
                var width = p5.width;
                var height = p5.height;
                var pointLength = points.length - 1;
                var spacing = sizeMap(props.spacing.value + props.spacing.live, width);
                var shape = toPosInt(props.shape.value + props.shape.live) % 8;
                var maximumVal = props.maximum.value;
                var minimumVal = props.minimum.value;
                var multiplier = props.multiplier.value + props.multiplier.live;
                var zeroPadded = props.zeroPadded.value + props.zeroPadded.live;

                p5.beginShape(shape);

                if(zeroPadded){
                    p5.vertex(posMap(-101, width), posMap(0, height));
                }

                for(var i = 0; i < pointLength; i++){
                    var x;
                    var y;

                    if(!isCoords){
                        x = i * spacing/10;
                        x = remap(x, 0, pointLength, 0, width);

                        y = points[i]*multiplier;
                        y = remap(y, minimumVal, maximumVal, 0, height);
                    } else {
                        x = points[i][0];
                        y = points[i][1];
                    }

                    

                    if(curved >= 1){
                        p5.curveVertex(x, y);
                    }
                    else {
                        p5.vertex(x, y);
                    }
                }

                if(zeroPadded){
                    p5.vertex(posMap(101, width), posMap(0, height));
                }

                p5.endShape(toPosInt(props.closed.value + props.closed.live) % 3);
                
            },

            props: {
                
                points: new ArrayField(),
                
                shape: new RangeField(0, 0, 8, null, 1),
                curved: new NumberField(0, 0),
                closed: new NumberField(0, 0),
                tightness: new NumberField(0),
                curve: new NumberField(1), //TODO bend vertex based on equation/number
                spacing: new NumberField(1, 0.0001),
                x: new RangeField(0, -200, 200),
                y: new RangeField(0, -200, 200),
                height: new RangeField(0, 0, 200),
                width: new RangeField(0, 0, 200),
                size: new RangeField(0, 0, 200),


                rotation: new NumberField(0),

                hue: new RangeField(0, 0, 360),
                saturation: new RangeField(100, 0, 100),
                brightness: new RangeField(0, 0, 100),
                alpha: new RangeField(100, 0, 100),
                stroke: new NumberField(5, 0),
                joints: new RangeField(0, 0, 3, null, 1),
                caps: new RangeField(0, 0, 3, null, 1),

                maximum: new NumberField(1),
                minimum: new NumberField(-1),
                multiplier: new NumberField(1),
                zeroPadded: new RangeField(0, 0, 1, null, 1),


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


    //definitions of data inputs
    $scope.inputs = {
        amplitude: {
            name: "amplitude",
            add: function(){
                this.instance = new p5.Amplitude();
            },
            out: {
                level: {
                    update: function(p){
                        return this.instance.getLevel();
                    },
                }
            },
        },

        frequencies: {
            name: "frequencies",
            add: function(){
                this.instance = new p5.FFT(this.props.smoothing.value, this.props.detail.real);
            },
            out: {
                waveform: {
                    update: function(p){
                        var waveform = this.instance.waveform(this.props.detail.real);
                        var detail = this.props.detail.real;
                        if(detail < 1024)
                            waveform.length = detail;

                        return waveform;
                    },
                    type: 'array',
                },
                spectrum: {
                    update: function(p){
                        var spectrum = this.instance.analyze(this.props.detail.real);

                        var detail = this.props.detail.real;
                        if(detail < 1024)
                            spectrum.length = detail;
                        //var start = this.props.startFreq;
                        //var stop = this.props.stopFreq;
                        //if(start )
                        return spectrum;
                    },
                    type: 'array',
                },
                energy: {
                    update: function(p){
                        if(this.out.spectrum.live == null)
                        {
                            this.out.spectrum.update.apply(this);
                        }
                        var start = this.props.startFreq;
                        var stop = this.props.stopFreq;
                        var energy = this.instance.getEnergy(start.value + start.live, stop.value + stop.live) / 2.55;

                        return energy;
                    },
                },
                centroid: {
                    update: function(p){
                        var spectrum = this.out.spectrum;
                        if(spectrum.live == null)
                        {
                            spectrum.update.apply(this);
                        }
                        var centroid = this.instance.getCentroid();
                        return centroid / MAX_FREQ * 100;
                    }
                }
            },
            props: {
                smoothing: new RangeField(0.8, 0, 0.99, function(parent, value){parent.instance.smooth(value)}, 0.01),
                startFreq: new RangeField(40, 40, MAX_FREQ),
                stopFreq: new RangeField(120, 40, MAX_FREQ),
                detail: new RangeField(6, 0, 6, function(parent, value){
                    var value = Math.floor(value);
                    if(value > 6) value = 6;
                    else if(value < 0) value = 0;
                    parent.props.detail.real = parent.props.detailLevels.value[value];
                }, 1),
                detailLevels: {value: [16, 32, 64, 128, 256, 512, 1024], hidden:true},
            }
        }
    }

    //definitions of data effects that can be applied to inputs and objects
    $scope.effects = {
      normalize: {
        name: "normalize",
        update: function(input){
          var output = this.instance.normalize(input);
          return output;
        },
        add: function(p){
          //{dynamic: true, damping: 1000, overflow: false, dampingMultiplier: 10, smoothness:10}
          var props = toValues(this.props);
          this.instance = new p5.Normalizer(props)
        },
        props: {
          smoothness: new NumberField(2, 0,         $scope.setInstanceProps),
          damping: new NumberField(1000, 0,         $scope.setInstanceProps),
          dampingMultiplier: new NumberField(10, 0, $scope.setInstanceProps),
          multiplier: new NumberField(1, 0,         $scope.setInstanceProps),
          dynamic: new BooleanField(true,           $scope.setInstanceProps),
          overflow: new BooleanField(false,         $scope.setInstanceProps),
          isArray: new BooleanField(false,          $scope.setInstanceProps),
          debug: new BooleanField(false,            $scope.setInstanceProps),
        },
        instance: null,
        affected: [] 
      }
    }


    $scope.addObject = function(object, props){
        var newObject = angular.copy(object);
        
        angular.forEach(props, function(value, name) {
            newObject.props[name].value = value;
        });

        if(newObject.add)
            newObject.instance = newObject.add(newObject.props);
        $scope.scene.objects.push(newObject);

        newObject.name = newObject.name + $scope.scene.objects.length;
        newObject.type = "object";

        $scope.slowUpdate("select");
        $scope.selected(newObject);
        return newObject;
    }

    $scope.addInput = function(newInput){

        var tryAgain = [];

        var input = {
            props: {},
            live: {},
            affected: [],
            type: "input",
        };

        var defaultOutput = {
            effects: [],
            live: null,
            type: 'number',
        }
        
        //add the input object to the defaults
        angular.extend(input, newInput);

        angular.forEach(input.out, function(out, name){
            angular.extend(out, defaultOutput);
        });

        angular.forEach(input.props, function(prop, name){
            if(prop.func){
                try{
                    prop.func(input, prop.value);
                }
                catch(err){
                    tryAgain.push(prop);
                }
            }
        });

        if(input.add)
            input.add($scope.sketch);

        angular.forEach(tryAgain, function(prop, name){
            if(prop.func){
                prop.func(input, prop.value);
            }
        });

        input.name = input.name + $scope.scene.inputs.length;

        $scope.scene.inputs.push(input);
        $scope.slowUpdate("select");
        $scope.selected(input);

        return input;
    }


    $scope.addEffect = function(affected, effect, props){
        var newEffect = angular.copy(effect);
        if(props)
          angular.extend(newEffect.props, props);

        if(newEffect.add)
            newEffect.add($scope.sketch);

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
        if(id)
            $scope.slowUpdate("openSelect", id);
    };

    $scope.updateLocalStorage = function(){
        localStorage.setItem(localTag, JSON.stringify($scope.saved));
    }

    $scope.setInstanceProps = function(parent){
        angular.forEach(parent.props, function(prop, name){
            parent.instance[name] = prop.value;
        });
    };

    $scope.slowUpdate = function(type, selector, func){
      $timeout(function (){
        switch (type) {
            case "select":
                $('select').material_select();
                break;

            case "collapsible":
                $('.collapsible').collapsible();
                break;

            case "openSelect":
                var val = $("#"+selector)[0].value;
                if(!val || val == "?")
                    $("#"+selector).siblings("input.select-dropdown").trigger("click");
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

    $scope.deleteIndex = function(index, array){
        array.splice(index, 1);
        $scope.slowUpdate("select");
        $scope.slowUpdate("collapsible");
    }

    $scope.moveIndex = function(index, offset, array){
        if(index+offset >= 0 && index+offset < array.length){
            var element = array[index];
            array.splice(index, 1);
            array.splice(index+offset, 0, element);

            $scope.slowUpdate("select");
            return true;
        } else {
            return false;
        }
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


    $scope.getText = function (id){
        return $(id)[0].selectedOptions[0].label;
    }

    $scope.filtered = function(toFilter, prop, value){
        return toFilter; //Todo fix rest

        /*var out = {};
        angular.forEach(toFilter, function(item, key){
            console.log(item, prop, key, value)
            if(item[prop] === value){
                out[key] = item;
            }
        });
        return out;*/
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
            p.rectMode(p.CENTER);
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

        p.windowResized = function() {
          p.resizeCanvas(parent.width(), parent.height());
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
      title: '@',
    },
    transclude:true,
    templateUrl: 'templates/subnav.html',
    link: function(scope, element, attrs) {
    }
  };
});
