var pWidth = 77;
var pHeight = 112;
var pedalOff = "url(img/pedalOff.png)";
var pedalOn = "url(img/pedalOn.png)";
var colors = ["#000", "#5B3B00", "#9B6322", "#F8B200", "#FFC737", "#FF3E00", "#FFDC00", "#D8D8D8"];
var unitSwitches;

var Pedalboard = function(loops, callback) {
    var me = this;
    var num = loops.length;
    this.pedal = [];
    this.callback = callback;
    this.container = document.createElement('div');
    this.container.style.display = "flex";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "flex-end";
    this.container.style.position = "absolute";
    this.container.style.top = (pHeight - 46) + "px";
    this.container.style.height = (pHeight + 60) + "px";
    this.container.style.width = (((pWidth + 8) * num)) + "px";
    this.container.style.left = "200px";
    this.container.style.backgroundColor = colors[2];
    //    this.container.style.borderRadius = (pWidth * 0.1) + "px " + (pWidth * 0.1) + "px 0 0";
    this.container.style.borderRadius = (pWidth * 0.25) + "px";

    this.attachBubble = document.createElement('div');
    this.attachBubble.style.position = "absolute";
    this.attachBubble.style.right = "0px";
    this.attachBubble.style.top = "0px";
    this.attachBubble.style.backgroundColor = colors[3];
    this.attachBubble.style.margin = "4px";
    this.attachBubble.style.padding = "6px 14px 6px 14px";
    this.attachBubble.style.color = colors[2];
    this.attachBubble.style.borderRadius = (pWidth * 0.25) + "px";
    //   this.attachBubble.innerHTML = "Loop Control";
    this.attachBubble.style.cursor = "pointer";
    this.attachBubble.addEventListener('click', function(e) {
        //   switches.switch[switches.selectedSwitch].loops = !switches.switch[switches.selectedSwitch].loops;
        //   switches.switch[switches.selectedSwitch].select(true);
        callback('setLoopActive', {
            switch: switches.selectedSwitch,
            loopActive: !switches.switch[switches.selectedSwitch].loops,
            switches: switches
        })
    })
    this.container.appendChild(this.attachBubble);

    this.id = "pedalboard";
    for (var i = 0; i < num; i++) {
        this.pedal[i] = new Pedal(this, i, loops[i]);
        this.container.appendChild(this.pedal[i].container);
    }

    Pedal.prototype.set = function(val) {
        this.on = val;
        if (this.on) this.container.style.backgroundImage = pedalOn;
        else this.container.style.backgroundImage = pedalOff;
    }

    Pedal.prototype.turnOn = function() {
        this.on = true;
    }

    Pedal.prototype.turnOff = function() {
        this.on = false;
    }

    Pedal.prototype.toggle = function() {
        this.on = !this.on;
        if (this.on) this.container.style.backgroundImage = pedalOn;
        else this.container.style.backgroundImage = pedalOff;
    }

    Pedal.prototype.setText = function(text) {
        this.text = text;
        this.textField.innerHTML = "" + text + "";
    }

    this.container.addEventListener('mouseenter', function(e) {
        //    console.log("show");
    })
    this.container.addEventListener('mouseleave', function(e) {
        //    console.log("hide");
    })
}

Pedalboard.prototype.getHTML = function() {
    return this.container;
}

Pedalboard.prototype.attach = function(arg) {
    if (arg) {
        this.container.style.top = (pHeight - 36) + "px";
        this.attachBubble.innerHTML = "Disconnect Loops";
        for (var i = 0; i < 8; i++) {
            this.pedal[i].container.style.opacity = "1.0";
            this.pedal[i].container.style.cursor = "pointer";
        }
    } else {
        this.container.style.top = (pHeight - 66) + "px";
        this.attachBubble.innerHTML = "Connect Loops";
        for (var i = 0; i < 8; i++) {
            this.pedal[i].container.style.opacity = "0.2";
            this.pedal[i].container.style.cursor = "";
        }
    }
}

