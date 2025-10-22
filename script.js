function renderStackedArea() {
  d3.csv("data/endangered_species.csv").then(data => {
    const container = d3.select("#chart");
    container.html("");
    container.append("h2")
      .attr("class", "chart-title")
      .text("Number of Endangered Animal Species Per Class");

    const parseDate = d3.timeParse("%-d %b %y");
    data.forEach((d) => {
      d.date = parseDate(d.date);
      for (let key in d) {
        if (key !== "date") d[key] = +d[key] || 0;
      }
    });
    data = data.filter(d => d.date !== null);

    const margin = { top: 20, right: 160, bottom: 60, left: 70 };
    const chartElement = document.getElementById('chart');
    const containerWidth = chartElement.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container
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

    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeYear.every(10))
      .tickFormat(d3.timeFormat("%Y"));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px");

    svg.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    const yAxis = d3.axisLeft(y).ticks(5);
    svg.append("g")
      .call(yAxis)
      .selectAll("path, line")
      .attr("stroke", "black");

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
      .text(d => d
        .replace(/^endangered_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      );

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Species");
  }).catch(error => {
    console.error("Error loading or processing data:", error);
  });
}

function renderUSMap() {
  const container = d3.select("#chart-map");
  container.html("");
  container.append("h2")
    .attr("class", "chart-title")
    .text("US Endangered Species by State (2019)");

  const width = 960;
  const height = 600;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = container.append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "white")
    .style("padding", "5px 10px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px");

  const projection = d3.geoAlbersUsa().scale(1300).translate([width/2, height/2]);
  const path = d3.geoPath().projection(projection);

  Promise.all([
    d3.json("https://d3js.org/us-10m.v1.json"),
    d3.csv("data/endangered_2019.csv")
  ]).then(([us, csvData]) => {
    const data = {};
    let maxVal = 0;
    csvData.forEach(d => {
      const val = +d["Endangered (Total) 2019"];
      data[d.State] = val;
      if (val > maxVal) maxVal = val;
    });

    const color = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateReds);

    svg.append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", d => {
        const stateName = d.properties.name || d.id;
        return data[stateName] !== undefined ? color(data[stateName]) : "#eee";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        const stateName = d.properties.name || d.id;
        const value = data[stateName] !== undefined ? data[stateName] : "No data";
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>${stateName}</strong><br/>Endangered: ${value}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(100).style("opacity", 0);
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
      });

    // Optional legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendMargin = { top: 20, right: 20, bottom: 40, left: 20 };

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .join("stop")
      .attr("offset", d => d)
      .attr("stop-color", d => color(d * maxVal));

    svg.append("rect")
      .attr("x", width - legendWidth - 20)
      .attr("y", height - 30)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#999")
      .style("stroke-width", 0.5);

    svg.append("text")
      .attr("x", width - legendWidth - 20)
      .attr("y", height - 35)
      .style("font-size", "12px")
      .text("Low");

    svg.append("text")
      .attr("x", width - 20)
      .attr("y", height - 35)
      .style("font-size", "12px")
      .attr("text-anchor", "end")
      .text("High");

  }).catch(error => console.error("Error loading map or data:", error));
}

function renderHistogram5yr() {
  d3.csv("data/species-listings-by-year-totals-report.csv", d3.autoType).then(data => {
    data = data.map(d => ({
      year: +d["Calendar Year"],
      listings: +d["Number of New Species Listings"]
    })).filter(d => !isNaN(d.year) && !isNaN(d.listings));

    const container = d3.select("#chart-hist");
    container.html("");

    container.append("h2")
      .attr("class", "chart-title")
      .text("Number of Species Added to the Endangered Species List");

      container.append("div")
      .attr("class", "chart-subtitle")
      .style("text-align", "left")
      .style("margin", "4px 0 12px 0")
      .style("font-size", "12px")
      .append("a")
      .attr("href", "https://data.virginia.gov/dataset/u-s-federal-endangered-and-threatened-species-by-calendar-year")
      .attr("target", "_blank")
      .attr("rel", "noopener noreferrer")
      .text("https://data.virginia.gov/dataset/u-s-federal-endangered-and-threatened-species-by-calendar-year");

    const margin = { top: 20, right: 20, bottom: 60, left: 70 };
    const chartElement = document.getElementById('chart-hist');
    const containerWidth = chartElement.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const minYear = d3.min(data, d => d.year);
    const maxYear = d3.max(data, d => d.year);
    const start = Math.floor(minYear / 5) * 5;
    const end = Math.floor(maxYear / 5) * 5 + 4;

    const bins = [];
    for (let s = start; s <= end; s += 5) bins.push({ start: s, end: s + 4, label: `${s}–${s + 4}`, total: 0 });

    data.forEach(d => {
      const i = Math.floor((d.year - start) / 5);
      if (i >= 0 && i < bins.length) bins[i].total += d.listings;
    });

    const x = d3.scaleBand()
      .domain(bins.map(b => b.label))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, b => b.total)]).nice()
      .range([height, 0]);

    svg.selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", d => x(d.label))
      .attr("y", d => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.total))
      .attr("fill", "#69b3a2");

    const xAxis = d3.axisBottom(x);
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .attr("transform", "rotate(0)")
      .style("text-anchor", "middle");

    const yAxis = d3.axisLeft(y).ticks(6);
    svg.append("g").call(yAxis);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Species");
  }).catch(error => {
    console.error("Error loading or processing data:", error);
  });
}


renderStackedArea();
renderHistogram5yr();
