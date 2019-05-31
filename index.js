let waveform, player, spectrum, sampleRate;
let spectralCentroid, scMin, scMax, colorMap;
let audioInitialized = false;
let cx = 0;
let cy = 0;

function preload() {
    soundFormats('mp3', 'ogg', 'wav');
    player = loadSound('assets/hitme_1.wav');

    var request = new AudioFileRequest('assets/jazzo.wav');
    console.log(request);

    request.onSuccess = (decoded) => {
        console.log(decoded);
        sampleRate = decoded.sampleRate;
        let mono = Float32Array.from(stereo2Mono(decoded.channels[0], decoded.channels[1]));

        let barkBandsFilter = xtract_init_bark(1024, sampleRate);
        let barkBands = xtract_bark_coefficients(mono, barkBandsFilter);
        console.log(barkBands);
        let loudness = xtract_loudness(barkBands);
        // console.log(loudness);

        spectrum = [];
        spectralCentroid = [];
        let i = 0;
        while (i < mono.length - 1024) {
            let current = mono.slice(i, i + 1024);
            let fft = new FFT(1024, decoded.sampleRate);
            let currentSpec = fft.forward(current);
            spectrum = spectrum.concat(currentSpec);
            spectralCentroid = spectralCentroid.concat(xtract_spectral_centroid(currentSpec) * 1000000000);
            i += 1024;
        }

        // spectralCentroid = spectralCentroid.map(e => Math.log(e));
        // console.log("SC", spectralCentroid);

        // Create colorMap for spectral centroid
        scMax = Math.max.apply(null, spectralCentroid);
        scMin = Math.min.apply(null, spectralCentroid);

        colorMap = [];
        for (let i = 0.01; i < 1; i += 0.01){
            let interpol = _interpolateColor(h2r("#82ccdd"), h2r("#a1eeff"), i);
            colorMap.push(interpol);
        }
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
    frameRate(1);

    player.setVolume(1);
    waveform = player.getPeaks(5000);
}

function draw() {
    background(255); // Set the background to white

    stroke("#000000");
    drawPeakCircle(waveform, 300);

    drawSpectralCentroid();

    stroke(colorAlpha("#b71540", 0.2));
    drawFrequencyCircle(200, 100, 300);
    stroke(colorAlpha("#eb2f06", 0.2));
    drawFrequencyCircle(1000, 150, 600);
    stroke(colorAlpha("#f6b93b", 0.3));
    drawFrequencyCircle(5000, 180);
    stroke(colorAlpha("#fad390", 0.4));
    drawFrequencyCircle(12000, 210);

    if(audioInitialized){
        stroke("#000000");
        drawPlayerIndicator(player.currentTime(), player.duration());
    }
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
        stroke(colorAlpha(colour, 0.3));

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + 200);
        let py2 = cy + Math.cos(a) * (radius + 200);

        line(px1, py1, px2, py2);
    }
};

drawPlayerIndicator = (currentTime, totalDuration) => {
    let length = 100;
    let a = (currentTime / totalDuration) * 2 * Math.PI;
    let px1 = cx;
    let py1 = cy;
    let px2 = cx + Math.sin(a) * length;
    let py2 = cy + Math.cos(a) * length;

    line(px1, py1, px2, py2);
};

function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
    audioInitialized = true;
    player.play();
}