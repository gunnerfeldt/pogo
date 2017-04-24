/*

  Module - Server
  
*/


module.exports = Server;

function Server(){

  var self = this;
  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({ port: 9000 });
  var client;
  var callback = [];

  console.log("starting server..");

  wss.on('connection', function connection(conn) {
// **** **** **** SERVER CONNECTION **** **** ****
    console.log("websocket connected key: "+conn.upgradeReq.headers['sec-websocket-key']);
    client = conn;
    
// **** **** **** INCOMING MESSAGE **** **** ****
    conn.on("message", function (str) {
      if(isJsonString(str)){
        var wsObject = JSON.parse(str);
        callback[wsObject.cmd](wsObject);
      }
      else{
        console.log("not a JSON message");
      }
    })
// **** **** **** SERVER CONNECTION CLOSED **** **** ****
    conn.on("close", function (code, reason) {
      console.log(code);
      console.log(reason);
    })
 // **** **** **** SERVER CONNECTION ERROR **** **** ****   
    conn.on("error",function (err) {
      console.log("websocket error");
      console.log(err);
      conn.close();
    });
  })

  this.send = function(msg){
    if(client) client.send(JSON.stringify(msg));
  }
  // **** **** **** GET LOCAL IP ADDRESS **** **** **** 
  this.getIPAddress = function() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
          return alias.address;
      }
    }
    return '0.0.0.0';
  };

  this.on = function(ref, func){
      callback[ref] = func;
  }

}
// **** **** **** CHECK IF JSON FORMAT **** **** **** 
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}






