const cowbellFile = "https://freesound.org/data/previews/34/34272_304419-lq.mp3";
const kickFile = "https://freesound.org/data/previews/132/132584_2409787-lq.mp3";
const snareFile = "https://freesound.org/data/previews/13/13750_32468-lq.mp3";

let context = new (window.AudioContext || window.webkitAudioContext)();

let instruments = new Map([["cowbell"], ["kick"], ["snare"]]);
let source = {
  cowbell: [],
  kick: [],
  snare: []
};
let scheduledPlays = [];
let hits = {
  kick: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
};

let gainNode,
    bpm = 1.00,
    sixteenth = .25,
    nextRepeatPoint,
    metronomeOn = false,
    playing = false;

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
   let sourceNode = context.createBufferSource();
   sourceNode.buffer = instruments.get(instrument);
   sourceNode.connect(gainNode);
   source[instrument].push(sourceNode);
   sourceNode.onended = function(event) {
     source[instrument].shift();
     if(playing === true && source[instrument].length === 0){
       playBeat()
     }
   }
   gainNode.connect(context.destination);
   gainNode.gain.setValueAtTime(0.8, context.currentTime);

   return sourceNode;
}  

function loopMetronome(time, instrument) {
  let sourceNode = setup(instrument);
  sourceNode.start(time);
  sourceNode.loop = true;
  sourceNode.loopEnd = bpm;
}

function playSample(time, instrument) {
  let sourceNode = setup(instrument);
  sourceNode.start(time);
}

function playBeat() {
  const currentTime = nextRepeatPoint === undefined ? context.currentTime : nextRepeatPoint;

  hits.kick.forEach((partial, index) => {
    if(partial) {
      playSample(currentTime + sixteenth * index, "kick")
    }
    
  })

  hits.snare.forEach((partial, index) => {
    if(partial) {
      playSample(currentTime + sixteenth * index, "snare")
    }
    
  })

  nextRepeatPoint = currentTime + bpm * 4;
}

function stop() {
  var ct = context.currentTime + 0.1;
  gainNode.gain.exponentialRampToValueAtTime(0.001, ct);
  if (source["cowbell"][0]) source["cowbell"][0].stop(ct);
}

let playBtn = document.querySelector("#play");
let stopBtn = document.querySelector("#stop");
let bpmInput = document.querySelector("input");

playBtn.addEventListener("mousedown", function() {
  playing = true;
  if(metronomeOn){
    loopMetronome(context.currentTime, "cowbell");
  }else {
    playBeat();
  }
})

stopBtn.addEventListener("click", function() {
  stop();
})

bpmInput.addEventListener("change", function(e) {
  bpm = (60 / e.target.value).toFixed(2);
  sixteenth = (bpm / 4).toFixed(2);
  console.log(bpm);
  if(source["cowbell"]){
    source["cowbell"].loopEnd = bpm;
  }
  
})

document.querySelector("#instruments").addEventListener("click", (e) => {
  if(e.target.classList.contains("note")){
    const instrument = e.target.parentNode.parentNode.id;
    const partial = e.target.getAttribute("data-partial");
    
    e.target.classList.toggle("note-play");
    hits[instrument][partial] = !hits[instrument][partial];
    console.log(hits[instrument][partial])
    playSample(context.currentTime, instrument);
  }
})