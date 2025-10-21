// Load the CSV file
d3.csv("data/endangered_species.csv").then(data => {
  const parseDate = d3.timeParse("%-d %b %y"); 
  data.forEach((d) => {
    d.date = parseDate(d.date);
    for (let key in d) {
      if (key !== "date") d[key] = +d[key] || 0;
    }
  });

  data = data.filter(d => d.date !== null);

  const margin = { top: 20, right: 160, bottom: 40, left: 60 };
  const chartElement = document.getElementById('chart');
  const containerWidth = chartElement.clientWidth || 800;
  const width = containerWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const keys = [
    "endangered_mammals",
    "endangered_birds",
    "endangered_reptiles",
    "endangered_amphs",
    "endangered_fish",
    "endangered_snails",
    "endangered_clams",
    "endangered_crustaceans",
    "endangered_insects",
    "endangered_arachnids",
    "endangered_coral"
  ];

  const stack = d3.stack().keys(keys);
  const layers = stack(data);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(layers, layer => d3.max(layer, d => d[1]))])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeCategory10);

  const area = d3.area()
    .x(d => x(d.data.date))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  svg.selectAll("path")
    .data(layers)
    .join("path")
    .attr("fill", d => color(d.key))
    .attr("d", area);

  // --- X AXIS every 10 years ---
  const xAxis = d3.axisBottom(x)
    .ticks(d3.timeYear.every(10))
    .tickFormat(d3.timeFormat("%Y"));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", "11px");

  // --- Y AXIS as a vertical line ---
  svg.append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // Optional: add Y-axis ticks with labels
  const yAxis = d3.axisLeft(y).ticks(5);
  svg.append("g")
    .call(yAxis)
    .selectAll("path, line")
    .attr("stroke", "black");

  // --- Legend vertically centered ---
  const legend = svg.append("g").attr("class", "legend");
  const legendHeight = keys.length * 22;
  const legendX = width + 20;
  const legendY = (height - legendHeight) / 2;

  const legendItems = legend.selectAll(".legend-item")
    .data(keys)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${legendX}, ${legendY + i * 22})`);

  legendItems.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => color(d))
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5);

  legendItems.append("text")
    .attr("x", 20)
    .attr("y", 12)
    .style("font-size", "11px")
    .style("fill", "#333")
    .style("font-family", "Arial, sans-serif")
    .text(d => d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  // --- Table population ---
  const tbody = d3.select("#data-table tbody");
  data.forEach(d => {
    tbody.append("tr")
      .html(`<td>${d.date.toLocaleDateString()}</td>
             <td>${d.all_ani}</td>
             <td>${d.endangered_mammals}</td>`);
  });

  console.log("Chart creation completed successfully!");
}).catch(error => {
  console.error("Error loading or processing data:", error);
});
