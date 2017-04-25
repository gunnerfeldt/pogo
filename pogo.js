/*
    This comment was written locally on Pelles MacBook 22:24
    // Macbook tues-wed night
*/
module.exports = Pogo;
var rl = require("readline");
var Midi = require("./midi.js");
var Server = require("./server.js");
// var config = require('./config.json');
var HID = require('node-hid');
var fs = require('fs');
var device;
var config;
var loop = 0;
var leds1 = 0;
var leds2 = 0;
var disp1 = 0;
var disp2 = 0;
var usbFinder;
var online = 0;

function Pogo() {



    console.log('Starting directory: ' + process.cwd());
    try {
        process.chdir('/Users/Pelle/Stompede');
        console.log('New directory: ' + process.cwd());
    } catch (err) {
        console.log('chdir: ' + err);
    }

    fs.readFile('./config.json', 'utf8', function(err, data) {
        if (err) {
            config = {
                "name": "stompede config",
                "version": "1.0",
                "currentProgram": 0,
                "program": [makeTemplate()]
            }
        } else {
            config = JSON.parse(data);
        }
        start();
    });

    function start() {
        usbFinder = setInterval(function() {
            connectHW();
        }, 1000);

        setTimeout(function() {
            leds2 = setLeds2(config.program[config.currentProgram]);
            updateHW();
        }, 1000)
    }

    function connectHW() {
        if (online == 1) return;
        var devices = HID.devices()
        var PATH = '';
        for (n = 0; n < devices.length; n++) {
            var val = devices[n];
            if (val['product'] == 'Automan ST08') {
                PATH = val['path'];
                console.log("Found HW");
                online = 1;
                device = new HID.HID(PATH);
                var dataCmp = 0;

                device.on('error', function(data) {
                    // what happened?
                    console.log(data);
                    online = 0;
                });

                device.on('data', function(data) {
                    /*
                          console.log("from stompede remote:")
                          console.log("CMD: "   +data[0]);
                          console.log("data: "  +data[1]);
                    */
                    var prg = config.program[config.currentProgram];
                    // if switch is loop control - turn on led, unlit other loop leds
                    if (data[0] == 0xf0) { // switches stomp
                        var maskChanges = data[1] ^ dataCmp; // make a mask of changed bits
                        var maskOnBits = data[1] & maskChanges;
                        var maskOffBits = ~data[1] & maskChanges;
                        dataCmp = data[1];
                        for (var n = 0; n < 8; n++) {
                            if ((maskOnBits >> n) & 1) { // on bit found
                                // if loops activated > set loops
                                if (prg.switch[n].loopActive) {
                                    loop = makeByte(prg.switch[n].loop);
                                    leds1 = setLoopLeds(n, leds1);
                                    updateHW();
                                    //  console.log("loop leds: "+leds1);
                                }
                                if (prg.switch[n].type == "Sequence") {
                                    midi.send(0x90, prg.switch[n].sequence[prg.switch[n].value], 127);
                                }
                                if (prg.switch[n].type == "Note") {
                                    midi.send(0x90, prg.switch[n].sequence[0], 127);
                                }
                                if (prg.switch[n].type == "Control Change") {
                                    midi.send(0xB0, prg.switch[n].value, 1);
                                }
                                if (prg.switch[n].type == "Program Change") {
                                    var saved = parseInt(config.currentProgram);
                                    config.currentProgram = parseInt(config.currentProgram) + parseInt(prg.switch[n].value);
                                    if (!config.program[config.currentProgram]) {
                                        config.currentProgram = saved;
                                    }
                                    midi.send(0xC0, config.currentProgram, 0);
                                    loop = makeByte(prg.switch[prg.initLoop].loop);
                                    leds1 = setLoopLeds(prg.initLoop, 0);
                                    updateProgram(config.program[config.currentProgram]);
                                }
                            } else if ((maskOffBits >> n) & 1) { // off bit found
                                if (prg.switch[n].type == "Sequence") {
                                    if (!prg.switch[n].single) {
                                        midi.send(0x80, prg.switch[n].sequence[prg.switch[n].value], 127);
                                    }
                                    prg.switch[n].value++;
                                    if (prg.switch[n].value > (prg.switch[n].sequence.length - 1)) {
                                        prg.switch[n].value = 0;
                                    }
                                    console.log("Sequence " + prg.switch[n].value);
                                    disp1 = prg.switch[n].value + 1;
                                    updateHW();
                                }
                                if (prg.switch[n].type == "Note") {
                                    if (!prg.switch[n].single) {
                                        midi.send(0x80, prg.switch[n].sequence[0], 127);
                                    }
                                }
                                if (prg.switch[n].type == "Control Change") {
                                    //  midi.send(0xB0,config.remote.switch[n].value,0);
                                }
                                if (prg.switch[n].type == "Program Change") {
                                    //  config.program += config.remote.switch[n].value;
                                    //  midi.send(0xC0,config.program,0);
                                }
                            }
                        }
                    }
                });
            }
            if (PATH == '') {
                // console.log('No hardware...')
                //  process.exit();
                online = 0;
            }
        };
    }



    function updateProgram(prg) {
        loop = makeByte(prg.switch[prg.initLoop].loop);
        leds1 = setLoopLeds(prg.initLoop, 0);
        console.log("Program Change >>>> " + prg.name);
        console.log("init loop switch no: " + prg.initLoop);
        leds2 = setLeds2(prg);
        console.log("loop byte: " + loop);
        console.log("leds1 byte: " + leds1);
        console.log("leds2 byte: " + leds2);

        disp1 = 0;
        disp2 = config.currentProgram + 1;
        console.log("Program " + config.currentProgram);

        for (var i = 0; i < 8; i++) {
            if (prg.switch[i].type == "Sequence") {
                prg.switch[i].value = 0;
                disp1 = 1;
            }
        }
        updateHW();
    }


    // print process.argv
    process.argv.forEach(function(val, index, array) {
        if (val.substring(0, 3) == "sim") sim = 1;
    });

    var midi = new Midi();
    var server = new Server();


    server.on("request", function(obj) {
        var wsObject = {
            "cmd": "config",
            "msg": config
        }
        console.log("send config");
        server.send(wsObject);
    })

    server.on("config", function(obj) {
        var prg = config.program[config.currentProgram];
        console.log("**************************")
        console.log("config from browser")
        console.log(obj.msg.name);

        fs.writeFile("./config.json", JSON.stringify(obj.msg, null, 4), function(err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            config = obj.msg;
            //   console.log(config);

            //   loop = makeByte(prg.switch[prg.initLoop].loop);
            //   leds1 = setLoopLeds(prg.initLoop, 0);
            //   updateProgram(config.program[config.currentProgram]);
            updateHW();
        });
    })

    server.on("noteon", function(obj) {
        console.log("WS MIDI >> **************************")
            /*
            var byte1 = 128 + 16;
            var byte2 = obj.id;
            var byte3 = 127;
            */

        var byte1 = 0xB0;
        var byte2 = (16 + parseInt(obj.id));
        var byte3 = 1;
        /*
          console.log(byte1);
          console.log(byte2);
          console.log(byte3);
          */
        midi.send(byte1, byte2, byte3);
    })
    server.on("noteoff", function(obj) {
        console.log("**************************")
        var byte1 = 0xB0;
        var byte2 = 16 + ((obj.id));
        var byte3 = 0;
        /*
        console.log(byte1);
        console.log(byte2);
        console.log(byte3);
        */
        //  midi.send(byte1,byte2,byte3);
    })
    server.on("midi", function(obj) {
        console.log("**************************")
        var byte1 = obj.msg[0];
        var byte2 = obj.msg[1];
        var byte3 = obj.msg[2];
        console.log("from browser remote:")
        console.log(obj.msg);
        /*
        console.log(byte1);
        console.log(byte2);
        console.log(byte3);
        */
        midi.send(byte1, byte2, byte3);
    })

    midi.on("message", function(msg) {
        //  console.log("MainStage MIDI >> **************************")
        var wsObject = {
                "cmd": "midiMessage",
                "msg": msg
            }
            //  console.log(msg);
            //   console.log("Mainstage msg1 >>>>> "+msg[1]);
        if ((msg[0] & 0xF0) == 0xC0) {
            console.log("Mainstage Program Change >>>>> " + msg[1]);
            config.currentProgram = msg[1];
            var prg = config.program[config.currentProgram];

            // make loop byte from initial loop array
            //    loop = makeByte(prg.switch[prg.initLoop].loop);
            // make guide leds byte
            //    leds2 = setLeds2(prg);
            // update hardware

            if (prg) {
                updateProgram(prg);
                //  updateHW();
            } else { console.log("0=" + msg[0] + ", 1=" + msg[1]) }
        }
        if ((msg[0] & 0xF0) == 0xB0) {
            console.log("Mainstage Control Change >>>>> cc number: " + msg[1] + ", value: " + msg[2]);
            var prg = config.program[config.currentProgram];
            // CC is feedback from Mainstage for lighting up leds 
            // can also handle Loops (rare)
            // loop leds should override cc leds
            // <<>><<>>
            // if the value (msg[1]) matches any cc values in the chosen Patch
            // set led 1 or 0 according to (msg[2])

            if (prg) {
                for (var i = 0; i < 8; i++) {
                    if (!prg.switch[i].loopActive) {
                        if (config.program[config.currentProgram].switch[i].type == "Control Change") {
                            if (config.program[config.currentProgram].switch[i].value == msg[1]) {
                                if (msg[2] != 0) leds1 = leds1 | (128 >> i);
                                else leds1 = leds1 & (~(128 >> i));
                            }
                        }
                    }
                }
                //    updateProgram(prg);    
                updateHW();
            }
        }
        server.send(wsObject);
    });


    /*

    Control Change = 0xBn (n=channel)


     Byte 1
     Note On   Midi channel
     1 0 0 1   X X X X 

     Byte 2
     Key - Note Value
     0 X X X   X X X X

     Byte 3
     Velocity
     0 X X X   X X X X


     Byte 1
     Note Off   Midi channel
     1 0 0 0   X X X X 

     Byte 2
     Key - Note Value
     0 X X X   X X X X

     Byte 3
     Velocity
     0 X X X   X X X X


    */

    var toggle = 0;
    var timer = setInterval(function() {
            if (toggle) {
                //    console.log("midi on");
                //    midi.send(0x90,0x45,0x65);
            } else {
                //   console.log("midi off");
            }
            toggle = !toggle;

        }, 1000)
        // TEST
        /*
        [2] = relays 8 bits
        [3] = to remote 
        [5] = to remote 
        [6] = to remote 
        [7] = to remote 
        [8] = to remote 
        */
        /*
        var loop = setInterval(function(){
          if(i==0x00) i=0x01;
          else i=0x00;
          device.write([0,0,i,1,2,3,4,5]);
        },1000)
        */

    function setLoopLeds(indx, leds) {
        for (var i = 0; i < 8; i++) {
            if (config.program[config.currentProgram].switch[i].loopActive) {
                // set bit
                if (i == indx) {
                    leds = leds | (128 >> i);
                }
                // unset other bits
                else leds = leds & (~(128 >> i));
            }
        }
        return leds
    }

    function setCcLeds(i, on, leds) {
        if (on) {
            leds = leds | (128 >> i);
        } else leds = leds & (~(128 >> i));
        return leds
    }

    function setLeds2(prg) {
        var leds = 0;
        for (var i = 0; i < 8; i++) {
            if (prg.switch[i].loopActive || prg.switch[i].type != "None") leds = leds | (128 >> i);
            else leds = leds & (~(128 >> i));
        }
        return leds
    }

    function setDisp2(prg) {
        if (prg.disp2) {
            var prg = config.program[config.currentProgram];
            disp2 = prg.switch[prg.disp2.sw].value + 1;
        } else disp2 = 0;
    }

    function updateHW() {

        if (online) {
            device.write([
                0,
                0xff,
                loop,
                0,
                leds1,
                leds2,
                digit1(disp1),
                digit2(disp1),
                digit1(disp2),
                digit2(disp2),
                0
            ]);
        }
    }

    function makeByte(arr) {
        var byte = 0;
        var bit = 1;
        bit = 1;
        for (var i = 0; i < 8; i++) {
            byte = byte + (arr[i] * bit);
            bit = bit << 1;
        }
        return byte;
    }

    function makeTemplate() {
        return {
            "name": "New Patch",
            "loop": [0, 0, 0, 0, 0, 0, 0, 0],
            "switch": [{
                "id": 0,
                "name": "Label 1",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 2",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 3",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 4",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 5",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 6",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 7",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, {
                "id": 0,
                "name": "Label 8",
                "type": "None",
                "value": 0,
                "single": 0,
                "sequence": [],
                "loop": [0, 0, 0, 0, 0, 0, 0, 0],
                "loopActive": 0
            }, ]
        }
    }

    function digit1(num) {
        var lo = num % 10;
        var hi = Math.floor(num / 10);
        var byte = 0;

        if (hi == 0) {
            byte = 0;
        } else {
            byte = dig[hi];
        }
        return byte & 0xff;
    }

    function digit2(num) {
        var lo = num % 10;
        var hi = Math.floor(num / 10);
        var byte = 0;

        if (hi == 0 && lo == 0) {
            byte = 0;
        } else {
            byte = dig[lo];
        }
        return byte & 0xff;
    }

    var dig = [
        0xfc,
        64 + 32,
        128 + 64 + 16 + 8 + 2,
        128 + 64 + 32 + 16 + 2,
        64 + 32 + 4 + 2,
        128 + 32 + 16 + 4 + 2,
        128 + 32 + 16 + 8 + 4 + 2,
        128 + 64 + 32,
        0xfe,
        128 + 64 + 32 + 16 + 4 + 2
    ];
}