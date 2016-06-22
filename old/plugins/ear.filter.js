var Filter  = function (ear, options) {
    options = options || {};
    this.ear = ear;
    this.test = options.test || true;
}

Filter.prototype = {
    test : function(value) {
        return test;
    }
}

Ear.Filter = Filter;

/*
// Create offline context
var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);

// Create buffer source
var source = offlineContext.createBufferSource();
source.buffer = buffer;

// Create filter
var filter = offlineContext.createBiquadFilter();
filter.type = "lowpass";

// Pipe the song into the filter, and the filter into the offline context
source.connect(filter);
filter.connect(offlineContext.destination);

// Schedule the song to start playing at time:0
source.start(0);

// Render the song
offlineContext.startRendering()

// Act on the result
offlineContext.oncomplete = function(e) {
  // Filtered buffer!
  var filteredBuffer = e.renderedBuffer;
};
*/