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