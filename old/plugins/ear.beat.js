var Beat  = function (ear, options) {
    options = options || {};
    this.ear = ear;
    
    this.test = options.test || true;
}

Beat.prototype = {
    test : function(value) {
        return test;
    }
}

Ear.Beat = Beat;

//http://stackoverflow.com/questions/30110701/how-can-i-use-js-webaudioapi-for-beat-detection