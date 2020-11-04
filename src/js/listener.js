var iTunes = require('itunes-bridge');

function listen() { 
    var currentTrack = iTunes.getCurrentTrack();
    console.log(currentTrack);
}