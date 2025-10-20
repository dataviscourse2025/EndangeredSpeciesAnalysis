// Load the CSV file
d3.csv("data/endangered_species.csv").then(data => {
  // Parse date and numeric columns
  console.log(data)
  const parseDate = d3.timeParse("%d %b %y"); // adjust if your date format is different
  data.forEach(d => {
    d.date = parseDate(d.date);
    // Convert all count columns to numbers
    for (let key in d) {
      if (key !== "date") d[key] = +d[key];
    }
  });

  // --- STACKED AREA CHART ---
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const width = document.getElementById('chart').clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Columns to include in the stack (e.g., endangered/threatened mammals, birds, reptiles, etc.)
  const keys = [
    "endangered_mammals","threatened_mammals",
    "endangered_birds","threatened_birds",
    "endangered_reptiles","threatened_reptiles"
    // Add more categories if desired
  ];

  const stack = d3.stack()
    .keys(keys);

  const layers = stack(data);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(layers[layers.length-1], d => d[1])])
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

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // --- TABLE POPULATION ---
  const tbody = d3.select("#data-table tbody");
  data.forEach(d => {
    tbody.append("tr")
      .html(`<td>${d.date.toLocaleDateString()}</td>
             <td>${d.all_ani}</td>
             <td>${d.endangered_mammals}</td>`); // example columns for table
  });
});
