
//definitions of data effects that can be applied to inputs and objects
MotifEffects = {
  normalize: {
    name: "normalize",
    update: function(input){
        var output = this.instance.normalize(input);  
        return output;
    },
    add: function(p){
      //{dynamic: true, damping: 1000, overflow: false, dampingMultiplier: 10, smoothness:10}
      var props = toValues(this.props);
      this.instance = new p5.Normalizer(props)
    },
    props: {
      smoothness: new NumberField(2, 0,         setInstanceProps),
      damping: new NumberField(1000, 0,         setInstanceProps),
      dampingMultiplier: new NumberField(10, 0, setInstanceProps),
      multiplier: new NumberField(1, 0,         setInstanceProps),
      dynamic: new BooleanField(true,           setInstanceProps),
      overflow: new BooleanField(false,         setInstanceProps),
      isArray: new BooleanField(false,          setInstanceProps),
      debug: new BooleanField(false,            setInstanceProps),
    },
    instance: null,
    affected: [] 
  }
}