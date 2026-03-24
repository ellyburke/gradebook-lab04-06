// src/js/spreadsheet.js
// DOM generation + jQuery interactivity + editing + summary updates

// Constant html elements
const gradebook = $('#gradebook tbody');
const summary = $('.selection-summary');
const chartContainer = $('#chart-container');

let currentSelection = {
    type: null,   // row or column
    index: null,  // row index or column index
    name: null // column name (for columns only)
};

let marks = [];

let sortAscending = true; // For sorting columns when header is clicked. Starts as ascending, then toggles each click

// =====================================
// Getting and propulting grades
// =====================================

// Gets marks from csv and creates marks list of arrays for better iteration
function grabMarks(){

    // Load csv
    loadCSV().then(data => {
        marks = data;
        populateTable(marks);
    })

    // // Skip the first row since it is the header - WHEN DATA WAS HARD CODED
    // for (let i = 1; i < marksTest.length; i++){
    //     const cols = marksTest[i]  //.split(',');

    //     let row = [cols[0], Number(cols[1]), Number(cols[2]), Number(cols[3]), Number(cols[4]), Number(cols[5])];
    //     marks.push(row);
    // }
    
}

// Place mark objects into the table
function populateTable(marks){
    if (!marks || marks.length === 0){
        return;
    }

    // Wipe the gradebook table data ONLY for sorting purposes
    gradebook.html('');

    for (let i = 0; i < marks.length; i++) {
        const rowData = marks[i];
        const row = `<tr id="row-${i}">
                        <th>${rowData[0]}</th>
                        <td>${rowData[1]}</td>
                        <td>${rowData[2]}</td>
                        <td>${rowData[3]}</td>
                        <td>${rowData[4]}</td>
                        <td>${rowData[5]}</td>
                    </tr>`;
        gradebook.append(row);

        // Append an onclick event listener to the name cell
        $(`#row-${i} th`).on('click', function(event){
            selectRow(i); // Handles row selection
        })
    }

    // Append an onclick event listener to all data cells
    $(`td`).on('click', function(event){;
        changeToTextField($(this), $(this).text());
    });

    return;
}


// =====================================
// Selecting Data functions
// =====================================

// Get the row and return a numeric array
function getSelectedRow(marks, rowId){
    // Get if row index is valid
    if(!isValidRow(rowId)){
        console.warn("Invalid row index.");
        return [];
    }

    let selectedRow = marks[rowId];
    return selectedRow;
    
}

// Get column and return a numeric array
function getSelectedCol(marks, colId){
    
    // Get if column index is valid
    if(!isValidCol(colId)){
        console.warn("Invalid column index.");
        return [];
    }

    let selectedColData = [];
    // Go through the data and grab each cell that pertains to that column
    for (let i=0; i < marks.length; i++){
        const mark = marks[i][colId];
        selectedColData.push(mark);
    }
    
    return selectedColData;
}

function selectRow(rowIndex){
    deselectAll();

    const row = $(`#row-${rowIndex}`);
    // Add the selected class to selected dasta cells
    row.find('td').addClass('selected');

    currentSelection = {
        type: "row",
        index: rowIndex,
        name: marks[rowIndex][0]
    };

    const rowData = getSelectedRow(marks, rowIndex);
    displaySummary(rowData, "row");
}

function selectColumn(colIndex, columnName){
    deselectAll();
    colIndex = Number(colIndex);

    const currentDirection = sortAscending;

    // Additional challenge: Sort by column when header is clicked
    marks.sort((a, b) => {
        const valA = Number(a[colIndex]);
        const valB = Number(b[colIndex]);
    
        if (isNaN(valA)) return 1;
        if (isNaN(valB)) return -1;
        
        if (sortAscending){
            return valA - valB;
        }
        else{
            return valB - valA;
        }
    });

    sortAscending = !sortAscending; // Toggle sorting direction for next click

    // Store selection
    currentSelection = {
        type: "column",
        index: colIndex,
        name: columnName
    };

    populateTable(marks);

    // Remove arrows from all headers
    $('#gradebook th').each(function(){
        $(this).text($(this).text().replace(" ▲", "").replace(" ▼", ""));
    });

    // Add arrow to selected column header for sorting direction
    const arrow = sortAscending ? " ▲" : " ▼";

    // +1 because first column is "Student"
    $(`#gradebook th:nth-child(${colIndex + 1})`).text(columnName + arrow);

    // Add the selected class to selected data cells
    $('#gradebook tbody tr').each(function(){
        $(this).find(`td:nth-child(${colIndex + 1})`).addClass('selected');
    });

    // Update summary
    const colData = getSelectedCol(marks, colIndex);
    displaySummary(colData, "column", columnName);
}

function deselectAll(){
    $('#gradebook td').removeClass('selected');
}

// =============================
// Displaying summary functions
// =============================

function displaySummary(data, selectedType, columnName){

    let numberData = [];

    // Set selected label properly
    if (selectedType === "row"){
        $("#selected-type").text("Row");
        $("#header-name").text(data[0]);

        numberData = data.slice(1); // remove student name

    } else {
        $("#selected-type").text("Column");
        $("#header-name").text(columnName);

        numberData = data;
    }

    // Filter valid numeric values only
    const validNumbers = numberData.filter(value => 
        typeof value === 'number' && !isNaN(value)
    );

    const countValid = validNumbers.length;
    $("#count").html(countValid);

    // Handle empty case
    if (countValid === 0) {
        $("#mean").html("—");
        $("#min").html("—");
        $("#max").html("—");
        return;
    }

    // Mean
    const mean = validNumbers.reduce((sum, value) => sum + value, 0) / countValid;
    $("#mean").html(mean.toFixed(2));

    // Min & Max
    $("#min").html(Math.min(...validNumbers).toFixed(2));
    $("#max").html(Math.max(...validNumbers).toFixed(2));

    const frequencies = computeFrequencies(validNumbers);
    drawChart(frequencies);
}

function changeToTextField(cell, currentValue) {
    const input = $(`<input class="cell-input" type="text" value="${currentValue}">`);
    cell.html(input);
    input.focus();

    input.on('keydown', function(event) {
        if (event.key === 'Enter') {

            const newValue = input.val();
            let numericValue 
            
            if (newValue === ""){
                numericValue = "";
            }else if (!isNaN(newValue)) {
                numericValue = Number(newValue);
            } else {
                numericValue = newValue;
            }

            // Get row + column index
            const rowIndex = cell.closest('tr').index();
            const cellIndex = cell.index();

            // Update table UI
            cell.html(newValue);

            // Update data model
            marks[rowIndex][cellIndex] = numericValue;

            if (currentSelection.type === "row") {
                const rowData = getSelectedRow(marks, currentSelection.index);
                displaySummary(rowData, "row");

            } else if (currentSelection.type === "column") {
                const colData = getSelectedCol(marks, currentSelection.index);
                displaySummary(colData, "column", currentSelection.name);
            }
        }
    });
}

// =============================
// Safety Checks
// =============================

function isValidRow(rowId){
    // Use  Number to make sure the id is an integer
    return Number(rowId) >= 0 && Number(rowId) < marks.length;
}

function isValidCol(colId){ 
    return Number(colId) >= 1 && Number(colId) <= 5;
}

grabMarks();