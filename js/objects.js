
//definitions of drawable objects
MotifObjects = {
    ellipse: {
        name: "ellipse",
        draw: function(p5){
            var prop = this.props;
            var args = toArgs(prop, "xywhs", p5);
            prop.width.real = args[2];
            prop.height.real = args[3];

            setupNormalDrawing(prop, p5);

            p5.ellipse.apply(p5, args);
        },

        //STRUCTURE: make xywh new Physical, join with toProps(new Physical, new Color)
        props: {
            x: new RangeField(0, -200, 200),
            y: new RangeField(0, -200, 200),
            height: new RangeField(0, 0, 200),
            width: new RangeField(0, 0, 200),
            size: new RangeField(20, 0, 200),
            hue: new RangeField(0, 0, 360),
            saturation: new RangeField(100, 0, 100),
            brightness: new RangeField(50, 0, 100),
            alpha: new RangeField(100, 0, 100),
            rotation: new NumberField(0),
            stroke: new NumberField(0, 0),
        },
    },

    rect: {
        name: "rect",
        draw: function(p5){
            var prop = this.props;
            var args = toArgs(prop, "xywhs", p5);

            prop.width.real = args[2];
            prop.height.real = args[3];
            prop.roundness.real = Math.abs(prop.roundness.value + prop.roundness.live);
            args.push(prop.roundness.real);
            setupNormalDrawing(prop, p5);

            //args.push(prop.roundness);
            p5.rect.apply(p5, args);
        },

        //STRUCTURE: make xywh new Physical, join with toProps(new Physical, new Color)
        props: {
            x: new RangeField(0, -200, 200),
            y: new RangeField(0, -200, 200),
            height: new RangeField(0, 0, 200),
            width: new RangeField(0, 0, 200),
            size: new RangeField(20, 0, 200),
            roundness: new NumberField(0, 0),
            hue: new RangeField(0, 0, 360),
            saturation: new RangeField(100, 0, 100),
            brightness: new RangeField(50, 0, 100),
            alpha: new RangeField(100, 0, 100),
            rotation: new NumberField(0, -Infinity),
            stroke: new NumberField(0, 0),
        },
    },


    multiline: {
        name: "multiline",
        draw: function(p5){
           
            var props = this.props;

            if(!props.points.value.length && !props.points.live.length){
                //no point data. No point (HA!) in continuing.
                return;
            }


            p5.strokeWeight(props.stroke.value + props.stroke.live);
            p5.stroke(toArgs(props, "color"));
            p5.strokeJoin(Math.round(props.joints.value));
            p5.strokeCap(Math.round(props.caps.value ));
            p5.curveTightness(props.tightness.value + props.tightness.live);

            //console.log(xywh)
            //p5.scale(xywh[2]+1, xywh[3]+1);
            //rotate


            /*
            Array possibilities:
            Defined point list CONNECTED TO number: all entries multiplied/affected by number
            ONE point in point list connected to number
            empty connected to array: display array
            point list connected to array: additive where lists overlap


            */
            var points = props.points.live; //props.points.real
            var curved = toPosInt(props.curved.value + props.curved.live) % 2;
            var isCoords = typeof(points[0][1]) != "undefined";
            var width = p5.width;
            var height = p5.height;
            var pointLength = points.length - 1;
            var spacing = sizeMap(props.spacing.value + props.spacing.live, width);
            var shape = toPosInt(props.shape.value + props.shape.live) % 8;
            var maximumVal = props.maximum.value;
            var minimumVal = props.minimum.value;
            var multiplier = props.multiplier.value + props.multiplier.live;
            var zeroPadded = props.zeroPadded.value + props.zeroPadded.live;
            var isClosed = toPosInt(props.closed.value + props.closed.live) % 3;
            var curve = props.curve.value + props.curve.live;
            var x_off = props.x.value + props.x.live;
            var y_off = props.y.value + props.y.live;

            if(isClosed){
                p5.noFill();
            }
            else{
                p5.fill.apply(p5, toArgs(props, "color"));
            }

            p5.beginShape(shape);

            if(zeroPadded){
                p5.vertex(posMap(-100+x_off, width), posMap(0+y_off, height));
            }


            for(var i = 0; i < pointLength; i++){
                var x;
                var y;

                if(!isCoords){
                    x = i * spacing/10 + curve*i + x_off;
                    x = remap(x, 0, pointLength, 0, width);

                    y = points[i]*multiplier + curve*i + y_off;
                    y = remap(y, minimumVal, maximumVal, 0, height);
                } else {
                    x = points[i][0];
                    y = points[i][1];
                }

                

                if(curved >= 1){
                    p5.curveVertex(x, y);
                }
                else {
                    p5.vertex(x, y);
                }
            }

            if(zeroPadded){
                p5.vertex(posMap(100+x_off, width), posMap(0+y_off, height));
            }

            p5.endShape(isClosed);
            
        },

        props: {
            
            points: new ArrayField(),
            
            shape: new RangeField(0, 0, 8, null, 1),
            curved: new BooleanField(false),
            closed: new BooleanField(false, null),
            tightness: new NumberField(0),
            curve: new NumberField(0),
            spacing: new NumberField(1, 0.0001, null, 0.1),
            x: new RangeField(0, -1000, 1000),
            y: new RangeField(0, -1000, 1000),
            height: new RangeField(0, 0, 200),
            width: new RangeField(0, 0, 200),
            size: new RangeField(0, 0, 200),


            rotation: new NumberField(0),

            hue: new RangeField(0, 0, 360),
            saturation: new RangeField(100, 0, 100),
            brightness: new RangeField(0, 0, 100),
            alpha: new RangeField(100, 0, 100),
            stroke: new NumberField(5, 0),
            joints: new RangeField(0, 0, 3, null, 1),
            caps: new RangeField(0, 0, 3, null, 1),

            maximum: new NumberField(1),
            minimum: new NumberField(-1),
            multiplier: new NumberField(1),
            zeroPadded: new BooleanField(false),


        },
    },

    background: {
        name: "background",
        draw: function(p5){
            var p = this.props;
            p5.background(toArgs(p, "color"));
        },
        props: new ColorField
    },

    blending: {
        name: "blending",
        draw: function(p5){
            p5.blendMode(p5[this.props.mode.value]);
        },
        props: {
            mode: new SelectField("BLEND", [
                "BLEND", "ADD", "DARKEST", "LIGHTEST", "DIFFERENCE", "EXCLUSION", "MULTIPLY", "SCREEN", "REPLACE", "OVERLAY", "HARD_LIGHT", "SOFT_LIGHT", "DODGE","BURN",
            ]),
        }
    },

    clear: {
        name: "clear",
        draw: function(p5){
            this.live.every -= 1;
            if(this.live.every <= 0){
                this.live.every = this.props.every.value;
                p5.clear();
            }
        },
        live: {
            every: 0,
        },
        props: {
            every: {value: 0}
        }
    }
};