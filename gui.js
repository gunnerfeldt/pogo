
var ledStateClass = [
    "led unlit",
    "led lit"
]

var ledState = [0,0,0,0,0,0];
var websocket;
var buttonState = 0;
var PC = 0;
var noteon=0;
var key = 0x3C;
var keyWalk = 0;
var keySpan = 4;
var disp1DropDown = document.createElement('select');
var disp2DropDown = document.createElement('select');
var timer;


function startApp(){
//    createStomps(8);
//    createConfig(8);
//    websocketStart("localhost");
    timer = setInterval(function(){
        // check if websocket is active
        if(websocket){
            
        }
        // if not try to connect
        else{
            console.log("offline");
            document.getElementById("config").innerHTML = "";
            websocketStart("localhost");
        }
    },1000)
}

function loadGUI(){
//    createStomps(8);
    createConfig(8);    
}

function createStomps(num){
    for(var i=0;i<num;i++){
        document.getElementById("pedalboard").appendChild(createStomp(i))
    }

    document.addEventListener('mouseup', function() {
        if(noteon){
            noteon = 0;
            websocket.send(JSON.stringify({
                "cmd"       : "midi",
                "msg"       : [0x80,(key + keyWalk),127]
            }))
            keyWalk++;
            if(keyWalk == keySpan) keyWalk = 0;
        }
        var cnt = 1;
        while(buttonState > 0){
            if(buttonState & 1){
                console.log("Release button "+cnt);
                /*
                websocket.send(JSON.stringify({
                    "cmd"       : "noteoff",
                    "id"        : cnt
                }))      
                */
            }
            cnt++;
            buttonState = buttonState >> 1;
        }
    }, false);
}

function createStomp(id){

    var newStomp = document.createElement('div');
    var newLed = document.createElement('div');
    var newButton = document.createElement('div');

    newStomp.className = ("stomp");

    newLed.className = ("led unlit");
    newLed.id = "led"+(id+1);

    newButton.id = id+1;
    newButton.className = ("button up");
    
    newButton.addEventListener('mousedown', function() {
        buttonClick(this);
    }, false);

    newStomp.appendChild(newLed);
    newStomp.appendChild(newButton);

    return newStomp;
}

function buttonClick(element){
    element.className = "button down";
    buttonState = (1 << (element.id-1));

    /*
    websocket.send(JSON.stringify({
        "cmd"       : "noteon",
        "id"        : element.id
    }))
    */

    if(element.id<6){
        websocket.send(JSON.stringify({
            "cmd"       : "midi",
            "msg"       : [0xB0,(16 + (element.id-0)),1]
        }))
    }
    else{
        if(element.id == 6){
            PC--;
            if(PC<0) PC=0;
            websocket.send(JSON.stringify({
                "cmd"       : "midi",
                "msg"       : [0xC0,PC,0]
            }))
        }
        if(element.id == 7){
            PC++;
            if(PC>127) PC=127;
            websocket.send(JSON.stringify({
                "cmd"       : "midi",
                "msg"       : [0xC0,PC,0]
            }))
        }
        if(element.id == 8){
            websocket.send(JSON.stringify({
                "cmd"       : "midi",
                "msg"       : [0x90,(key + keyWalk),127]
            }))
            noteon=1;
        }
    }



    setTimeout(function() {
        element.className ="button up";
    },300);
    console.log(element.id);
}

function setLed(id, state){
    document.getElementById("led"+id).className = ledStateClass[state];
}

