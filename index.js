
let peaks = 0;
let cx = 0;
let cy = 0;
const radius = 175;

function preload() {
    soundFormats('mp3', 'ogg', 'wav');
    hitme = loadSound('assets/hitme_1.wav');
}

function setup() {
    // Create canvas
    createCanvas(640, 480);

    cx = width / 2;
    cy = height / 2;

    stroke(0); // Set line drawing color to black
    frameRate(1);

    hitme.setVolume(0.5);
    peaks = hitme.getPeaks();
    // hitme.play();
}

function draw() {
    background(255); // Set the background to white
    ellipse(width / 2, height / 2, radius * 2, radius * 2);


    for (let a = 0; a < 2 * Math.PI; a += Math.PI / (peaks.length / 10)){
        // Map angle to array length
        let i = Math.floor((a / (2 * Math.PI)) * peaks.length);

        let px1 = cx + Math.sin(a) * radius;
        let py1 = cy + Math.cos(a) * radius;
        let px2 = cx + Math.sin(a) * (radius + peaks[i] * 150);
        let py2 = cy + Math.cos(a) * (radius + peaks[i] * 150);

        line(px1, py1, px2, py2);
    }
}