var Boiler  = function (options) {
    options = options || {};
    this.test = options.test || true;
}

Boiler.prototype = {
    test : function(value) {
        return test;
    }
}

Ear.Boiler = Boiler;
