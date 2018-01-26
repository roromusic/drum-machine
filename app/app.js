const cowbellFile = "https://freesound.org/data/previews/34/34272_304419-lq.mp3";
const kickFile = "https://freesound.org/data/previews/132/132584_2409787-lq.mp3";
const snareFile = "https://freesound.org/data/previews/13/13750_32468-lq.mp3";

let context = new (window.AudioContext || window.webkitAudioContext)();

let instruments = new Map([["cowbell"], ["kick"], ["snare"]]);
let source = {};
let scheduledPlays = [];

let gainNode,
    bpm = 1.00,
    sixteenth = .25,
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
getBuffer(kickFile, "kick");
getBuffer(snareFile, "snare");

function setup(instrument) {
   gainNode = context.createGain();
   source[instrument] = context.createBufferSource();
   source[instrument].buffer = instruments.get(instrument);
   source[instrument].connect(gainNode);
   gainNode.connect(context.destination);
   gainNode.gain.setValueAtTime(0.8, context.currentTime);
}
   

function loopMetronome(time, instrument) {
  setup(instrument);
  source[instrument].start(time);
  source[instrument].loop = true;
  source[instrument].loopEnd = bpm;
}

function playSample(time, instrument) {
  setup(instrument);
  source[instrument].start(time);
}

function stop() {
  var ct = context.currentTime + 0.1;
  gainNode.gain.exponentialRampToValueAtTime(0.001, ct);
  source["cowbell"].stop(ct);
}

let playBtn = document.querySelector("#play");
let stopBtn = document.querySelector("#stop");
let bpmInput = document.querySelector("input");

playBtn.addEventListener("mousedown", function() {

  if(metronomeOn){
    loopMetronome(context.currentTime, "cowbell");
  }
})

stopBtn.addEventListener("click", function() {
  stop();
})

bpmInput.addEventListener("change", function(e) {
  bpm = (60 / e.target.value).toFixed(2);
  partial = (bpm / 4).toFixed(2);
  console.log(bpm);
  if(source["cowbell"]){
    source["cowbell"].loopEnd = bpm;
  }
  
})

document.querySelector("#instruments").addEventListener("click", (e) => {
  if(e.target.className === "note"){
    console.log(e.target.parentNode.parentNode.id)
    playSample(context.currentTime, e.target.parentNode.parentNode.id);
  }
})