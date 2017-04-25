var util = require("util")
var events = require("events")
var midiModule = require('midi');

module.exports = Midi;
// Makes an EventEmitter
util.inherits(Midi, events.EventEmitter)

function Midi(inCnt, outCnt){
  var self = this;
  var input = [];
  var output = [];
  var callback = [];
  
  for(var n=0;n<1;n++){
    input[n]  = new midiModule.input();
    output[n] = new midiModule.output();
    input[n].openVirtualPort("AE MIDI"+(n+1));
    console.log("Opening midi input port "+n)
    output[n].openVirtualPort("AE MIDI"+(n+1));
    console.log("Opening midi output port "+n)
  }
      // Configure callbacks.
    input[0].on('message', function(deltaTime, message) {
    //  newDAWdata(0,message);
    //  console.log(message);
      callback["message"](message);
    });

  function newDAWdata(MIDIport, message) {
    var sysEx = message[0];
    var region = message[1] & 0x0F;
    var byteNo = (message[1] & 0x20)>>5;
    var chn = (message[1] & 0x07);
  }
  
  this.send = function(a,b,c){
    output[0].sendMessage([a,b,c]);
  }

  this.on = function(ref, func){
      callback[ref] = func;
  }

}