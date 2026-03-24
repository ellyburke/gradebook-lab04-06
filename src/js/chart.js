// src/js/chart.js
// D3 charting for Gradebook Explorer

// Draw bar chart of letter grade frequencies
function drawChart(freqData) {

    d3.select("#chart").remove();

    const data = Object.entries(freqData);

    const width = 500;
    const height = 350;
    const margin = { top: 50, right: 20, bottom: 50, left: 50 };

    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("id", "chart")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d[0]))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom, margin.top]);

    // Bars
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d[1]))
        .attr("fill", "black");

    // X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    // Y Axis (percentage)
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(".0%"));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold");

    // Y label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Frequency");
}