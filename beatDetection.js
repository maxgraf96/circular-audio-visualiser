function beatDetection (buffer) {
    let AudioContextOptions = {
        sampleRate: buffer.sampleRate
    };
    let audioCtx = new AudioContext(AudioContextOptions);
    let myArrayBuffer = audioCtx.createBuffer(2, audioCtx.sampleRate * buffer.length / buffer.sampleRate, buffer.sampleRate);
    console.log(myArrayBuffer);

    // Fill the buffer with the decoded data
    for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
        // This gives us the actual array that contains the data
        let nowBuffering = myArrayBuffer.getChannelData(channel);
        for (let i = 0; i < myArrayBuffer.length; i++) {
            nowBuffering[i] = buffer.getChannelData(channel)[i];
        }
    }

    let offlineContext = new OfflineAudioContext(1, myArrayBuffer.length, myArrayBuffer.sampleRate);
    let source = offlineContext.createBufferSource();
    source.buffer = myArrayBuffer;
    let filter = offlineContext.createBiquadFilter();
    filter.type = "lowpass";
    source.connect(filter);
    filter.connect(offlineContext.destination);
    source.start(0);
    return offlineContext.startRendering().then(buffer => {
        let bpm = process(buffer);
        return bpm;
    });
}

function process(buffer) {
    //If you want to analyze both channels, use the other channel later
    let data = buffer.getChannelData(0);
    let max = arrayMax(data);
    let min = arrayMin(data);
    let threshold = min + (max - min) * 0.98;
    let peaks = getPeaksAtThreshold(data, threshold);
    let intervalCounts = countIntervalsBetweenNearbyPeaks(peaks);
    let tempoCounts = groupNeighborsByTempo(intervalCounts);
    tempoCounts.sort(function (a, b) {
        return b.count - a.count;
    });
    if (tempoCounts.length) {
        return tempoCounts[0].tempo;
    }
    return -1;
}

// http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
function getPeaksAtThreshold(data, threshold) {
    let peaksArray = [];
    let length = data.length;
    for (let i = 0; i < length;) {
        if (data[i] > threshold) {
            peaksArray.push(i);
            // Skip forward ~ 1/4s to get past this peak.
            i += 10000;
        }
        i++;
    }
    return peaksArray;
}

function countIntervalsBetweenNearbyPeaks(peaks) {
    let intervalCounts = [];
    peaks.forEach(function (peak, index) {
        for (let i = 0; i < 10; i++) {
            let interval = peaks[index + i] - peak;
            let foundInterval = intervalCounts.some(function (intervalCount) {
                if (intervalCount.interval === interval) return intervalCount.count++;
            });
            //Additional checks to avoid infinite loops in later processing
            if (!isNaN(interval) && interval !== 0 && !foundInterval) {
                intervalCounts.push({
                    interval: interval,
                    count: 1
                });
            }
        }
    });
    return intervalCounts;
}

function groupNeighborsByTempo(intervalCounts) {
    let tempoCounts = [];
    intervalCounts.forEach(function (intervalCount) {
        //Convert an interval to tempo
        let theoreticalTempo = 60 / (intervalCount.interval / 44100);
        theoreticalTempo = Math.round(theoreticalTempo);
        if (theoreticalTempo === 0) {
            return;
        }
        // Adjust the tempo to fit within the 90-180 BPM range
        while (theoreticalTempo < 90) theoreticalTempo *= 2;
        while (theoreticalTempo > 180) theoreticalTempo /= 2;

        let foundTempo = tempoCounts.some(function (tempoCount) {
            if (tempoCount.tempo === theoreticalTempo) return tempoCount.count += intervalCount.count;
        });
        if (!foundTempo) {
            tempoCounts.push({
                tempo: theoreticalTempo,
                count: intervalCount.count
            });
        }
    });
    return tempoCounts;
}

// http://stackoverflow.com/questions/1669190/javascript-min-max-array-values
function arrayMin(arr) {
    let len = arr.length,
        min = Infinity;
    while (len--) {
        if (arr[len] < min) {
            min = arr[len];
        }
    }
    return min;
}

function arrayMax(arr) {
    let len = arr.length,
        max = -Infinity;
    while (len--) {
        if (arr[len] > max) {
            max = arr[len];
        }
    }
    return max;
}