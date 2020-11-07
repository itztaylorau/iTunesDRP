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
const iconv = require('iconv-lite');
var tray = null;
var trackname, trackartist, trackalbum;
var iTunesEmitter = iTunes.emitter;
var client = require('discord-rich-presence')(config.client_id.apple_music_id);
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    //ow:1000
    width: 900,
    height: 420,
    transparent: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.removeMenu()
  console.log("[IDRP] The application window loaded successfully.");
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  console.log("[IDRP] Checking if iTunes was opened or not...");
  checkiTunesRunning()
  if(config.raw_data){
    console.log("[IDRP] You are using raw data mode, IDRP don't recommend you to use this mode since bug will be occur when using this mode.");
    console.log("To change it please change it from the settings page.")
  }else{
    console.log("[IDRP] You are using parsed data mode.");
  }
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
        nestedstruct();
        console.log("[IDRP] iTunes is currently playing a song.");
        console.log("Song information:");
      console.log("Track name: " + trackname);
      console.log("Track artist: " + trackartist);
      console.log("Track album: " + trackalbum);
        console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
        updatePresence();
        break;
    }
    case "paused": {
        nestedstruct();
        console.log("[IDRP] iTunes is currently paused.");
        console.log("Song information:");
      console.log("Track name: " + trackname);
      console.log("Track artist: " + trackartist);
      console.log("Track album: " + trackalbum);
        console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
        updatePresence();
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
 
function updatePresence() {
  var currentTrack = iTunes.getCurrentTrack();
  var remaining = Date.now() + (currentTrack.remainingTime * (3000 / 3));
  client.updatePresence({
  state: trackartist + '-' + trackalbum,
  details: trackname,
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
  state: trackartist + '-' + trackalbum,
  details: trackname,
  largeImageKey: 'apple-music-logo',
  smallImageKey: 'pause-icon',
  instance: true,
}
);}

// Do something when iTunes is playing
iTunesEmitter.on('playing', function(type, currentTrack){
    // If it is a paused track that restarts playing
    if(type === "player_state_change") {
      nestedstruct();
      console.log("[IDRP] " + trackname + " has been resumed.");
      console.log("Song information:");
      console.log("Track name: " + trackname);
      console.log("Track artist: " + trackartist);
      console.log("Track album: " + trackalbum);
      console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
      updatePresence();
        // Or if it is a new track
    }else if(type === 'new_track'){
      nestedstruct();
      console.log("[IDRP] " + trackname + " is now playing.");
      console.log("Song information:");
      console.log("Track name: " + trackname);
      console.log("Track artist: " + trackartist);
      console.log("Track album: " + trackalbum);
      console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
      updatePresence();
    }
});

// Do something when iTunes is paused
iTunesEmitter.on('paused', function(type, currentTrack){
  nestedstruct();
  console.log("[IDRP] " + trackname + " is now paused.");
  console.log("Song information:");
  console.log("Track name: " + trackname);
  console.log("Track artist: " + trackartist);
  console.log("Track album: " + trackalbum);
  console.log("Duration/ElapsedTime/RemainingTime: " + currentTrack.duration + "/" + currentTrack.elapsedTime + "/" + currentTrack.remainingTime);
  updatePresencePause();
});
// Do something when iTunes is stopped
iTunesEmitter.on('stopped', function(){
    console.log("[IDRP] iTunes is now no longer playing.");
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

//Start of extrasonglib
function nestedstruct () {
    var currentTrack = iTunes.getCurrentTrack();
    //J-POP
    if(currentTrack.artist == "HKT48" && currentTrack.album == "12 Seconds - EP" && currentTrack.duration == 225 && config.raw_data == false){trackname = "12秒"; trackalbum = "12 Seconds - EP"; trackartist = "HKT48";}
    else if(currentTrack.artist == "NGT48" && currentTrack.album == "Sekainohitoe (Special Edition) - EP" && currentTrack.duration == 209 && config.raw_data == false){trackname = "世界の人へ"; trackalbum = "Sekainohitoe (Special Edition) - EP"; trackartist = "NGT48";}
    else if(currentTrack.artist == "HKT48" && currentTrack.album == "092 (Type-B)" && currentTrack.duration == 249 && config.raw_data == false){trackname = "大人列車"; trackalbum = "092 (Type-B)"; trackartist = "HKT48";}
    else if(currentTrack.artist == "HKT48" && currentTrack.album == "Hayaokuri Calendar (Theater Edition) - EP" && currentTrack.duration == 293 && config.raw_data == false){trackname = "早送りカレンダー"; trackalbum = "Hayaokuri Calendar (Theater Edition) - EP"; trackartist = "HKT48";}
    else if(currentTrack.artist == "NGT48" && currentTrack.album == "Sherbet Pink (Special Edition) - EP" && currentTrack.duration == 246 && config.raw_data == false){trackname = "シャーベットピンク"; trackalbum = "Sherbet Pink (Special Edition) - EP"; trackartist = "NGT48";}
    else if(currentTrack.artist == "IZ*ONE" && currentTrack.album == "Sukito Iwasetai (Type A) - Single" && currentTrack.duration == 239 && config.raw_data == false){trackname = "好きと言わせたい"; trackalbum = "Sukito Iwasetai (Type A) - Single"; trackartist = "I*ZONE";}
    else if(currentTrack.artist == "AKB48" && currentTrack.album == "???????" && currentTrack.duration == 283 && config.raw_data == false){trackname = "Heavy Rotation"; trackalbum = "ここにいたこと"; trackartist = "AKB48";}
    else if(currentTrack.artist == "AKB48" && currentTrack.album == "Namida Surprise! - Single" && currentTrack.duration == 280 && config.raw_data == false){trackname = "涙サプライズ!"; trackalbum = "Namida Surprise! - Single"; trackartist = "AKB48";}    
    else if((currentTrack.artist == "Gen Hoshino" || "???") && currentTrack.album == "POP VIRUS" && currentTrack.duration == 280 && config.raw_data == false){trackname = "アイデア (IDEA)"; trackalbum = "POP VIRUS"; trackartist = "星野源";} 
    else if((currentTrack.artist == "Gen Hoshino" || "???") && currentTrack.album == "POP VIRUS" && currentTrack.duration == 251 && config.raw_data == false){trackname = "恋 "; trackalbum = "POP VIRUS"; trackartist = "星野源";} 
    else if((currentTrack.artist == "Hinatazaka46"|| "???46") && currentTrack.album == "Hinatazaka (Complete Edition)" && currentTrack.duration == 238 && config.raw_data == false){trackname = "アザトカワイイ"; trackalbum = "Hinatazaka (Complete Edition)"; trackartist = "日向坂46";} 
    else if((currentTrack.artist == "Hanazawa Kana" || "????") && currentTrack.album == "???????????" && currentTrack.duration == 255 && config.raw_data == false){trackname = "恋愛サーキュレーション"; trackalbum = "恋愛サーキュレーション"; trackartist = "花澤香菜";} 
    else if(currentTrack.artist == "AKB48" && currentTrack.album == "???? (Type A)" && currentTrack.duration == 286 && config.raw_data == false){trackname = "恋するフォーチュンクッキー"; trackalbum = "次の足跡 (Type A)"; trackartist = "AKB48";} 
    else if(currentTrack.artist == "Aqours" && currentTrack.album == "??????????? - Single" && currentTrack.duration == 250 && config.raw_data == false){trackname = "未来の僕らは知ってるよ"; trackalbum = "未来の僕らは知ってるよ - Single"; trackartist = "Aqours";} 
    else if(currentTrack.artist == "Aqours" && currentTrack.album == "??Jumping Heart - Single" && currentTrack.duration == 284 && config.raw_data == false){trackname = "青空Jumping Heart"; trackalbum = "青空Jumping Heart - Single"; trackartist = "Aqours";} 
    else if(currentTrack.artist == "CYaRon!" && currentTrack.album == "????DAY! DAY! DAY! - Single" && currentTrack.duration == 278 && config.raw_data == false){trackname = "夜空はなんでも知ってるの?"; trackalbum = "元気全開DAY! DAY! DAY! - Single"; trackartist = "CYaRon!";} 
    else if((currentTrack.artist == "Akari Kito"|| "????") && currentTrack.album == "Style" && currentTrack.duration == 261 && config.raw_data == false){trackname = "23時の春雷少女"; trackalbum = "Style"; trackartist = "鬼頭明里";} 
    else if((currentTrack.artist == "Akari Kito"|| "????") && currentTrack.album == "Desire Again" && currentTrack.duration == 290 && config.raw_data == false){trackname = "Tiny Light"; trackalbum = "Desire Again"; trackartist = "鬼頭明里";} 
    else if((currentTrack.artist == "Azumi Waki"|| "?????") && (currentTrack.album == "Hurry Love / Koi To Yobu Ni Wa" || "??????" || "Hurry Love" || "Koi To Yobu Ni Wa") && currentTrack.duration == 242 && config.raw_data == false){trackname = "恋と呼ぶには"; trackalbum = "恋と呼ぶには"; trackartist = "和氣あず未";} 
    else if(currentTrack.artist == "NGT48" && currentTrack.album == "Sherbet Pink (Special Edition) - EP" && currentTrack.duration == 214 && config.raw_data == false){trackname = "後悔ばっかり"; trackalbum = "Sherbet Pink (Special Edition) - EP"; trackartist = "NGT48";}
    else if(currentTrack.artist == "NGT48" && currentTrack.album == "Sherbet Pink (Special Edition) - EP" && currentTrack.duration == 304 && config.raw_data == false){trackname = "絶望の後で"; trackalbum = "Sherbet Pink (Special Edition) - EP"; trackartist = "NGT48";}
    //Canton/Mardarin POP
    else if(currentTrack.artist == "Mayday" && currentTrack.album == "???? (???)" && currentTrack.duration == 289 && config.raw_data == false){trackname = "乾杯"; trackalbum = "第二人生 (末日版)"; trackartist = "五月天";}
    else if(currentTrack.artist == "???" && currentTrack.album == "????????? - Single" && currentTrack.duration == 251 && config.raw_data == false){trackname = "你的酒館對我打了烊"; trackalbum = "你的酒館對我打了烊 - Single"; trackartist = "陳雪凝";}
    else if(currentTrack.artist == "Jay Chou" && currentTrack.album == "Jay Chou's Bedtime Stories" && currentTrack.duration == 215 && config.raw_data == false){trackname = "告白氣球"; trackalbum = "周傑倫的牀邊故事"; trackartist = "周傑倫";}
    else if(currentTrack.artist == "Daniel Chan" && currentTrack.album == "Best Hits in Danieland" && currentTrack.duration == 217 && config.raw_data == false){trackname = "劃火柴"; trackalbum = "Best Hits in Danieland"; trackartist = "Daniel Chan";}
    else if(currentTrack.artist == "Jia Jia" && currentTrack.album == "??? (???)" && currentTrack.duration == 230 && config.raw_data == false){trackname = "命運"; trackalbum = "蘭陵王 (電視原聲帶)"; trackartist = "家家";}
    else if(currentTrack.artist == "Hebe Tien" && currentTrack.album == "To Hebe" && currentTrack.duration == 275 && config.raw_data == false){trackname = "寂寞寂寞就好"; trackalbum = "To Hebe"; trackartist = "田馥甄";}
    else if(currentTrack.artist == "Mayday" && currentTrack.album == "??" && currentTrack.duration == 346 && config.raw_data == false){trackname = "後來的我們"; trackalbum = "自傳"; trackartist = "五月天";}
    else if(currentTrack.artist == "Sherman Chung" && currentTrack.album == "Veriditas" && currentTrack.duration == 219 && config.raw_data == false){trackname = "從不信自己"; trackalbum = "Sherman Chung"; trackartist = "Veriditas";}
    else if(currentTrack.artist == "Alex Fong" && currentTrack.album == "?.? (∩┐╜?????∩┐╜???) - Single" && currentTrack.duration == 308 && config.raw_data == false){trackname = "捨.得 (《無煙大家庭》主題曲)"; trackalbum = "捨.得 (《無煙大家庭》主題曲) - Single"; trackartist = "Alex Fong";}
    else if(currentTrack.artist == "Tang Siu Hau" && currentTrack.album == "??? (???∩┐╜????∩┐╜???) - Single" && currentTrack.duration == 192 && config.raw_data == false){trackname = "未知數 (電視劇《魔幻天使》主題曲)"; trackalbum = "未知數 (電視劇《魔幻天使》主題曲) - Single"; trackartist = "Tang Siu Hau";}
    else if(currentTrack.artist == "EggPlantEgg" && currentTrack.album == "????" && currentTrack.duration == 259 && config.raw_data == false){trackname = "浪子回頭"; trackalbum = "卡通人物"; trackartist = "茄子蛋";}
    else if(currentTrack.artist == "Nicholas Tse" && currentTrack.album == "??? (??+??)" && currentTrack.duration == 213 && config.raw_data == false){trackname = "無聲仿有聲"; trackalbum = "黃‧鋒 (新曲+精選)"; trackartist = "Nicholas Tse";}
    else if(currentTrack.artist == "Janice Vidal" && currentTrack.album == "???? - Single" && currentTrack.duration == 260 && config.raw_data == false){trackname = "穿花蝴蝶"; trackalbum = "穿花蝴蝶 - Single"; trackartist = "Janice Vidal";}
    else if(currentTrack.artist == "???" && currentTrack.album == "?? - Single" && currentTrack.duration == 269 && config.raw_data == false){trackname = "綠色"; trackalbum = "綠色 - Single"; trackartist = "陳雪凝";}
    else if(currentTrack.artist == "???" && currentTrack.album == "???????? ????" && currentTrack.duration == 284 && config.raw_data == false){trackname = "老鼠愛大米"; trackalbum = "老鼠愛大米結婚篇 嫁給我吧"; trackartist = "王啓文";}
    else if(currentTrack.artist == "Jay Chou" && currentTrack.album == "?????" && currentTrack.duration == 284 && config.raw_data == false){trackname = "聽媽媽的話"; trackalbum = "依然范特西"; trackartist = "周傑倫";}
    else if(currentTrack.artist == "Thomas DGX YHL" && currentTrack.album == "Glory to Hong Kong" && currentTrack.duration == 105 && config.raw_data == false){trackname = "願榮光歸香港"; trackalbum = "Glory to Hong Kong"; trackartist = "Thomas DGX YHL";}
    else if(currentTrack.artist == "TFBOYS" && (currentTrack.album == "Big Dreamer - EP" || "???? - EP") && currentTrack.duration == 225 && config.raw_data == false){trackname = "大夢想家"; trackalbum = "大夢想家 - EP"; trackartist = "TFBOYS";}
    else if(currentTrack.artist == "TFBOYS" && (currentTrack.album == "Practise Book for Youth - EP" || "?????? - EP") && currentTrack.duration == 263 && config.raw_data == false){trackname = "青春修煉手冊"; trackalbum = "青春修煉手冊 - EP"; trackartist = "TFBOYS";}
    else if(currentTrack.artist == "Kay Tse" && currentTrack.album == "???? - Happily Ever After - Single" && currentTrack.duration == 209 && config.raw_data == false){trackname = "有夢要想 - Happily Ever After"; trackalbum = "有夢要想 - Happily Ever After - Single"; trackartist = "Kay Tse";}
    else if(currentTrack.artist == "Hu Ge & Alan" && currentTrack.album == "????????? - Single" && currentTrack.duration == 263 && config.raw_data == false){trackname = "一念執著"; trackalbum = "步步驚心主題曲原聲 - Single"; trackartist = "Hu Ge & Alan";}
    else if(currentTrack.artist == "Ivyan" && currentTrack.album == "?∩┐╜?" && currentTrack.duration == 288 && config.raw_data == false){trackname = "三寸天堂"; trackalbum = "無·果"; trackartist = "Ivyan";}
    else if(currentTrack.artist == "Cecilia Liu" && currentTrack.album == "????????? - Single" && currentTrack.duration == 241 && config.raw_data == false){trackname = "等你的季節"; trackalbum = "步步驚心主題曲原聲 - Single"; trackartist = "Cecilia Liu";}
    else if(currentTrack.artist == "Jia Jia" && currentTrack.album == "???? (?????)" && currentTrack.duration == 297 && config.raw_data == false){trackname = "塵埃"; trackalbum = "步步驚情 (電視原聲帶)"; trackartist = "家家";}
    else if(currentTrack.artist == "Claire Kuo" && currentTrack.album == "Once Upon a Love (Music from the TV Series)" && currentTrack.duration == 239 && config.raw_data == false){trackname = "擁抱你的微笑"; trackalbum = "Once Upon a Love (Music from the TV Series)"; trackartist = "郭靜";}
    else if(currentTrack.artist == "ToNick" && currentTrack.album == "???? - Single" && currentTrack.duration == 273 && config.raw_data == false){trackname = "長相廝守"; trackalbum = "長相廝守 - Single"; trackartist = "ToNick";}
    else if(currentTrack.artist == "Jay Chou" && currentTrack.album == "Waiting For You (with Gary Yang) - Single" && currentTrack.duration == 270 && config.raw_data == false){trackname = "等你下課"; trackalbum = "Waiting For You (with Gary Yang) - Single"; trackartist = "周傑倫";}
    else if(currentTrack.artist == "Jace Chan & Terence Lam" && currentTrack.album == "?? (Studio Live Duet) - Single" && currentTrack.duration == 248 && config.raw_data == false){trackname = "隔離 (Studio Live Duet)"; trackalbum = "隔離 (Studio Live Duet) - Single"; trackartist = "Jace Chan & Terence Lam";}
    else if(currentTrack.artist == "Yoyo Sham" && currentTrack.album == "???∩┐╜????∩┐╜???" && currentTrack.duration == 235 && config.raw_data == false){trackname = "追光者 (電視劇《夏至未至》插曲)"; trackalbum = "電視劇《夏至未至》原聲帶"; trackartist = "Yoyo Sham";}
    else if(currentTrack.artist == "a-mei" && currentTrack.album == "BAD BOY" && currentTrack.duration == 318 && config.raw_data == false){trackname = "聽海"; trackalbum = "BAD BOY"; trackartist = "a-mei";}
    else{trackname = currentTrack.name; trackartist = currentTrack.artist; trackalbum = currentTrack.album;}
    //Last Update: 2020/11/07 GMT+8 16:51, do you know it takes me 2 hours to do this lmao.
  }
