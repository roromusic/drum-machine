const cowbellFile = "https://freesound.org/data/previews/34/34272_304419-lq.mp3";
const kickFile = "https://freesound.org/data/previews/132/132584_2409787-lq.mp3";
const snareFile = "https://freesound.org/data/previews/13/13750_32468-lq.mp3";

let context = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = context.createGain();
gainNode.connect(context.destination);
gainNode.gain.setValueAtTime(0.8, context.currentTime);
let instruments = new Map([["cowbell"], ["kick"], ["snare"]]);
let scheduledPlays = [];

let hits = new Map([
  [0, ["cowbell"]],
  [1, []],
  [2, []],
  [3, []],
  [4, ["cowbell"]],
  [5, []],
  [6, []],
  [7, []],
  [8, ["cowbell"]],
  [9, []],
  [10, []],
  [11, []],
  [12, ["cowbell"]],
  [13, []],
  [14, []],
  [15, []],
]);
let bpm = 1.00,
    sixteenth = .25,
    nextRepeatPoint,
    metronomeOn = true,
    playing = false,
    beatsLeft = 0;

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
   let sourceNode = context.createBufferSource();
   sourceNode.buffer = instruments.get(instrument);
   sourceNode.connect(gainNode);

  if(instrument === "cowbell"){
    beatsLeft += 1;

    sourceNode.onended = function(event) {
      beatsLeft -= 1;
      if(playing === true && beatsLeft === 3){
        playBeat()
      }
    }
   }

   scheduledPlays.push(sourceNode);
   
   return sourceNode;
}  

function playSample(time, instrument) {
  let sourceNode = setup(instrument);
  sourceNode.start(time);
}

function playBeat() {
  const currentTime = nextRepeatPoint === undefined ? context.currentTime : nextRepeatPoint;

  hits.forEach((instrumentArr, partial) => {
    if(instrumentArr.length !== 0) {
      instrumentArr.forEach(instrument => {
        playSample(currentTime + sixteenth * partial, instrument);
      })
    }
  })

  nextRepeatPoint = currentTime + bpm * 4;
}

function stop() {
  var ct = context.currentTime + 0.1;
  gainNode.gain.exponentialRampToValueAtTime(.01, ct);

  scheduledPlays.forEach(node => node.stop());

  playing = false;
  nextRepeatPoint = undefined;
  gainNode.gain.setValueAtTime(0.8, ct);
}

let playBtn = document.querySelector("#play");
let stopBtn = document.querySelector("#stop");
let bpmInput = document.querySelector("input");

playBtn.addEventListener("mousedown", function() {
  if(!playing){
    playBeat();
  
    playing = true;
  }
  
})

stopBtn.addEventListener("click", function() {
  stop();
})

bpmInput.addEventListener("change", function(e) {
  bpm = (60 / e.target.value);
  sixteenth = (bpm / 4);
  console.log(bpm);
  
})

document.querySelector("#instruments").addEventListener("click", (e) => {
  if(e.target.classList.contains("note") && !playing){
    const instrument = e.target.parentNode.parentNode.id;
    const partial = Number(e.target.getAttribute("data-partial"));
    let partialInstruments = hits.get(partial);
    
    if(!partialInstruments.includes(instrument)){
      partialInstruments.push(instrument);
      hits.set(partial, partialInstruments);
    }else {
      hits.set(partial, partialInstruments.filter(item => item !== instrument));
    }
    
    playSample(context.currentTime, instrument);

    e.target.classList.toggle("note-play");
  }
})