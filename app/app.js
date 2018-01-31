const cowbellFile = "https://freesound.org/data/previews/34/34272_304419-lq.mp3";
const kickFile = "https://freesound.org/data/previews/132/132584_2409787-lq.mp3";
const snareFile = "https://freesound.org/data/previews/13/13750_32468-lq.mp3";
const hihatFile = "https://freesound.org/data/previews/140/140514_177850-lq.mp3";
const crashFile = "https://freesound.org/data/previews/13/13244_36719-lq.mp3";

let context = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = context.createGain();
    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(0.8, context.currentTime);
let metGain = context.createGain();
    metGain.connect(context.destination);
    metGain.gain.setValueAtTime(0.8, context.currentTime);
let instruments = new Map([["cowbell"], ["kick"], ["snare"]]);
let scheduledPlays = [];

let playBtn = document.querySelector("#play");
let stopBtn = document.querySelector("#stop");
let bpmInput = document.querySelector(".bpm_input");
let metInput = document.querySelector(".metronome");
let patternList = document.querySelector(".controls_patterns");

let bpm = 1.00,
    sixteenth = .25,
    nextRepeatPoint,
    metronomeOn = true,
    playing = false,
    beatsLeft = 0,
    measure = undefined,
    animationFrame = null,
    animationRequest,
    displayedPattern = 1;

  let patterns = [newPattern()];

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
getBuffer(hihatFile, "hihat");
getBuffer(crashFile, "crash");

function newPattern() {
  return new Map([
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
}

function setup(instrument) {
   let sourceNode = context.createBufferSource();
   sourceNode.buffer = instruments.get(instrument);
   sourceNode.connect(instrument === "cowbell" ? metGain : gainNode);

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

  patterns.forEach((pattern, index) => {
    pattern.forEach((instrumentArr, partial) => {
      if(instrumentArr.length !== 0) {
        instrumentArr.forEach(instrument => {
          playSample(currentTime + (sixteenth * partial) + (bpm * 4 * index), instrument);
        })
      }
    })
  })

  nextRepeatPoint = currentTime + (bpm * 4 * patterns.length);
}

function showMeasure(timestamp) {
  if(!animationFrame) animationFrame = timestamp;
  let progress = timestamp - animationFrame;

  if(measure === undefined) {
    measure = 1;
    document.querySelector(".bars_measure" + measure).classList.toggle("bars_measure-selected");
    measure++;
  } 
  if(progress > bpm * 1000) {
    resetMeasure();
    document.querySelector(".bars_measure" + measure).classList.toggle("bars_measure-selected");
    animationFrame += bpm * 1000;
    if(measure === 4 ){
      measure = 1;
    }else {
      if(measure === 1){
        patterns.length > displayedPattern ? switchPattern(Number(displayedPattern) + 1) : switchPattern(1);
      }
      measure++;
    }
  }

  animationRequest = window.requestAnimationFrame(showMeasure);
}

function resetMeasure() {
  document.querySelector(".bars_measure1").classList.toggle("bars_measure-selected", false);
  document.querySelector(".bars_measure2").classList.toggle("bars_measure-selected", false);
  document.querySelector(".bars_measure3").classList.toggle("bars_measure-selected", false);
  document.querySelector(".bars_measure4").classList.toggle("bars_measure-selected", false);

  playing ? undefined : measure = undefined;
  
}

function stop() {
  var ct = context.currentTime + 0.1;
  gainNode.gain.exponentialRampToValueAtTime(.01, ct);

  scheduledPlays.forEach(node => node.stop());

  playing = false;
  nextRepeatPoint = undefined;
  gainNode.gain.setValueAtTime(0.8, ct);

  window.cancelAnimationFrame(animationRequest);
  animationFrame = null;
  resetMeasure();

  bpmInput.disabled = false;
}

function toggleMet(e){
  var ct = context.currentTime + 0.05;
  
  e.target.checked ? metGain.gain.exponentialRampToValueAtTime(.8, ct) : 
                     metGain.gain.exponentialRampToValueAtTime(.001, ct);
}

function switchPattern(pattern){
  console.log(pattern);

  //clicking on current pattern doesn't do anything
  if(pattern != displayedPattern){
    //toggle selected button
    document.querySelector(".controls_pattern" + displayedPattern).classList.toggle("controls_pattern-selected");
    document.querySelector(".controls_pattern" + pattern).classList.toggle("controls_pattern-selected");

    //reset partial(display)
    document.querySelectorAll(".note-play").forEach(node => node.classList.toggle("note-play"));
    displayedPattern = pattern;

    //show correct partial selections
    if(patterns[pattern - 1]){
      patterns[pattern -1].forEach((instrumentArr, partial) => {
        instrumentArr.forEach(instrument => {
          if(instrument !== "cowbell"){
            document.querySelector("." + instrument + "_" + partial).classList.toggle("note-play");
          }
        })
      })
    }
  }
}

playBtn.addEventListener("mousedown", function() {
  if(!playing){
    playBeat();
    switchPattern(1);
    window.requestAnimationFrame(showMeasure);
  
    playing = true;

    bpmInput.disabled = true;
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

metInput.addEventListener("change", function(e){
  toggleMet(e);
})

document.querySelector("#instruments").addEventListener("click", (e) => {
  if(e.target.classList.contains("note") && !playing){
    const instrument = e.target.parentNode.parentNode.id;
    const partial = Number(e.target.getAttribute("data-partial"));

    if(!patterns[displayedPattern - 1]){
      patterns[displayedPattern - 1] = newPattern();
    }
    let partialInstruments = patterns[displayedPattern - 1].get(partial);
    
    if(!partialInstruments.includes(instrument)){
      partialInstruments.push(instrument);
      patterns[displayedPattern - 1].set(partial, partialInstruments);
    }else {
      patterns[displayedPattern - 1].set(partial, partialInstruments.filter(item => item !== instrument));
    }
    
    playSample(context.currentTime, instrument);

    e.target.classList.toggle("note-play");
  }
})

patternList.addEventListener("click", (e) => {
  if(e.target.classList.contains("controls_pattern") && !playing){
    switchPattern(e.target.getAttribute("data-pattern"));
  }
})