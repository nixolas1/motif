scene.update()
scene = [bg, eclipse, etc]
foreach(element in scene){
    element.draw()
}
eclipse.draw = function(){p5.ecclipse({size: this.sizeVal()}, ...)}
this.sizeVal() = sum(this.inputSizes)
this.inputSizes = [initialSize, energy]
energy = new Energy(){ this.fft = window.fft || new FFT(options); return this.fft.energy(); this.effects = [normalize, smooth]}
foreach(this.effects as effect){
    energy.output = effect.apply(energy.output)
}


fft = new FFT({smooth: 10});
energy = new fft.energy()
energy.effects.push(new Normalize({}))

function addEffect(analyzer, property, effect){
    analyzer.[property].addEffect(effect);
}


/*
audio analizer outputs

amplitude
    properties
        
    outputs
        volume


fft
    properties
        range
        smooth

    outputs
        frequency/average sum
        waveform
        spectrum
        energy
        spectrum center



beat
    properties
        frequency
        decayrate
        threshold
        beatspacing

        
    outputs
        isBeat
        onBeat
        bpm
        timeToNextBeat
        timeSinceLastBeat


peak
    properties
        decayrate
        threshold
        beatspacing
        
    outputs
        volume
        isBeat
        onBeat
        timeSinceLastBeat
        maxVolume


note
    properties
        ?
    outputs
        note


========================

normalize

smooth

filter

threshold

     

*/