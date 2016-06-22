(function ( Ear ) {

  var CODECS = {
    'mp3' : 'audio/mpeg;',
    'ogg' : 'audio/ogg; codecs="vorbis"',
    'wav' : 'audio/wav; codecs="1"',
    'aac' : 'audio/mp4; codecs="mp4a.40.2"'
  },
  audioEl = document.createElement( 'audio' );

  Ear.options = {};

  Ear.setOptions = function ( o ) {
    for ( var option in o ) {
      if ( o.hasOwnProperty( option ) ) {
        Ear.options[ option ] = o[ option ];
      }
    }
  };

  Ear.isSupported = function () {
    if ( !window.Float32Array || !window.Uint32Array ) {
      return null;
    } else if ( !isUnsupportedSafari() && ( window.AudioContext || window.webkitAudioContext )) {
      return 'webaudio';
    } else if ( audioEl && audioEl.mozSetup ) {
      return 'audiodata';
    } else if ( FlashDetect.versionAtLeast( 9 ) ) {
      return 'flash';
    } else {
      return '';
    }
  };

  Ear.canPlay = function ( type ) {
    var canPlay = audioEl.canPlayType;
    return !!(
      Ear.isSupported() === 'flash' ?
        type.toLowerCase() === 'mp3' :
        audioEl.canPlayType &&
        audioEl.canPlayType( CODECS[ type.toLowerCase() ] ).replace( /no/, ''));
  };

  Ear.addPlugin = function ( name, fn ) {
    if ( Ear.prototype[ name ] === undefined ) {
      Ear.prototype[ name ] = fn;
    }
  };

  Ear.makeSupportedPath = function ( source, codecs ) {
    if ( !codecs ) { return source; }

    for ( var i = 0; i < codecs.length; i++ ) {
      if ( Ear.canPlay( codecs[ i ] ) ) {
        return source + '.' + codecs[ i ];
      }
    }
    return source;
  };

  Ear._getAdapter = function ( instance ) {
    switch ( Ear.isSupported() ) {
      case 'webaudio':
        return new Ear.adapters.webaudio( instance );
      case 'audiodata':
        return new Ear.adapters.moz( instance );
      case 'flash':
        return new Ear.adapters.flash( instance );
      default:
        return null;
    }
  };

  Ear._getMP3SrcFromAudio = function ( audioEl ) {
    var sources = audioEl.children;
    if ( audioEl.src ) { return audioEl.src; }
    for ( var i = sources.length; i--; ) {
      if (( sources[ i ].type || '' ).match( /audio\/mpeg/ )) return sources[ i ].src;
    }
    return null;
  };

  // Browser detection is lame, but Safari 6 has Web Audio API,
  // but does not support processing audio from a Media Element Source
  // https://gist.github.com/3265344
  function isUnsupportedSafari () {
    var
      isApple = !!( navigator.vendor || '' ).match( /Apple/ ),
      version = navigator.userAgent.match( /Version\/([^ ]*)/ );
    version = version ? parseFloat( version[ 1 ] ) : 0;
    return isApple && version <= 6;
  }

})( window.Ear );
