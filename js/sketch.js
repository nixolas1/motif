
var audio, canvas;
var localTag = "motifs";
var NAME_SEPARATOR = "_";
var MAX_FREQ = 20000;
var SERVER_LIST_URL = "./server/saves.php";

var globalFFT = {};

Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
    }
    return -1;
}

//Creates a dict for number inputs
var NumberField = function(val, minimum, func, step){
    var mini = minimum || -Infinity;
    if(minimum == 0) mini = 0;

    return {value: val, min: minimum, step: step, live: 0, func: func, real: 0, type: "number", htmlType: "number"}
}

var BooleanField = function(val, func){
    return {value: val, type: "boolean", live: val, func: func, htmlType: "checkbox"}
}

var ArrayField = function(val, func){
    var value = val || [];
    return {value: value, type: "array", live: value, func: func, htmlType: "text"}
}

var SelectField = function(val, values, func){
    if(!val && values){
        val = values[0];
    }

    return {value: val, options: values, type: "array", live: val, func: func, htmlType: "select"}
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
    if(out.dependent){
        var dependent = out.dependent(input);
        if(dependent && dependent.live == null){
            dependent.live = processOutput(dependent, out.dependentParent || input);
        }
    }
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

var setInstanceProps = function(parent){
    if(parent){
        angular.forEach(parent.props, function(prop, name){
            if(prop.value || prop.value == 0)
                parent.instance[name] = prop.value;
        });
    }
};

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
