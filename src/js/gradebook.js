// src/js/gradebook.js
// Data + parsing + utilities for Gradebook Explorer

// Load csv
function loadCSV(){
    return fetch('../data/grades.csv')
    .then(response => response.text())
    .then(text => {
        const rows = text.trim().split('\n').map(row => row.split(','));

        const marks = [];
        for (let i = 1; i < rows.length; i++) {
            let row = rows[i];

            marks.push([
                row[0],
                Number(row[1]),
                Number(row[2]),
                Number(row[3]),
                Number(row[4]),
                Number(row[5])
            ]);
        }
        return marks;
    })
};

// Convert numeric to letter grade
function getLetterGrade(numGrade){
    if (numGrade >= 90) {
        return 'A';
    } else if (numGrade >= 80) {
        return 'B';
    } else if (numGrade >= 70) {
        return 'C';
    } else if (numGrade >= 60) {
        return 'D';
    } else {
        return 'F';
    }
}

// Compute normalized frequencies
function computeFrequencies(data){
    const valid = data.filter(d => typeof d === 'number' && !isNaN(d));

    const frequencies = {A: 0, B: 0, C: 0, D: 0, F: 0};

    if (valid.length === 0) {
        return frequencies; // Avoid division by zero
    }

    valid.forEach(mark => {
        const letter = getLetterGrade(mark);
        frequencies[letter]++;
    });

    // Normalize 
    Object.keys(frequencies).forEach(key => {
        frequencies[key] = frequencies[key] / valid.length;
    })

    return frequencies;
}

