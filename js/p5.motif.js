p5.Normalizer = function(options){
    options = options || {};

    this.dynamic = options.dynamic || true; //if true max and min values will follow the average values
    this.damping = options.damping || 1000; //how fast the dynamic values should change
    this.dampingMultiplier = options.dampingMultiplier || 10; //difference between positive and negative change in max values
    this.multiplier = options.multiplier || 1; //simply multiplies the output with given number
    this.overflow = options.overflow || false; //allow value to overflow 1 when there is a higher input than normal
    this.smoothness = options.smoothness || 0;
    this.debug = options.debug || false;
    this.isArray = options.isArray || false;

    this.array = [];
    this.maximum = 1;
    this.minimum = 0;
    this.current = 0;
    this.previous = [];
    this.first = true;

    if(this.damping < 1)
        this.damping = 1;

    console.log("added normalizer with", this)

}

p5.Normalizer.prototype = {
    normalize : function(value) {

        if(this.first){
            this.first = false;
            this.maximum = value;
            this.minimum = value;
        }


        if(this.isArray){
            this.array = value;
            value = this.arrayMax(this.array);
        }

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
            try {
                console.log("in", value.toFixed(4), "out", this.current.toFixed(4), "max", this.maximum.toFixed(4), "min", this.minimum.toFixed(4));
            } catch (err) {
                console.log("in", value, "out", this.current, "max", this.maximum, "min", this.minimum);
            }
        }

        if(this.smoothness > 0){
            return this.smooth(this.current)
        }

        if(this.isArray){
            return this.normalizedArray(value);
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
    },

    arrayMax : function(arr){
        var len = arr.length, max = -Infinity;
        while (len--) {
          if (arr[len] > max) {
            max = arr[len];
          }
        }
        return max;
    },

    normalizedArray : function(normalizer){
        var arr = arr = this.array;
        var len = arr.length;
        while (len--) {
          arr[len] = (normalizer - this.minimum) / this.maximum;
        }
        return arr;
    }
}


/*p5.BeatAnalyzer = function (freq1, freq2, threshold, decayRate, beatSpacing) {
    //this.framesPerPeak = _framesPerPeak || 20;
    //this.decayRate = decayRate || 0.95;
    //this.threshold = threshold || 0.35;
    //this.spacing = beatSpacing || 1000;
    //this.cutoff = 0;

    this.bpm = 120;
    //this.framesSinceLastBeat = 0;
    //this.isDetected = false;
    //this.f1 = freq1 || 40;
    //this.f2 = freq2 || 20000;
    // function to call when a peak is detected
    this._onBeat = function () {
    };
  };


  p5.BeatAnalyzer.prototype.update = function (peak) {
    if(peak.isDetected){
        
    }



    var nrg = this.energy = fftObject.getEnergy(this.f1, this.f2) / 255;
    if (nrg > this.cutoff && nrg > this.threshold && nrg - this.penergy > 0) {
      // trigger callback
      this._onPeak();
      this.isDetected = true;
      // debounce
      this.cutoff = nrg * this.cutoffMult;
      this.framesSinceLastPeak = 0;
    } else {
      this.isDetected = false;
      if (this.framesSinceLastPeak <= this.framesPerPeak) {
        this.framesSinceLastPeak++;
      } else {
        this.cutoff *= this.decayRate;
        this.cutoff = Math.max(this.cutoff, this.threshold);
      }
    }
    this.currentValue = nrg;
    this.penergy = nrg;
  };
  
  p5.BeatAnalyzer.prototype.onBeat = function (callback, val) {
    var self = this;
    self._onPeak = function () {
      callback(self.energy, val);
    };
  };
*/