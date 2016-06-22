/*
 * Waveform plugin for dancer.js
 *
 * var dancer = new Dancer('song.ogg'),
 *     canvas = document.getElementById('waveform');
 * dancer.waveform( canvas, { strokeStyle: '#ff0077' });
 */

(function() {
  Ear.addPlugin( 'waveform', function( canvas, options ) {
    options = options || {};
    console.log("canvas", canvas)
    var
      ctx     = canvas.getContext( '2d' ),
      h       = canvas.height,
      w       = canvas.width,
      width   = options.width || 2,
      start   = options.start || 0,
      spacing = options.spacing || 0,
      count   = options.count || 1024;

    ctx.lineWidth   = options.strokeWidth || 1;
    ctx.strokeStyle = options.strokeStyle || "white";

    this.bind( 'update', function() {
      var waveform = this.getWaveform();
      ctx.clearRect( 0, 0, w, h );
      ctx.beginPath();
      ctx.moveTo( 0, h/2);
      for ( var i = start, l = waveform.length; i < l && i < count; i++ ) {
        ctx.lineTo( (i - start) * ( spacing + width), ( h / 2 ) + waveform[ i ] * ( h / 2 ));
      }
      ctx.stroke();
      ctx.closePath();
    });

    return this;
  });
})();
