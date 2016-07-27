

//definitions of data inputs
MotifInputs = {

    //get live amplitude/volume
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

    //get frequency data like waveform, spectrum, energy at frequencies, frequency center
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
                    var start = this.props.startFreq;
                    var stop = this.props.stopFreq;
                    var energy = this.instance.getEnergy(start.value + start.live, stop.value + stop.live) / 2.55;

                    return energy;
                },
                dependent: function(parent){return parent.out.spectrum},
            },
            centroid: {
                update: function(p){
                    var centroid = this.instance.getCentroid();
                    return centroid / MAX_FREQ * 100;
                },

                dependent: function(parent){return parent.out.spectrum},
            }
        },
        props: {
            smoothing: new RangeField(0.8, 0, 0.9999, function(parent, value){parent.instance.smooth(value)}, 0.0005),
            startFreq: new RangeField(20, 20, MAX_FREQ),
            stopFreq: new RangeField(120, 20, MAX_FREQ),
            detail: new RangeField(6, 0, 6, function(parent, value){
                var value = Math.floor(value);
                if(value > 6) value = 6;
                else if(value < 0) value = 0;
                parent.props.detail.real = parent.props.detailLevels.value[value];
            }, 1),
            detailLevels: {value: [16, 32, 64, 128, 256, 512, 1024], hidden:true},
        }
    },

    //Detect peaks in frequency spectrum amplitude
    peakDetector: {
        name: "peakDetector",
        add: function(){
            this.instance = new p5.PeakDetect();
        },
        out: {
            onPeak: {
                update: function(p){
                    this.instance.update(globalFFT.instance);
                    return this.instance.isDetected;
                },
                dependent:  function(parent){ return globalFFT.out.spectrum; },
                dependentParent: function(){ return globalFFT; },
            },
            //todo: make ms since last
            framesSinceLastPeak: {
                update: function(p){
                    return this.instance.framesSinceLastPeak;
                },
                dependent:  function(parent){return parent.out.onPeak},
            },

            energy: {
                update: function(p){
                    return this.instance.penergy;
                },
                dependent:  function(parent){return parent.out.onPeak},
            }
        },
        props: {
            threshold: new RangeField(0.35, 0, 1, setInstanceProps, 0.0005),
            f1: new RangeField(20, 20, MAX_FREQ, setInstanceProps),
            f2: new RangeField(300, 20, MAX_FREQ, setInstanceProps),
            framesPerPeak: new RangeField(20, 1, 500, setInstanceProps, 1),
        }
    },

    // from https://github.com/cwilso/PitchDetect
    note: {
        name: "note",
        out: {
            note: {
                update: function(p){
                    /*
                    
                    var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
                    var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

                    function autoCorrelate( buf, sampleRate ) {
                        var SIZE = buf.length;
                        var MAX_SAMPLES = Math.floor(SIZE/2);
                        var best_offset = -1;
                        var best_correlation = 0;
                        var rms = 0;
                        var foundGoodCorrelation = false;
                        var correlations = new Array(MAX_SAMPLES);

                        for (var i=0;i<SIZE;i++) {
                            var val = buf[i];
                            rms += val*val;
                        }
                        rms = Math.sqrt(rms/SIZE);
                        if (rms<0.01) // not enough signal
                            return -1;

                        var lastCorrelation=1;
                        for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
                            var correlation = 0;

                            for (var i=0; i<MAX_SAMPLES; i++) {
                                correlation += Math.abs((buf[i])-(buf[i+offset]));
                            }
                            correlation = 1 - (correlation/MAX_SAMPLES);
                            correlations[offset] = correlation; // store it, for the tweaking we need to do below.
                            if ((correlation>GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
                                foundGoodCorrelation = true;
                                if (correlation > best_correlation) {
                                    best_correlation = correlation;
                                    best_offset = offset;
                                }
                            } else if (foundGoodCorrelation) {
                                // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
                                // Now we need to tweak the offset - by interpolating between the values to the left and right of the
                                // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
                                // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
                                // (anti-aliased) offset.

                                // we know best_offset >=1, 
                                // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
                                // we can't drop into this clause until the following pass (else if).
                                var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
                                return sampleRate/(best_offset+(8*shift));
                            }
                            lastCorrelation = correlation;
                        }
                        if (best_correlation > 0.01) {
                            // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
                            return sampleRate/best_offset;
                        }
                        return -1;
                    //  var best_frequency = sampleRate/best_offset;
                    }

                    function updatePitch( time ) {
                        var cycles = new Array;
                        analyser.getFloatTimeDomainData( buf );
                        var ac = autoCorrelate( buf, audioContext.sampleRate );
                    // TODO: Paint confidence

                    */
                },
            }
        },
    },
}