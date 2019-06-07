let waveform, player, spectrum, sampleRate;
let spectralCentroid, scMin, scMax, colorMap;
let audioInitialized = false;
let cx = 0;
let cy = 0;
let decodedWav = 0;
let bpm = 0, bpmStrokes = 0;
let img;
let lengthInSeconds;
let pausedCurrentTime = 0;
let readyToDraw = false;
let firstRenderDone = false;

let fileInput = document.getElementById('audio-file');
let btn = document.getElementById('btn');
btn.addEventListener("click", function() {

    // check for file
    if(fileInput.files[0] === undefined) {
        // Stop the process and tell the user they need to upload a file.
        return false;
    }

    let reader1 = new FileReader();
    reader1.onload = function(ev) {
        soundFormats('mp3', 'ogg', 'wav');
        player = loadSound(fileInput.files[0], (result => {
            player.setVolume(1);
            waveform = player.getPeaks(5000);

            // Decode audio
            let audioCtx = getAudioContext();
            audioCtx.decodeAudioData(ev.target.result).then(function(buffer) {
                let soundSource = audioCtx.createBufferSource();
                soundSource.buffer = buffer;

                decodedWav = buffer;
                sampleRate = buffer.sampleRate;
                lengthInSeconds = Math.floor(buffer.length / sampleRate);
                let mono = Float32Array.from(stereo2Mono(buffer.getChannelData(0), buffer.getChannelData(1)));

                spectrum = [];
                spectralCentroid = [];
                let i = 0;
                while (i < mono.length - 1024) {
                    let current = mono.slice(i, i + 1024);
                    let fft = new FFT(1024, sampleRate);
                    let currentSpec = fft.forward(current);
                    spectrum = spectrum.concat(currentSpec);
                    spectralCentroid = spectralCentroid.concat(xtract_spectral_centroid(currentSpec) * 1000000000);
                    i += 1024;
                }

                spectralCentroid = spectralCentroid.map(e => Math.sqrt(e));
                console.log(Math.max.apply(null, spectralCentroid));
                console.log(Math.min.apply(null, spectralCentroid));
                // console.log("SC", spectralCentroid);

                // Create colorMap for spectral centroid
                scMax = Math.max.apply(null, spectralCentroid);
                scMin = Math.min.apply(null, spectralCentroid);

                colorMap = [];
                for (let i = 0.01; i < 1; i += 0.01){
                    let interpol = interpolateLinearly(i, nipy_spectral);
                    colorMap.push(interpol);
                }
                readyToDraw = true;
                redraw();
            });
        }));
    };
    reader1.readAsArrayBuffer(fileInput.files[0]);

}, false);

function preload() {

}

function setup() {
    let w = 1024;
    let h = 700;

    // Create canvas
    createCanvas(w, h);

    cx = width / 2;
    cy = height / 2;

    stroke(0); // Set line drawing color to black
    frameRate(30);

    noLoop();
    firstRenderDone = false;
}

function draw() {
    background(255); // Set the background to white
    if(!readyToDraw) {
        return;
    }

    if(!firstRenderDone){
        stroke("#000000");
        drawPeakCircle(300);

        drawSpectralCentroid();

        stroke(colorAlpha("#b71540", 0.2));
        drawFrequencyCircle(200, 100, 300);

        stroke(colorAlpha("#eb2f06", 0.2));
        drawFrequencyCircle(1000, 150, 600);

        stroke(colorAlpha("#ffd92e", 0.3));
        drawFrequencyCircle(5000, 200, 3000);

        stroke(colorAlpha("#fff9c6", 0.4));
        drawFrequencyCircle(12000, 250, 5000);

        // Create image to write generated visual data on. This results in heavy calculations being performed only once
        // instead of every time the draw() method is called
        saveFrames('out', 'png', 1, 1, data => {
            let image = data[0];
            img = loadImage(image.imageData);
            firstRenderDone = true;
            loop();
        });
    } else {
        image(img, 0, 0, 1024, 700);
    }

    if(audioInitialized){
        stroke("#000");
        drawPlayerIndicator(player.currentTime(), player.duration());
        drawBPM();
    }
}

