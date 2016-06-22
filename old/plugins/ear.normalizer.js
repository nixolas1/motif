var Normalizer  = function (options) {
    options = options || {};

    this.dynamic = options.dynamic || true; //if true max and min values will follow the average values
    this.damping = options.damping || 1000; //how fast the dynamic values should change
    this.dampingMultiplier = options.dampingMultiplier || 10; //difference between positive and negative change in max values
    this.multiplier = options.multiplier || 1; //simply multiplies the output with given number
    this.overflow = options.overflow || false; //allow value to overflow 1 when there is a higher input than normal
    this.smoothness = options.smoothness || 0;
    this.debug = options.debug || false;

    this.maximum = 0;
    this.minimum = 0;
    this.current = 0;
    this.previous = [];

    if(this.damping < 1)
        this.damping = 1;

    console.log("PLUGIN Normalizer loaded")
}

Normalizer.prototype = {
    normalize : function(value) {
        if(this.dynamic)
        {
            var maxDiff = value - this.maximum;
            var maxDamp = maxDiff > 0 ? this.damping / this.dampingMultiplier : this.damping * this.dampingMultiplier;  //max value grows faster if diff is positive, and slower if negative
            this.maximum += maxDiff / maxDamp;
            
            var minDiff = value - this.minimum;
            var minDamp = minDiff < 0 ? this.damping / this.dampingMultiplier : this.damping * this.dampingMultiplier;  //min value grows slower if diff is positive, and faster if negative
            this.minimum += minDiff / minDamp;

            this.current = (value - this.minimum) / this.maximum;

            //make sure output is between 0-1 if overflow isnt allowed
            if(!this.overflow){
                if(this.current < 0) this.current = 0;
                else if(this.current > 1) this.current = 1;
            }

        } else { //absolute normalizer
            if(value > this.maximum)
            {
                this.maximum = value;
            }
            if(value < this.minimum)
            {
                this.minimum = value;
            }
            this.current = (value - this.minimum) / this.maximum;
        }

        if(this.debug){
            console.log("in", value.toFixed(4), "out", this.current.toFixed(4), "max", this.maximum.toFixed(4), "min", this.minimum.toFixed(4));
        }

        if(this.smoothness > 0){
            return this.smooth(this.current)
        }

        return this.current;
    },

    smooth : function(value) {
        this.previous.push(value);
        var sum = 0;
        var length = this.previous.length;

        for(var i = 0; i < length; i++){
            sum += this.previous[i];
        }

        if(length >= this.smoothness){
            this.previous.shift();
        }

        return sum/length;

    },

    reset : function() {
        this.maximum = 0;
        this.minimum = 0;
        this.current = 0;
        return this;
    }
}

Ear.Normalizer = Normalizer;