var Pedal = function(base, id, text) {
    var me = this;
    this.base = base;
    this.id = id;
    this.on = false;
    if (text == null) this.text = "box" + " " + (id + 1);
    else this.text = text;
    this.container = document.createElement('div');
    this.textField = document.createElement('div');
    this.textField.innerHTML = this.text;
    this.textField.style.margin = "8px";
    this.textField.style.color = "#9B6322";
    this.textField.style.top = "-22px";
    this.textField.style.position = "relative";
    this.textField.style.fontWeight = "500";
    this.textField.style.fontSize = "14px";


    this.container.style.display = "flex";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "center";
    // check loops
    this.container.style.backgroundImage = pedalOff;
    this.container.style.backgroundSize = (pWidth) + "px " + (pHeight) + "px";
    this.container.style.width = "" + (pWidth) + "px";
    this.container.style.height = "" + (pHeight) + "px";
    this.container.id = "box" + id;
    this.container.style.margin = "2px";
    this.container.style.marginBottom = "18px";
    //    this.container.style.cursor = "pointer";

    this.container.appendChild(this.textField);

    this.container.addEventListener('click', function() {
        if (switches.switch[switches.selectedSwitch].loops) {
            me.base.callback('toggleLoop', {
                loop: me.id
            });
        }
    })
    this.textField.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        alert("change");
    })
    this.textField.addEventListener('mousedown', function(e) { e.preventDefault(); }, false);
}

var Switches = function(unitSw, callback) {
    unitSwitches = unitSw;
    var num = unitSwitches.length;
    this.callback = callback;
    this.switch = [];
    this.selectedSwitch;
    this.container = document.createElement('div');
    this.container.style.display = "flex";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "center";
    this.container.style.position = "absolute";
    this.container.style.top = ((pHeight * 2) + 15) + "px";
    this.container.style.left = "200px";
    this.container.style.width = (((pWidth + 8) * num)) + "px";
    this.id = "switches";

    for (var i = 0; i < num; i++) {
        this.switch[i] = new Switch(this, i);
        this.switch[i].loops = unitSwitches[i].loopActive;
        this.switch[i].midi = (unitSwitches[i].type != "None");
        this.container.appendChild(this.switch[i].container);
    }
}

Switches.prototype.getHTML = function() {
    return this.container;
}

