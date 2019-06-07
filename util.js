stereo2Mono = (left, right) => {
    let mono = addVector(left, right);
    return divideVector(mono, 2);
};

addVector = (a, b) => {
    return a.map((e,i) => e + b[i]);
};

divideVector = (vec, divisor) => {
    return vec.map(e => e / divisor);
};

// Converts a #ffffff hex string into an [r,g,b] array
h2r = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Inverse of the above
r2h = (rgb) => {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

// Interpolates two [r,g,b] colors and returns an [r,g,b] of the result
_interpolateColor = (color1, color2, factor) => {
    let result = color1.slice();
    for (let i=0;i<3;i++) {
        result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
    }
    return result;
};

function colorAlpha(aColor, alpha) {
    let c = color(aColor);
    return color('rgba(' +  [red(c), green(c), blue(c), alpha].join(',') + ')');
}

/* Functions for color maps */
function interpolateLinearly(x, values) {
    // Split values into four lists
    var x_values = [];
    var r_values = [];
    var g_values = [];
    var b_values = [];
    for (i in values) {
        x_values.push(values[i][0]);
        r_values.push(values[i][1][0]);
        g_values.push(values[i][1][1]);
        b_values.push(values[i][1][2]);
    }
    var i = 1;
    while (x_values[i] < x) {
        i = i+1;
    }
    i = i-1;
    var width = Math.abs(x_values[i] - x_values[i+1]);
    var scaling_factor = (x - x_values[i]) / width;
    // Get the new color values though interpolation
    var r = r_values[i] + scaling_factor * (r_values[i+1] - r_values[i])
    var g = g_values[i] + scaling_factor * (g_values[i+1] - g_values[i])
    var b = b_values[i] + scaling_factor * (b_values[i+1] - b_values[i])
    return to255([enforceBounds(r), enforceBounds(g), enforceBounds(b)]);
}

function to255(x){
    return [Math.floor(x[0] * 255), Math.floor(x[1] * 255), Math.floor(x[2] * 255)];
}

function enforceBounds(x) {
    if (x < 0) {
        return 0;
    } else if (x > 1){
        return 1;
    } else {
        return x;
    }
}

// helper for writing color to array
function writeColor(image, x, y, red, green, blue, alpha) {
    let index = (x + y * width) * 4;
    image.pixels[index] = red;
    image.pixels[index + 1] = green;
    image.pixels[index + 2] = blue;
    image.pixels[index + 3] = alpha;
}