

//definitions of data inputs
MotifInputs = {
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
            smoothing: new RangeField(0.8, 0, 0.9999, function(parent, value){parent.instance.smooth(value)}, 0.0005),
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