var app = angular.module('motif', []);
app.controller('mainCtrl', function($scope, $element, $timeout, $rootScope) {
    $scope.con = {input:{}, output:{}, obj:{}, prop:{}, prName:null};
    $scope.eff = {input:{}, output:{}, eff:{}};
    $scope.saved = JSON.parse(localStorage.getItem(localTag));
    $scope.curSave = {name: ""};
    $scope.offsets = [{dir:1, name:"down", icon:"arrow_downward"}, {dir:-1, name:"up", icon:"arrow_upward"}]


    //called when angular is ready to start controller
    $scope.init = function(){

        $scope.sketch = new p5(sketch, $element[0]);
        $scope.inputs = angular.copy(MotifInputs);
        $scope.objects = angular.copy(MotifObjects);
        $scope.effects = angular.copy(MotifEffects);

        //add default stuff if empty
        if($scope.scene.objects.length == 0){
            $scope.addObject($scope.objects.blending, {mode: "BLEND"});
            $scope.addObject($scope.objects.background, {saturation: 90, brightness: 90, hue:20});
            var input = globalFFT = $scope.addInput($scope.inputs.frequencies, true);

            var ellipse = $scope.addObject($scope.objects.ellipse);
            //var conn = $scope.addConnection(input, input.out.energy, ellipse.props.size, "points_test", 10);
            //$scope.addEffect(input.out.energy, $scope.effects.normalize, {smoothness: 5, debug: true});
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
                var input = inputs[i];
                var aff = input.affected;
                for (var j = aff.length - 1; j >= 0; j--) {
                    var element = aff[j];
                    element.prop.live = 0;
                    element.out.live = null;

                    if(element.out.dependent){
                        element.out.dependent(input).live = null;
                    }
                };
            };
        },
    };


    $scope.addObject = function(object, props, undeletable){
        var newObject = angular.copy(object);
        
        angular.forEach(props, function(value, name) {
            newObject.props[name].value = value;
        });

        if(newObject.add)
            newObject.instance = newObject.add(newObject.props);

        newObject.name = newObject.name + "_" + ($scope.scene.objects.length+1);
        newObject.type = "object";
        newObject.undeletable = undeletable;

        $scope.scene.objects.push(newObject);

        $scope.slowUpdate("select");
        $scope.selected(newObject);
        return newObject;
    }

    $scope.addInput = function(newInput, undeletable){

        var tryAgain = [];

        var input = {
            props: {},
            live: {},
            affected: [],
            type: "input",
            undeletable: undeletable,
        };

        var defaultOutput = {
            effects: [],
            live: null,
            type: 'number',
        }
        
        //add the input object to the defaults
        angular.merge(input, newInput);

        angular.forEach(input.out, function(out, name){
            angular.merge(out, defaultOutput);
        });

        //run all properties' onUpdate functions
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

        //instantiate
        if(input.add)
            input.add($scope.sketch);

        angular.forEach(tryAgain, function(prop, name){
            if(prop.func){
                prop.func(input, prop.value);
            }
        });

        //give it a unique name
        input.name = input.name + "_" + ($scope.scene.inputs.length+1);

        $scope.scene.inputs.push(input);
        $scope.slowUpdate("select");
        $scope.selected(input);

        return input;
    }


    $scope.addEffect = function(affected, effect, props){
        var newEffect = angular.copy(effect);
        if(props)
          angular.merge(newEffect.props, props);

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
        $scope.scene = angular.merge($scope.scene, save.scene);
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
            $scope.song = "songs/"+$scope.songs[Math.floor(Math.random() * $scope.songs.length)];

        audio = p.loadSound($scope.song);
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

        $("#loading-container").remove();
        $("footer").show();
        p.windowResized();

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
        var footerHeight = $("footer").height();
        if(footerHeight > window.innerHeight/4) footerHeight = window.innerHeight/4;
        if(footerHeight < 150) footerHeight = 150;
        var height = window.innerHeight - footerHeight - 7;
        p.resizeCanvas(parent.width(), height);
    }
}


});