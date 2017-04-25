const electron = require('electron');
const { app, BrowserWindow } = electron;
const Menu = electron.Menu;
var rl = require("readline");
var appWin;
var fs = require('fs');

var Pogo = require("./pogo.js");
var pogo;



require('crashreporter').configure({
    exitOnCrash: true, // if you want that crash reporter exit(1) for you, default to true, 
    maxCrashFile: 5, // older files will be removed up, default 5 files are kept,
    outDir: process.env.HOME + "/aeFiles"
});

process.on('exit', function() {});


app.on('ready', function() {
    pogo = new Pogo();
    appWin = new BrowserWindow({});
    appWin.loadURL('file://' + __dirname + '/index.html');
})



var menuTemplate = [{
    label: 'Main App',
    submenu: [{
        label: 'About ...',
        role: 'about',
        click: () => {
            console.log('About Clicked');
        }
    }, {
        type: 'separator'
    }, {
        label: 'Quit',
        role: 'quit',
        click: () => {
            app.quit();
        }
    }]
}, {
    label: 'Options',
    submenu: [{
        label: 'HUI',
        click: () => {}
    }]
}, {
    label: 'View',
    submenu: [{
        label: 'Settings',
        click: () => {
            //    toggleWindow(appWin);
        }
    }]
}];