function websocketStart(ip){

    console.log("...at: "+ip);
    websocket = new WebSocket("ws://"+ip+":9000","connect");
    
    websocket.onopen = function() {
        console.log('Server Found!');
        loadGUI();
        websocket.send(JSON.stringify({
            "cmd"           : "request",
            "msg"           : null
        }))
    };
    
    websocket.onmessage = function(event) {
    //    websocket.send('ACKNOWLEDGE BYTES');
        var wsObject = JSON.parse(event.data);
        if(wsObject.cmd == "midiMessage"){
            var id = ((wsObject.msg[1]) - 16);
            var state = ((wsObject.msg[2] & 64) >> 6);
            console.log("id " + id);
            console.log("state " + state);
            setLed(id, state);
        }
        if(wsObject.cmd == "config"){
            config = wsObject.msg;
            console.log("Config Loaded!");
            document.getElementById("titleSpan").value = config.program[config.currentProgram].name;
            document.getElementById("pc").value = config.currentProgram;
            loadConfigurator(8);
        }
    };

    websocket.onclose = function() {
        console.log('Websocket closed.');
        var reason;
        // See http://tools.ietf.org/html/rfc6455#section-7.4.1
        if (event.code === 1000)
            reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
        else if(event.code === 1001)
            reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
        else if(event.code === 1002)
            reason = "An endpoint is terminating the connection due to a protocol error";
        else if(event.code === 1003)
            reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
        else if(event.code === 1004)
            reason = "Reserved. The specific meaning might be defined in the future.";
        else if(event.code === 1005)
            reason = "No status code was actually present.";
        else if(event.code === 1006)
            reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
        else if(event.code === 1007)
            reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
        else if(event.code === 1008)
            reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
        else if(event.code === 1009)
            reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
        else if(event.code === 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
            reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
        else if(event.code === 1011)
            reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
        else if(event.code === 1015)
            reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
        else
            reason = "Unknown reason";
        
        websocket = null;
        console.log(reason);
    };
    websocket.onerror = function(e) {
        console.log('Websocket error');
    };
};

function createConfig(num){
    var titleSpan = document.createElement('input');
    var newSpan = document.createElement('span');
    var newDropDown = document.createElement('select');
    var newButton = document.createElement('button');

    if(!config.program[config.currentProgram]){
        // create template !!
        config.program[config.currentProgram] = makeTemplate();
    }

    titleSpan.id = "titleSpan";
    titleSpan.value = config.program[config.currentProgram].name;

    titleSpan.addEventListener('change', function(e) {
        config.program[config.currentProgram].name = e.target.value;
    }, false);

    newDropDown.id = "pc";
    for(var i=0;i<127;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = (i+1);
        newDropDown.appendChild(option);
    }   
    newDropDown.value = config.currentProgram;
    newDropDown.addEventListener('change', function(e) {
        config.currentProgram = e.target.value;
        if(!config.program[config.currentProgram]){
            // create template !!
            config.program[config.currentProgram] = makeTemplate();
            console.log("Load Template");
        }
        document.getElementById("titleSpan").value = config.program[config.currentProgram].name;
        loadConfigurator(8);
    }, false);

    for(var i = 0;i < disp1options.length;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = disp1options[i];
        disp1DropDown.appendChild(option);
    }
    for(var i = 0;i < disp2options.length;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = disp2options[i];
        disp2DropDown.appendChild(option);
    }

    newSpan.appendChild(newDropDown);
    newSpan.appendChild(disp1DropDown);
    newSpan.appendChild(disp2DropDown);
    newButton.id = "save";
    newButton.textContent = "Save";


    newButton.addEventListener('click', function(e) {   
        if(disp2DropDown.value){
            config.program[config.currentProgram].disp2 = {"type": "seq", "sw":disp2DropDown.value};
        }
        
        websocket.send(JSON.stringify({
            "cmd"           : "config",
            "msg"           : config
        }))
    }, false)


    document.getElementById("config").appendChild(titleSpan);
    document.getElementById("config").appendChild(newSpan);
    document.getElementById("config").appendChild(newButton);
    var newConfigDiv = document.createElement('div');
    newConfigDiv.id = "configurator";
    document.getElementById("config").appendChild(newConfigDiv);
    loadConfigurator(8);
}

function loadConfigurator(num){
    document.getElementById("configurator").innerHTML = "";
    for(var i=0;i<num;i++){
        document.getElementById("configurator").appendChild(createSwitchConfig(i));
    }
    console.log(config);
}

function createSwitchConfig(id){

    var newConfig = document.createElement('div');
    var newLabelNo = document.createElement('div');
    var newLabel = document.createElement('input');
    var newSpan = document.createElement('span');
    var newMidiDropDown = document.createElement('select');

    newConfig.className = ("configLine");
    newConfig.id = "configLine"+(id);

    newLabelNo.className = "configLabelNo";
    newLabelNo.textContent = ""+(id+1);

    newLabel.className = "configLabel";
    newLabel.value = config.program[config.currentProgram].switch[id].name;
    newLabel.addEventListener('change', function(e) {
        config.program[config.currentProgram].switch[id].name = e.target.value;
    }, false);

    newMidiDropDown.className = ("dropDown");
    newMidiDropDown.id = "midi"+(id);

    var names = ["None","Note","Sequence","Control Change","Program Change"];
    var optionId = 0;
    for(var i=0;i<5;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = names[i];
        if(config.program[config.currentProgram].switch[id].type == option.text) {
            option.selected = true;
            optionId = i;
        }
        newMidiDropDown.appendChild(option);
    }
    newMidiDropDown.addEventListener('change', function(e) {
        var swId = e.target.id.substring(4);
        var optionId = e.target.value;
        var midiDiv = document.getElementById("optDiv"+swId);
        loadMidiPanel(midiDiv,swId, optionId);
        config.program[config.currentProgram].switch[swId].type = names[optionId];
    }, false);

    newSpan.className = ("midi");

    var midiLabel = document.createElement('div');
    midiLabel.className = "littleLabel";
    midiLabel.textContent = "MIDI sends"
    
    newSpan.appendChild(midiLabel);
    newSpan.appendChild(newMidiDropDown);

    var optDiv = document.createElement('div');
    optDiv.id = "optDiv"+id;
    newSpan.appendChild(optDiv);

    newConfig.appendChild(newLabelNo);
    newConfig.appendChild(newLabel);
    newConfig.appendChild(createLoopBoxes(id, config.program[config.currentProgram].switch[id].loop));
    newConfig.appendChild(newSpan);
    loadMidiPanel(optDiv, id, optionId);
//    newConfig.appendChild(createNotes(id, 120, 12));

    return newConfig;
}

function loadMidiPanel(midiDiv, swId, optionId){
    while (midiDiv.firstChild) {
        midiDiv.removeChild(midiDiv.firstChild);
    }
    disp2options[swId] = "";
    disp2DropDown.innerHTML = "";
    switch(parseInt(optionId)){
        case 0:
        break;
        case 1:
            midiDiv.appendChild(createNotes(swId,config.program[config.currentProgram].switch[swId].sequence[0]));
        break;
        case 2:
            midiDiv.appendChild(createSequence(swId,0));
            midiDiv.appendChild(createNotes(swId,config.program[config.currentProgram].switch[swId].sequence[0]));
            disp2options[swId] = document.createElement('option');
            disp2options[swId].value = swId;
            disp2options[swId].text = "Sequence Sw:"+swId;
        break;
        case 3:
            midiDiv.appendChild(createCc(swId,config.program[config.currentProgram].switch[swId].value));
        break;
        case 4:
            midiDiv.appendChild(createPc(swId,config.program[config.currentProgram].switch[swId].value));
        break;
    }   
    for(var i = 0;i<8;i++){
        if(disp2options[i]){
            disp2DropDown.appendChild(disp2options[i]);
        }
    }
}

function createLoopBoxes(id, sel){
    var newSpan = document.createElement('span');
    var newLabel = document.createElement('div');
    newLabel.className = "littleLabel";
    newLabel.textContent = "Loops activated"
    if(config.program[config.currentProgram].initLoop == id) newSpan.className = "loops selectedLoop";
    else newSpan.className = "loops";
    newSpan.id = "init"+id;
    newSpan.appendChild(newLabel);
    newSpan.addEventListener('click', function(e) {
        console.log(e.target.id);
        var swId = e.target.id.substring(4);
        var loopBox = document.getElementById("loop"+swId);
        if(loopBox.checked){
            for(var i = 0;i<8;i++){
                document.getElementById("init"+i).className = "loops";
            }
            this.className = "loops selectedLoop";
            config.program[config.currentProgram].initLoop = parseInt(swId);
            console.log(config.program[config.currentProgram]);
        }
    }, false);


    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.className = "loopActive";
    checkbox.id = "loop"+id;
    checkbox.checked = (config.program[config.currentProgram].switch[id].loopActive == 1);
    newSpan.appendChild(checkbox);
    checkbox.addEventListener('change', function(e) {
        var swId = e.target.id.substring(4);
        var optionId = e.target.checked * 1;
        config.program[config.currentProgram].switch[swId].loopActive = optionId;
    }, false);

    for(var i=0;i<8;i++){
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = "name";
        checkbox.value = "value";
        checkbox.id = "box"+id+":"+i;
        checkbox.checked = (sel[i] == 1);
        newSpan.appendChild(checkbox);
        checkbox.addEventListener('change', function(e) {
            var swId = e.target.id.substring(3,4);
            var boxId = e.target.id.substring(5);
            var optionId = e.target.checked * 1;
            config.program[config.currentProgram].switch[swId].loop[boxId] = optionId;
            console.log("Sw "+optionId+", box "+boxId+" for sw "+swId);
        }, false);
    }
    return newSpan;
}

function createNotes(id, sel){
    var newSpan = document.createElement('span');
    var newDropDown = document.createElement('select');
    newDropDown.id = "note"+id;
    newSpan.className = ("");
    var option = document.createElement('option');
    option.value = -1;
    option.text = "-";
    if(sel == -1) option.selected = true;
    newDropDown.appendChild(option);
    for(var i=0;i<120;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = (note[i%12])+((Math.floor(i/12))-1);
        if(i == sel){
            option.selected = true;
        }
        newDropDown.appendChild(option);
    }   
    newDropDown.addEventListener('change', function(e) {
        var swId = e.target.id.substring(4);
        var optionId = e.target.value;
        // find out what sequence index. For single notes it's 0'
        var sequenceId = 0;
        if(config.program[config.currentProgram].switch[swId].type == "Sequence") {
            sequenceId = document.getElementById("seq"+swId).value;
        }
        
        // if no note is selected
        if(optionId == -1) {
            // delete index
            if(sequenceId > 1){
                config.program[config.currentProgram].switch[swId].sequence.splice(sequenceId,1);
            }
            // it cant be index 0. It must contains one note..
            else{
                document.getElementById("note"+swId).value = config.program[config.currentProgram].switch[swId].sequence[sequenceId];
            }
        }
        // replace or add note to sequence
        else {
            console.log("Change "+sequenceId+"rd note "+optionId+" for sw "+swId);
            config.program[config.currentProgram].switch[swId].sequence[sequenceId] = optionId;
        }
        
        console.log(config.program[config.currentProgram].switch[swId].sequence);
    }, false);
    newSpan.appendChild(newDropDown);
    return newSpan;
}

function createSequence(id, sel){
    var newSpan = document.createElement('span');
    var newDropDown = document.createElement('select');
    newDropDown.id = "seq"+id;
    newSpan.className = ("");
    for(var i=0;i<16;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = (i+1);
        if(i == sel){
            option.selected = true;
        }
        newDropDown.appendChild(option);
    }   
    newDropDown.addEventListener('change', function(e) {
        var swId = e.target.id.substring(3);
        var optionId = e.target.value;
        console.log("Change to seq "+optionId+" for sw "+swId)
        var noteList = document.getElementById("note"+swId);
        noteList.value = config.program[config.currentProgram].switch[swId].sequence[optionId];
    }, false);
    newSpan.appendChild(newDropDown);
    return newSpan;
}


function createCc(id, sel){
    var newSpan = document.createElement('span');
    var newDropDown = document.createElement('select');
    newDropDown.id = "cc"+id;
    newSpan.className = ("");
    for(var i=0;i<cc.length;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = cc[i];
        if(i == sel){
            option.selected = true;
        }
        newDropDown.appendChild(option);
    }   
    newDropDown.addEventListener('change', function(e) {
        var swId = e.target.id.substring(2);
        var optionId = e.target.value;
        
        config.program[config.currentProgram].switch[swId].value = optionId;
    //    console.log("Change "+sequenceId+"rd note "+optionId+" for sw "+swId);
        console.log(config.program[config.currentProgram].switch[swId]);

    }, false);
    newSpan.appendChild(newDropDown);
    return newSpan;
}
function createPc(id, sel){
    var newSpan = document.createElement('span');
    var newDropDown = document.createElement('select');
    newDropDown.id = "pc"+id;
    newSpan.className = ("");
    for(var i=0;i<pc.length;i++){
        var option = document.createElement('option');
        option.value = i;
        option.text = pc[i];
        if(pc[i] == sel){
            option.selected = true;
        }
        newDropDown.appendChild(option);
    }   
    newDropDown.addEventListener('change', function(e) {
        var swId = e.target.id.substring(2);
        var optionId = e.target.value;
        
        config.program[config.currentProgram].switch[swId].value = pc[optionId];

    }, false);
    newSpan.appendChild(newDropDown);
    return newSpan;
}

var cc = [
]
var pc = [
    -10,
    -1,
    1,
    10
]

for(i=0;i<128;i++){
    cc[i] = ""+i+"";
}

var config = {
    "name"      : "stompede config",
    "version"   : "1.0",
    "currentProgram"   : 0,
    "program"    : []
}

function makeTemplate (){
    return {
        "name"  : "New Patch",
        "switch"  :[
            {
                "id"    : 0,
                "name"    : "Label 1",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 2",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 3",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 4",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 5",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 6",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 7",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },{
                "id"    : 0,
                "name"    : "Label 8",
                "type"  : "None",
                "value"  : 0,
                "single": 0,
                "sequence"  : [],
                "loop"  : [0,0,0,0,0,0,0,0],
                "loopActive" : 0
            },
        ],
        "loop"  : [0,0,0,0,0,0,0,0]
    }
}

var note = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];
var disp1options = [
    "Program Number"
];
var disp2options = [null,null,null,null,null,null,null,null];