var Switch = function(base, id, text) {
    var me = this;
    this.id = id;
    this.base = base;
    this.selected;
    this.loops;
    this.midi = unitSwitches[id].type != "None";
    if (!text) var text = "switch" + " " + (id + 1);
    this.text = text;

    this.container = document.createElement('div');
    this.container.style.display = "flex";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "center";
    this.container.id = "switch" + id;
    this.container.style.margin = "0 2px 2px 2px";
    this.container.style.backgroundSize = (pWidth) + "px " + (pHeight) + "px";
    this.container.style.width = "" + (pWidth) + "px";
    this.container.style.height = "" + (pHeight * 1.4) + "px";
    this.container.style.cursor = "pointer";

    this.textField = document.createElement('div');
    this.textField.innerHTML = unitSwitches[id].name;
    this.textField.style.margin = "0 8px 0 8px";
    this.textField.style.color = colors[1];
    this.textField.style.fontWeight = "500";
    this.textField.style.fontSize = "14px";
    this.textField.style.top = "-43px";
    this.textField.style.position = "relative";

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = "absolute";
    this.canvas.style.top = (pHeight * 0.15) + "px";
    this.canvas.style.left = (((pWidth + 4) * id) + (pWidth * 0.25)) + "px";

    var ctx = this.canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = colors[7]
    ctx.arc(pWidth / 2, pHeight * 0.93, pWidth * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = colors[7];
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = colors[6]
    ctx.arc(pWidth / 2, pHeight * 0.67, pWidth * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = colors[6];
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = colors[5]
    ctx.arc(pWidth / 2, pHeight * 0.46, pWidth * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = colors[5];
    ctx.fill();
    ctx.stroke();

    this.container.appendChild(this.textField);
    this.container.appendChild(this.canvas);

    this.container.addEventListener('click', function() {
        me.select(true);
        me.base.callback('setLoops', {
            switch: me.id
        });
    })
}

Switch.prototype.select = function(val) {
    var upper = (pWidth * 0.5) + "px " + (pWidth * 0.5) + "px ";
    var lower = (pWidth * 0.5) + "px " + (pWidth * 0.5) + "px ";

    if (val) {
        this.base.selectedSwitch = this.id;
        for (id in this.base.switch) {
            if (this.base.switch[id] != this.id) this.base.switch[id].select(false);
        }
        this.select.true;
        this.container.style.backgroundColor = colors[2];

        if (this.loops) {
            upper = "0 0 ";
            pedalboard.attach(true);
        } else {
            pedalboard.attach(false);
        }

        if (this.midi) {
            lower = "0 0 ";
            midi.attach(true);
        } else {
            midi.attach(false);
        }

        this.container.style.borderRadius = (upper + lower);
    } else {
        this.select.false;
        this.container.style.backgroundColor = "transparent";
    }
}

Switch.prototype.setText = function(text) {
    this.text = text;
    this.textField.innerHTML = "" + text + "";
}

var Midi = function(callback) {
    this.callback = callback;
    this.container = document.createElement('div');
    this.container.style.display = "flex";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "flex-end";
    this.container.style.position = "absolute";
    this.container.style.top = (pHeight * 3.53) + "px";
    this.container.style.height = (pHeight * 2) + "px";
    this.container.style.width = (((pWidth + 8) * unitSwitches.length)) + "px";
    this.container.style.left = "200px";
    this.container.style.backgroundColor = colors[2];
    this.container.style.borderRadius = (pWidth * 0.25) + "px";

    this.attachBubble = document.createElement('div');
    this.attachBubble.style.position = "absolute";
    this.attachBubble.style.right = "0px";
    this.attachBubble.style.top = "0px";
    this.attachBubble.style.backgroundColor = colors[3];
    this.attachBubble.style.margin = "4px";
    this.attachBubble.style.padding = "6px 14px 6px 14px";
    this.attachBubble.style.color = colors[2];
    this.attachBubble.style.borderRadius = (pWidth * 0.25) + "px";
    this.attachBubble.style.cursor = "pointer";
    this.attachBubble.addEventListener('click', function(e) {
        callback('setMidiActive', {
            switchID: switches.selectedSwitch,
            unitSwitch: unitSwitches[switches.selectedSwitch],
            switch: switches.switch[switches.selectedSwitch]
        })
    })
    this.container.appendChild(this.attachBubble);
    keyboard(6, this.container);
}

Midi.prototype.getHTML = function() {
    return this.container;
}

Midi.prototype.attach = function(arg) {
    if (arg) {
        this.container.style.top = (pHeight * 3.53) + "px";
        this.attachBubble.innerHTML = "Disconnect MIDI";
    } else {
        this.container.style.top = (pHeight * 3.7) + "px";
        this.attachBubble.innerHTML = "Connect MIDI";
    }
}

var scale = 1;

function keyboard(octs, parent) {
    var container = document.createElement('div');
    this.container = container;
    var canvas = document.createElement('canvas');
    canvas.width = ((octs * (96 + 2))) - 2;
    canvas.height = (pWidth * 2);
    canvas.style.position = "relative";
    canvas.style.bottom = "-50px";

    var octave = new Image(96, 80);
    octave.src = "img/octave.png";
    octave.onload = function() {
        var ctx = canvas.getContext("2d");
        ctx.scale(1, 1);
        for (var i = 0; i < octs; i++) {
            ctx.drawImage(octave, (i * (96 + 2)), 0, 96, 80);
        }
        container.appendChild(canvas);
        parent.appendChild(container);
    }
}