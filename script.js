// Load the CSV file
d3.csv("data/endangered_species.csv").then(data => {
  // Parse date and numeric columns
  console.log("Loaded data:", data)
  const parseDate = d3.timeParse("%-d %b %y"); // Updated format to handle days without leading zero
  data.forEach((d, i) => {
    const originalDate = d.date;
    d.date = parseDate(d.date);
    if (i < 3) console.log(`Row ${i}: "${originalDate}" → ${d.date}`); // Debug first few dates
    // Convert all count columns to numbers
    for (let key in d) {
      if (key !== "date") d[key] = +d[key] || 0; // Handle NaN values
    }
  });
  
  // Filter out any rows with invalid dates
  data = data.filter(d => d.date !== null);
  console.log("Filtered data:", data);

  // --- STACKED AREA CHART ---
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  // Ensure we have a proper width even if clientWidth is 0
  const chartElement = document.getElementById('chart');
  const containerWidth = chartElement.clientWidth || 800; // fallback to 800px
  const width = containerWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  console.log("Chart dimensions:", { width, height, containerWidth });

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 200)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Columns to include in the stack (e.g., endangered/threatened mammals, birds, reptiles, etc.)
  const keys = [
    "endangered_mammals",
    "endangered_birds",
    "endangered_reptiles",
    "endangered_amphs",
    "endangered_fish",
    "endangered_snails"
    ,"endangered_clams",
    "endangered_crustaceans",
    "endangered_insects",
    "endangered_arachnids",
    "endangered_coral",
    // Add more categories if desired
  ];

  console.log("Available data columns:", Object.keys(data[0] || {}));
  console.log("Stack keys:", keys);

  const stack = d3.stack()
    .keys(keys);

  const layers = stack(data);
  console.log("Stacked layers:", layers);

  // Check if we have valid data and dates
  const dateExtent = d3.extent(data, d => d.date);
  console.log("Date extent:", dateExtent);
  
  if (!dateExtent[0] || !dateExtent[1]) {
    console.error("No valid dates found in data");
    return;
  }

  const x = d3.scaleTime()
    .domain(dateExtent)
    .range([0, width]);

  // Find max value from all layers
  let maxValue = 0;
  layers.forEach(layer => {
    const layerMax = d3.max(layer, d => d[1]);
    if (layerMax > maxValue) maxValue = layerMax;
  });
  
  console.log("Max value for y scale:", maxValue);

  const y = d3.scaleLinear()
    .domain([0, maxValue])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeCategory10);

  // Function to format key names for the legend
  const formatKeyName = (key) => {
    return key.replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
  };

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

  svg.append("line")
    .attr("x1", width + 20)
    .attr("x2", width + 20)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");

  // Legend
  console.log("Legend keys:", keys);


  const legendX = width + 40; // 40px gap to the right of chart
  const legendY = 20;
    
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  const legendItems = legend.selectAll(".legend-item")
    .data(keys)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 22})`);

  // Add colored rectangles
  legendItems.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", color)
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5);

  // Add text labels
  legendItems.append("text")
    .attr("x", 20)
    .attr("y", 12)
    .style("font-size", "11px")
    .style("fill", "#333")
    .style("font-family", "Arial, sans-serif")
    .text(formatKeyName);


  // --- TABLE POPULATION ---
  const tbody = d3.select("#data-table tbody");
  data.forEach(d => {
    tbody.append("tr")
      .html(`<td>${d.date.toLocaleDateString()}</td>
             <td>${d.all_ani}</td>
             <td>${d.endangered_mammals}</td>`); // example columns for table
  });
  
  console.log("Chart creation completed successfully!");
}).catch(error => {
  console.error("Error loading or processing data:", error);
});
