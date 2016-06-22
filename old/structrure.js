//initializing
ear = new Ear(song)


ear.onBeat({}, func)
beat = new Beat(ear, options{frequency, threshold, decay})





ear.volume.left.normalize




//events triggered during song playback
beat.onBeat(func)
vs
note.onNote(note, func)
kick.onKick(kick, func)
ear.onTreble
vs
ear.onEvent('note')

//live data
beat.getTimeLeft
beat.getAmplitude

note.getTone
note.getAmplitude
note.getDuration
note.getTimeLeft

ear.getEnergy
ear.getAmplitude
ear.getWaveForm()
ear.getSpectrum()

//get raw music stream data
ear.music
    .play
    .stop
    .pause
    .setPosition
    .getPosition



//get music info
ear.getMaxAmplitude(start, stop)
ear.getMinAmplitude(start, stop)
ear.getTempo(start, stop)
ear.getDuration()
ear.getNormalizedVolume()

//piping (for internal use and advanced usage)
low = Ear.filter(ear.music, lowpass) //low = audiobuffer?
kicks = Ear.kickDetect(low, options) //kicks = (time, intensity) array

beat = Ear.beatAnalyzer(kicks, options) //beat = number or list of times


//endringer i tempo

instream = load('lol.mp3')

instream.filter('lowpass', threshold=440).filter('highpass')
    .onKick(myFunc)
    .onBeat(myBeatFunc)


//advanced analysis events. Not priority
ear.onDrop()
ear.onFadeOut()
ear.onIntroFinished()



//visualizer usage of Ear
dream = new Dream(ear)
eclipseViz = dream.visual(Circle, 14, options)

function Circle(){
    var options = {
        color: color || ear.note,
        radius: radius || ear.beat.timeLeft
    }



    function onUpdate() {
        canvas.startFill(options.color)
        canvas.drawCircle(options.radius)
    }
}
