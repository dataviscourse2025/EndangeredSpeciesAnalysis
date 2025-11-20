// By Sydney Lundberg and Victoria Mache

/**
 * Creates a stacked area chart of endangered animal species (by class).
 * Loads the CSV, parses dates, coerces counts to numbers, filters invalid rows,
 * then draws the SVG with axes, labels, a legend, and ESA amendment markers.
 */
function renderStackedArea() {
  d3.csv("data/endangered_species.csv").then(data => {
    const container = d3.select("#chart");
    container.html("");

    // ESA clickable tooltip 
    const esaTooltip = container.append("div")
      .attr("class", "esa-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("padding", "8px 10px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
      .style("font-size", "16px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Title
    container.append("h2")
      .attr("class", "chart-title")
      .text("Number of Endangered Animal Species Per Class");

    // Subtitle
    container.append("div")
      .attr("class", "chart-subtitle")
      .style("margin", "2px 0 8px 0")
      .html(
        `Sources: 
        <a href="https://www.kaggle.com/datasets/chirayurijal/worldwildlifespeciesdata" target="_blank" rel="noopener noreferrer">
          World Wildlife Species Data
        </a> • 
        <a href="https://www.fws.gov/page/endangered-species-act-amendments" target="_blank" rel="noopener noreferrer">
          Endangered Species Act Amendments
        </a>`
      );

    // ESA annotations
    const amendmentData = [
      {
        year: 1978,
        date: new Date(1978, 0, 1),
        title: "1978 Amendments",
        text: [
          "Created a federal committee that can approve actions harming a species.",
          "Allowed economic factors in habitat decisions.",
          "Added Agriculture to federal conservation planning.",
          "Limited protected populations to vertebrates."
        ]
      },
      {
        year: 1982,
        date: new Date(1982, 0, 1),
        title: "1982 Amendments",
        text: [
          "Listing decisions must be based only on science, not economics.",
          "Final listing decisions required in 1 year.",
          "Allowed experimental populations and Habitat Conservation Plans.",
          "Added endangered plant protections."
        ]
      },
      {
        year: 1988,
        date: new Date(1988, 0, 1),
        title: "1988 Amendments",
        text: [
          "Required monitoring of candidate and recovered species.",
          "Strengthened recovery plans and 5-year monitoring after delisting.",
          "Required reports on recovery progress and spending.",
          "Expanded plant protections."
        ]
      },
      {
        year: 2004,
        date: new Date(2004, 0, 1),
        title: "2004 Amendments",
        text: [
          "Department of Defense is exempt from some critical habitat restrictions if it has an approved natural resources management plan."
        ]
      }
    ];

    // Parse dates 
    const parseDate = d3.timeParse("%-d %b %y");
    data.forEach(d => {
      d.date = parseDate(d.date);
      for (let key in d) {
        if (key !== "date") d[key] = +d[key] || 0;
      }
    });
    data = data.filter(d => d.date != null);

    const fullData = data;

    // Year range and window
    const minDate = d3.min(fullData, d => d.date);
    const maxDate = d3.max(fullData, d => d.date);
    const minYear = minDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    const windowSize = 10; 

    // Chart dims
    const margin = { top: 20, right: 160, bottom: 60, left: 70 };
    const chartElement = document.getElementById("chart");
    const containerWidth = chartElement.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // SVG
    const svg = container
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Slider and play controls
    const controls = container.append("div")
      .attr("class", "slider-controls");

    controls.append("label")
      .text("Timeline: 10-year window");

    const slider = controls.append("input")
      .attr("type", "range")
      .attr("min", minYear)
      .attr("max", maxYear - windowSize + 1)
      .attr("step", 1)
      .attr("value", minYear);

    const sliderValue = controls.append("span")
      .attr("class", "slider-value");

    const playButton = controls.append("button")
      .attr("type", "button")
      .attr("class", "play-button")
      .text("▶ Play");

    let isPlaying = false;
    let playInterval = null;

    // Data keys
    const keys = [
      "endangered_mammals",
      "endangered_birds",
      "endangered_reptiles",
      "endangered_fish",
      "endangered_snails",
      "endangered_clams",
      "endangered_crustaceans",
      "endangered_insects",
      "endangered_arachnids",
      "endangered_coral"
    ];

    const stack = d3.stack().keys(keys);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(keys)
      .range([
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#9467bd",
        "#8c564b",
        "#e377c2",
        "#7f7f7f",
        "#bcbd22",
        "#17becf",
        "#a55194"
      ]);

    const area = d3.area()
      .x(d => x(d.data.date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    const layersGroup = svg.append("g").attr("class", "layers");

    // Axis groups
    const xAxisGroup = svg.append("g")
      .attr("transform", `translate(0,${height})`);
    const yAxisGroup = svg.append("g");

    // Axis labels
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

    // Left border
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    // Legend
    const legend = svg.append("g").attr("class", "legend");
    const legendHeight = keys.length * 22;
    const legendX = width + 20;
    const legendY = (height - legendHeight) / 2;

    // small legend title
    legend.append("text")
      .attr("x", legendX + 10)
      .attr("y", legendY - 12)
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text("Class");

    const legendItems = legend.selectAll(".legend-item")
      .data(keys)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(${legendX}, ${legendY + i * 22})`)
      .style("cursor", "pointer");

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
        .replace(/^endangered_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase())
      );

    // ESA markers 
    const markerY = 10;
    const markersGroup = svg.append("g")
      .attr("class", "esa-markers");

    const markerLines = markersGroup.selectAll("line.esa-line")
      .data(amendmentData)
      .join("line")
      .attr("class", "esa-line")
      .attr("y1", markerY + 6)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.4);

    const markerCircles = markersGroup.selectAll("circle.esa-marker")
      .data(amendmentData)
      .join("circle")
      .attr("class", "esa-marker")
      .attr("cy", markerY)
      .attr("r", 6)
      .attr("fill", "black")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();

        const html = `
        <div style="font-weight:700; margin-bottom:6px;">
          ${d.title}
        </div>
        <ul style="margin:0 0 8px 18px; padding:0; font-size:14px; line-height:1.3;">
          ${d.text.map(t => `<li>${t}</li>`).join("")}
        </ul>
        <button class="esa-detail-btn" style="
          margin-top:4px;
          padding:4px 10px;
          border-radius:4px;
          border:1px solid #111;
          background:#111;
          color:white;
          font-size:13px;
          cursor:pointer;">
          See details
        </button>
        `;

        esaTooltip
          .html(html)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .style("opacity", 1);

        // Wire up the "See details" button:
        esaTooltip.select(".esa-detail-btn")
          .on("click", () => {
            // Smooth scroll to the histogram section
            const histEl = document.getElementById("chart-hist");
            if (histEl) {
              histEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            // Highlight the relevant 5-year bar AFTER the amendment year
            if (window.highlightHistogramForAmendment) {
              window.highlightHistogramForAmendment(d.year);
            }

            // Optionally hide the tooltip after clicking
            esaTooltip.style("opacity", 0);
          });
      });

    // Hide tooltip when clicking elsewhere
    d3.select(document).on("click.esa-tooltip", (event) => {
      const target = event.target;
      if (
        (target.classList && target.classList.contains("esa-marker")) ||
        (target.closest && target.closest(".esa-tooltip"))
      ) return;
      esaTooltip.style("opacity", 0);
    });

    // Store current window data if you want to reuse later
    let currentWindowData = [];

    function updateWindow(startYear) {
      const endYear = startYear + windowSize - 1;
      sliderValue.text(`${startYear}–${endYear}`);

      const startDate = new Date(startYear, 0, 1);
      const endDate = new Date(endYear, 11, 31);

      const windowData = fullData.filter(d => d.date >= startDate && d.date <= endDate);
      if (!windowData.length) return;
      currentWindowData = windowData;

      const layers = stack(windowData);

      x.domain(d3.extent(windowData, d => d.date));
      y.domain([0, d3.max(layers, layer => d3.max(layer, d => d[1]))]).nice();

      const paths = layersGroup.selectAll("path.layer")
        .data(layers, d => d.key);

      paths.join(
        enter => enter.append("path")
          .attr("class", "layer")
          .attr("fill", d => color(d.key))
          .attr("d", area),
        update => update.transition().duration(400).attr("d", area),
        exit => exit.remove()
      );

      const xAxis = d3.axisBottom(x)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"));

      // y-axis with subtle gridlines
      const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickSizeOuter(0);

      xAxisGroup.transition().duration(400).call(xAxis)
        .selectAll("text")
        .style("font-size", "11px");

      yAxisGroup.transition().duration(400).call(yAxis);

      // gridline + axis styling
      yAxisGroup.selectAll("line")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-opacity", 0.9);
      yAxisGroup.selectAll(".domain")
        .attr("stroke", "#9ca3af");

      xAxisGroup.selectAll("path")
        .attr("stroke", "#9ca3af");
      xAxisGroup.selectAll("line")
        .attr("stroke", "#9ca3af");

      // Re-position ESA markers 
      markerLines
        .attr("x1", d => x(d.date))
        .attr("x2", d => x(d.date));

      markerCircles
        .attr("cx", d => x(d.date));
    }

    slider.on("input", (event) => {
      const startYear = +event.target.value;
      updateWindow(startYear);
    });

    function startPlaying() {
      if (isPlaying) return;
      isPlaying = true;

      playButton
        .text(" Play")
        .classed("is-playing", true);

      playInterval = d3.interval(() => {
        let current = +slider.property("value");

        if (current >= maxYear - windowSize + 1) {
          current = minYear;
        } else {
          current += 1;
        }

        slider.property("value", current);
        updateWindow(current);
      }, 800);
    }

    function stopPlaying() {
      isPlaying = false;

      playButton
        .text(" Play")
        .classed("is-playing", false);

      if (playInterval) {
        playInterval.stop();
        playInterval = null;
      }
    }

    playButton.on("click", () => {
      if (isPlaying) {
        stopPlaying();
      } else {
        startPlaying();
      }
    });

    // CLICKABLE LEGEND TO TOGGLE LAYERS
    const activeKeys = new Set(keys);  // start with all layers visible

    legendItems.on("click", function (event, key) {
      if (activeKeys.has(key)) {
        activeKeys.delete(key);
      } else {
        activeKeys.add(key);
      }

      // Toggle highlight in legend
      legendItems.selectAll("rect")
        .attr("opacity", d => activeKeys.has(d) ? 1 : 0.3);

      legendItems.selectAll("text")
        .attr("opacity", d => activeKeys.has(d) ? 1 : 0.3);

      // Toggle the layers
      layersGroup.selectAll("path.layer")
        .attr("opacity", d => activeKeys.has(d.key) ? 1 : 0.05);
    });

    // initial window
    updateWindow(minYear);

  }).catch(error => {
    console.error("Error loading or processing data:", error);
  });
}


function renderHistogram5yr() {
  d3.csv("data/species-listings-by-year-totals-report.csv", d3.autoType).then(data => {
    data = data.map(d => ({
      year: +d["Calendar Year"],
      listings: +d["Number of New Species Listings"]
    })).filter(d => !isNaN(d.year) && !isNaN(d.listings));

    const container = d3.select("#chart-hist");
    container.html("");

    // Title
    container.append("h2")
      .attr("class", "chart-title")
      .text("Number of Species Added to the Endangered Species List");

    // Subtitle
    container.append("div")
      .attr("class", "chart-subtitle")
      .style("text-align", "left")
      .style("margin", "4px 0 12px 0")
      .html(
        `Source: 
        <a href="https://data.virginia.gov/dataset/u-s-federal-endangered-and-threatened-species-by-calendar-year" target="_blank" rel="noopener noreferrer">
          U.S. Federal Endangered and Threatened Species by Calendar Year
        </a>`
      );
      
    // Set the margin and width and height of the chart
    const margin = { top: 20, right: 20, bottom: 60, left: 70 };
    const chartElement = document.getElementById('chart-hist');
    const containerWidth = chartElement.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG element
    const svg = container
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create and populate the bins
    const minYear = d3.min(data, d => d.year);
    const maxYear = d3.max(data, d => d.year);
    const start = Math.floor(minYear / 5) * 5;
    const end = Math.floor(maxYear / 5) * 5 + 4;
    const bins = [];
    for (let s = start; s <= end; s += 5) {
      bins.push({ start: s, end: s + 4, label: `${s}–${s + 4}`, total: 0 });
    }

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

    // Create the bars
    const bars = svg.selectAll("rect")
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

    // The x-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Year");

    // The y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Species");

    // === GLOBAL HIGHLIGHT FUNCTION ===
    // Called from the stacked area "See details" button.
    // It highlights the *next* 5-year bin after the amendment year.
    window.highlightHistogramForAmendment = function(amendmentYear) {
      if (!bins.length) return;

      const firstStart = bins[0].start;
      // Bin that contains the amendment year:
      const binIndex = Math.floor((amendmentYear - firstStart) / 5);
      const nextIndex = binIndex + 1;

      // Reset all bars to default color
      bars.attr("fill", "#69b3a2");

      // Highlight the next bin, if it exists
      if (nextIndex >= 0 && nextIndex < bins.length) {
        bars
          .filter((d, i) => i === nextIndex)
          .attr("fill", "#ff7f0e");
      }
    };

  }).catch(error => {
    console.error("Error loading or processing data:", error);
  });
}

function renderUSMap() {
  const container = d3.select("#chart-map");
  container.html("");

  // Title
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

  const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1200);

  const path = d3.geoPath().projection(projection);

  Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.csv("data/endangered_by_state_2019.csv")
  ]).then(([us, csvData]) => {
    const normalize = str => str.trim().toLowerCase();

    const data = {};
    let maxVal = 0;

    csvData.forEach(d => {
      const key = normalize(d.State); 
      const val = +d["Endangered (Total) 2019"];
      if (!isNaN(val)) {
        data[key] = val;
        if (val > maxVal) maxVal = val;
      }
    });

    const color = d3.scaleLinear()
      .domain([0, 0.5 * maxVal, maxVal])
      .range(["#ffeeee", "#b30000", "#2b0000"]);

    const allStates = topojson.feature(us, us.objects.states).features;

    const usableStates = allStates.filter(f => {
      const key = normalize(f.properties.name || f.id);
      const hasData = Object.prototype.hasOwnProperty.call(data, key);
      return hasData;
    });

    svg.append("g")
      .selectAll("path")
      .data(usableStates)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", d => {
        const key = normalize(d.properties.name || d.id);
        return color(data[key]);  // guaranteed to exist because of filter
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        const key = normalize(d.properties.name || d.id);
        const stateName = d.properties.name || d.id;
        const value = data[key];

        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(
          `<strong>${stateName}</strong><br/>Endangered: ${value}`
        )
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");

        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(100).style("opacity", 0);
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
      });

    // Legend
    const legendWidth = 200;
    const legendHeight = 10;

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .join("stop")
      .attr("offset", d => `${d * 100}%`)
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

  }).catch(error =>
    console.error("Error loading map or data:", error)
  );
}

// Render charts
renderStackedArea();
renderHistogram5yr();
renderUSMap();
