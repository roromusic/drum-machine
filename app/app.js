const cowbellFile = "https://freesound.org/data/previews/34/34272_304419-lq.mp3";
const kickFile = "https://freesound.org/data/previews/132/132584_2409787-lq.mp3";
const snareFile = "https://freesound.org/data/previews/13/13750_32468-lq.mp3";

let context = new (window.AudioContext || window.webkitAudioContext)();

let instruments = new Map([["cowbell"]]);
let gainNode,
    source,
    metronomeOn = true;

async function getBuffer(file, instrument) {
  const promise = await fetch(file);
  const data = await promise.arrayBuffer();
  const buffer = await context.decodeAudioData(data).then(function(decodedData){
    return decodedData
  });

  instruments.set(instrument, buffer);
  
}
getBuffer(cowbellFile, "cowbell");

function setup(instrument) {
   gainNode = context.createGain();
   source = context.createBufferSource();
   source.buffer = instruments.get(instrument);
   source.connect(gainNode);
   gainNode.connect(context.destination);
   gainNode.gain.setValueAtTime(0.8, context.currentTime);
  
  source.loop = true;
}
   

function loopMetronome(time, bpm, instrument) {
  setup(instrument);
  source.start(time);
  source.loopEnd = bpm;
}

function stop() {
  var ct = context.currentTime + 0.1;
  gainNode.gain.exponentialRampToValueAtTime(0.001, ct);
  source.stop(ct);
}

let playBtn = document.querySelector("#play");
let stopBtn = document.querySelector("#stop");
let bpm = document.querySelector("input");

playBtn.addEventListener("mousedown", function() {
  const newBPM = (60 / bpm.value).toFixed(2);
  if(metronomeOn){
    loopMetronome(context.currentTime, newBPM, "cowbell");
  }
})

stopBtn.addEventListener("click", function() {
  stop();
})

bpm.addEventListener("change", function(e) {
  const newBPM = (60 / e.target.value).toFixed(2)
  console.log(newBPM);
  source.loopEnd = newBPM;
})