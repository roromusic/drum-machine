const sound = "https://freesound.org/data/previews/34/34272_304419-lq.mp3";
const kick = "https://freesound.org/data/previews/132/132584_2409787-lq.mp3";
const snare = "https://freesound.org/data/previews/13/13750_32468-lq.mp3";

let context = new (window.AudioContext || window.webkitAudioContext)();
let cowbell,
    gainNode,
    source;

function getBuffer() {
  let request = new XMLHttpRequest();
  request.open('get', sound, true);
  request.responseType = 'arraybuffer';
  request.onload = () => {
    context.decodeAudioData(request.response, (buffer) => {
      cowbell = buffer;
      setup();
      console.log("buffer complete", buffer);
    });
  };
  request.send();
}
getBuffer();

function setup() {
   gainNode = context.createGain();
   source = context.createBufferSource();
   source.buffer = cowbell;
   source.connect(gainNode);
   gainNode.connect(context.destination);
   gainNode.gain.setValueAtTime(0.8, context.currentTime);
  
  source.loop = true;
}
   

function play(time, bpm) {
  setup();
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
  play(context.currentTime, newBPM);
})

stopBtn.addEventListener("click", function() {
  stop();
})

bpm.addEventListener("change", function(e) {
  const newBPM = (60 / e.target.value).toFixed(2)
  console.log(newBPM);
  source.loopEnd = newBPM;
})