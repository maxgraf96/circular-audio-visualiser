let waveform, player, spectrum;
let cx = 0;
let cy = 0;

function preload() {
    soundFormats('mp3', 'ogg', 'wav');
    player = loadSound('assets/hitme_1.wav');

    var request = new AudioFileRequest('assets/hitme_1.wav');
    console.log(request);

    request.onSuccess = (decoded) => {
        console.log(decoded);
        let mono = stereo2Mono(decoded.channels[0], decoded.channels[1]);
        spectrum = [];
        let i = 0;
        while (i < mono.length - 1024) {
            let current = mono.slice(i, i + 1024);
            let fft = new FFT(1024, decoded.sampleRate);
            spectrum = spectrum.concat(fft.forward(current));
            i += 1024;
        }
        console.log(spectrum);
    };
    request.onFailure = (decoded) => {
        console.log("ERROR");
    };
    request.send();
}

function setup() {
    // Create canvas
    createCanvas(1024, 700);

    cx = width / 2;
    cy = height / 2;

    stroke(0); // Set line drawing color to black
    frameRate(25);

    player.setVolume(1);
    waveform = player.getPeaks();
    player.play();

    // let audioCtx = new (AudioContext || webkitAudioContext)();
    // let fileInput = document.getElementById('audio-file');
    // let btn = document.getElementById('btn');
    // btn.addEventListener("click", () => {
    //     // check for file
    //     if(fileInput.files[0] === undefined) {
    //         // Stop the process and tell the user they need to upload a file.
    //         return false;
    //     }
    //     let fileReader = new FileReader();
    //     fileReader.onload = function(ev) {
    //         // Decode audio
    //         audioCtx.decodeAudioData(ev.target.result).then((buffer) => {
    //             let soundSource = audioCtx.createBufferSource();
    //             soundSource.buffer = buffer;
    //             console.log(buffer.getChannelData(0));
    //         });
    //     };
    //     fileReader.readAsArrayBuffer(fileInput.files[0]);
    // }, false);
}

function draw() {
    background(255); // Set the background to white

    drawPeakCircle(waveform, 300);

    drawFrequencyCircle(30, 50);
    drawFrequencyCircle(100, 100);
    drawFrequencyCircle(256, 150);
    drawFrequencyCircle(400, 200);

    drawPlayerIndicator(player.currentTime(), player.duration());

}

drawPeakCircle = (waveform, radius) => {
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

drawFrequencyCircle = (frequencyBin, radius) => {
    if (frequencyBin < 0 ||frequencyBin > 512) {
        throw new Error("Frequency bin must be between 0 and 512.");
    }
    for (let a = 0; a < 2 * Math.PI; a += Math.PI / spectrum.length){
        // Map angle to array length
        let i = Math.floor((a / (2 * Math.PI)) * spectrum.length);

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + spectrum[i][frequencyBin] * 2000);
        let py2 = cy + Math.cos(a) * (radius + spectrum[i][frequencyBin] * 2000);

        line(px1, py1, px2, py2);
    }
};

drawPlayerIndicator = (currentTime, totalDuration) => {
    let length = 300;
    let a = (currentTime / totalDuration) * 2 * Math.PI;
    let px1 = cx;
    let py1 = cy;
    let px2 = cx + Math.sin(a) * length;
    let py2 = cy + Math.cos(a) * length;

    line(px1, py1, px2, py2);
};