drawPeakCircle = (radius) => {
    ellipse(width / 2, height / 2, radius * 2, radius * 2);

    for (let a = 0; a < 2 * Math.PI; a += Math.PI / (waveform.length / 10)){
        // Map angle to array length
        let i = Math.floor((a / (2 * Math.PI)) * waveform.length);

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + waveform[i] * 70);
        let py2 = cy + Math.cos(a) * (radius + waveform[i] * 70);

        line(px1, py1, px2, py2);
    }
};

drawFrequencyCircle = (frequency, radius, multiplicator = 2000) => {
    if (frequency < 0 ||frequency > sampleRate / 2) {
        throw new Error("Frequency bin must be between 0 and " + sampleRate / 2 + ".");
    }

    // Map frequency to 512 frequency bins
    let fBin = Math.floor((frequency * 512) / (sampleRate / 2));

    for (let a = 0; a < 2 * Math.PI; a += Math.PI / spectrum.length){
        // Map angle to array length
        let i = Math.floor((a / (2 * Math.PI)) * spectrum.length);

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + spectrum[i][fBin] * multiplicator);
        let py2 = cy + Math.cos(a) * (radius + spectrum[i][fBin] * multiplicator);

        line(px1, py1, px2, py2);
    }
};

drawSpectralCentroid = () => {
    let radius = 100;
    for (let a = 0; a < 2 * Math.PI; a += Math.PI / spectralCentroid.length){
        // Map angle to array length
        let i = Math.floor((a / (2 * Math.PI)) * spectralCentroid.length);

        // Map spectral centroid to color
        let c = Math.floor((spectralCentroid[i] / scMax) * 98);
        let colour = r2h(colorMap[c]);
        stroke(colorAlpha(colour, .008));

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + 200);
        let py2 = cy + Math.cos(a) * (radius + 200);
        line(px1, py1, px2, py2);

        let b = a;
        for (let j = 0; j < 300; j++){
            // Blur line by drawing two lines for each entry. The actual one and additionally, the next one
            b += Math.PI / spectralCentroid.length;
            px1 = cx + Math.sin(b) * radius;
            py1 = cy + Math.cos(b) * radius;
            px2 = cx + Math.sin(b) * (radius + 200);
            py2 = cy + Math.cos(b) * (radius + 200);
            line(px1, py1, px2, py2);
        }
    }
};

drawPlayerIndicator = (currentTime, totalDuration) => {
    if(currentTime === 0 || currentTime === undefined){
        currentTime = pausedCurrentTime;
    }
    let length = 50;
    let a = (currentTime / totalDuration) * 2 * Math.PI;
    let px1 = cx + Math.sin(a) * length;
    let py1 = cy + Math.cos(a) * length;
    let px2 = cx + Math.sin(a) * length * 2;
    let py2 = cy + Math.cos(a) * length * 2;

    line(px1, py1, px2, py2);
};

drawBPM = () => {
    if (bpm <= 0){
        return;
    }
    let radius = 50;
    ellipse(cx, cy, radius * 2, radius * 2);
    for (let a = 0; a < 2 * Math.PI; a += 2 * Math.PI / bpmStrokes){

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + 49);
        let py2 = cy + Math.cos(a) * (radius + 49);

        line(px1, py1, px2, py2);
    }
};

function touchStarted() {
    if (!firstRenderDone) {
        return;
    }
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
    if (player.isPlaying()) {
        pausedCurrentTime = player.currentTime();
        console.log("CURRENT TIME", pausedCurrentTime);
        player.pause();
        return;
    }
    if (bpm <= 0) {
        beatDetection(decodedWav).then(result => {
            bpm = result;
            bpmStrokes = Math.floor(lengthInSeconds / 60 * bpm);
        });
    }

    audioInitialized = true;
    player.play();
    loop();
}