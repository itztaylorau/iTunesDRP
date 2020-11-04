// Modules to control application life and create native browser window
const {app, BrowserWindow, screen} = require('electron');
const config = require('./data/config.json');
const bridge = require('./src/js/listener.js');
const iTunes = require('itunes-bridge');
const { exec } = require('child_process');
const path = require('path');
const Tray = require('electron').Tray;
const iconPath = path.join(__dirname, 'src/img/logo.png');
const Menu = require('electron').Menu;
const utf8 = require('utf8');
let tray = null;
var iTunesEmitter = iTunes.emitter;
var client = require('discord-rich-presence')(config.client_id.apple_music_id);
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 420,
    transparent: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  console.log("[IDRP] The application window loaded successfully.");
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  console.log("[IDRP] Checking if iTunes was opened or not...");
  checkiTunesRunning()
  trayStuff()
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)
console.log("[IDRP] The application window created successfully.");
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('minimize',function(event){
    event.preventDefault();
    mainWindow.hide();
});

function checkiTunesRunning() {

  if(iTunes.isRunning) {
    startup();
    console.log("[IDRP] iTunes is running.");
  }else {
    window.open("./src/app/notRunning.html");
    console.log("[IDRP] iTunes is not running.");
  }
  }

function startup() {
var currentTrack = iTunes.getCurrentTrack();
switch(currentTrack.playerState){
    case "playing": {
        updatePresence();
        console.log("[IDRP] iTunes is currently playing a song.");
        console.log("Song information:");
        console.log("Track name: " + currentTrack.name);
        console.log("Track artist: " + currentTrack.artist);
        console.log("Track album: " + currentTrack.album);
        console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
        break;
    }
    case "paused": {
        updatePresence();
        console.log("[IDRP] iTunes is currently paused.");
        console.log("Song information:");
        console.log("Track name: " + currentTrack.name);
        console.log("Track artist: " + currentTrack.artist);
        console.log("Track album: " + currentTrack.album);
        console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
        break;
    }
    case "stopped": {
        console.log("[IDRP] iTunes is not playing at the moment.");
        break;
    }

}
}


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//function initize () {
//  updatePresence();
//}
 
function updatePresence() {
  var currentTrack = iTunes.getCurrentTrack();
  var remaining = Date.now() + (currentTrack.remainingTime * (3000 / 3));
  var track = utf8.decode(currentTrack.name);
  client.updatePresence({
  state: currentTrack.artist + '-' + currentTrack.album,
  details: track,
  startTimestamp: Date.now(),
  endTimestamp: remaining,
  largeImageKey: 'apple-music-logo',
  smallImageKey: 'play-icon',
  instance: true,
}
);}

function updatePresencePause() {
  var currentTrack = iTunes.getCurrentTrack();
  var remaining = Date.now() + (currentTrack.remainingTime * (3000 / 3));
  client.updatePresence({ 
  state: currentTrack.artist + '-' + currentTrack.album,
  details: currentTrack.name,
  largeImageKey: 'apple-music-logo',
  smallImageKey: 'pause-icon',
  instance: true,
}
);}

// Do something when iTunes is playing
iTunesEmitter.on('playing', function(type, currentTrack){
    // If it is a paused track that restarts playing
    if(type === "player_state_change") {
      console.log("[IDRP] " + currentTrack.name + " has been resumed.");
      console.log("Song information:");
      console.log("Track name: " + currentTrack.name);
      console.log("Track artist: " + currentTrack.artist);
      console.log("Track album: " + currentTrack.album);
      console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
      updatePresence();
        // Or if it is a new track
    }else if(type === 'new_track'){
      console.log("[IDRP] " + currentTrack.name + " is now playing.");
      console.log("Song information:");
      console.log("Track name: " + currentTrack.name);
      console.log("Track artist: " + currentTrack.artist);
      console.log("Track album: " + currentTrack.album);
      console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
      updatePresence();
    }
});

// Do something when iTunes is paused
iTunesEmitter.on('paused', function(type, currentTrack){
  console.log("[IDRP] " + currentTrack.name + " is now paused.");
  console.log("Song information:");
  console.log("Track name: " + currentTrack.name);
  console.log("Track artist: " + currentTrack.artist);
  console.log("Track album: " + currentTrack.album);
  console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
  updatePresencePause();
});
// Do something when iTunes is stopped
iTunesEmitter.on('stopped', function(){
    console.log("[IDRP] iTunes is now no longer playing.");
    rp.disconnect();
});

function trayStuff() {

  tray = new Tray(iconPath)

  let template = [
  {
    label: 'Open IDRP window',
    type: 'normal',
    click: () => openwin(),
  },
  {
    label: 'About IDRP',
    type: 'normal',
    click: () => mainWindow.open('https://github.com/itztaylorau/iTunes-Discord-Rich-Presence'),
  }
  ]

  const ctxMenu = Menu.buildFromTemplate(template)
  tray.setContextMenu(ctxMenu)
  tray.setToolTip('iTunesDRP')
}

