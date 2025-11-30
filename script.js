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
          Wildlife Species Data
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
      .attr("aria-pressed", "false")
      .attr("title", "Play timeline");

    // label span inside the button so we can update text without replacing pseudo-icon
    playButton.append("span")
      .attr("class", "play-label")
      .text("Play");

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
    // compute global max once so y-axis stays fixed
    const allLayersGlobal = stack(fullData);
    const globalMaxY = d3.max(allLayersGlobal, layer =>
      d3.max(layer, d => d[1])
    );

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]).domain([0, globalMaxY]).nice();

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

    // ESA marker lines
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

    // ESA marker circles with click tooltip
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
          <div style="font-weight:700; margin-bottom:6px;">${d.title}</div>
          <ul style="margin:0 0 6px 18px; padding:0; font-size:14px; line-height:1.3;">
            ${d.text.map(t => `<li>${t}</li>`).join("")}
          </ul>
    
          <button class="esa-detail-btn"
            style="margin-top:4px; padding:4px 10px; border-radius:4px;
                   border:1px solid #111; background:#111; color:#fff;
                   font-size:13px; cursor:pointer;">
            See Legislative Effect on Number of New Species Added
          </button>
        `;
    
        esaTooltip.html(html)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .style("opacity", 1);
    
        esaTooltip.select(".esa-detail-btn").on("click", () => {
          esaTooltip.style("opacity", 0);

          // scroll to histogram container
          const histEl = document.getElementById("chart-hist");
          if (histEl) {
            histEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }

          // determine start of the next 5-year bin
          const nextStart = Math.ceil(d.year / 5) * 5;

          // ask histogram to highlight that bin (if function is defined)
          if (window.highlightListingBin) {
            window.highlightListingBin(nextStart);
          }
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

    // Function to update chart for a given window start year
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

      const paths = layersGroup.selectAll("path.layer")
        .data(layers, d => d.key);

      paths.join(
        enter => enter.append("path")
          .attr("class", "layer")
          .attr("fill", d => color(d.key))
          .attr("d", area),
          update => update.transition().duration(700).ease(d3.easeCubicInOut).attr("d", area)
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
        .classed("is-playing", true)
        .attr("aria-pressed", "true");
      playButton.select("span.play-label").text("Pause");

      // Smoothly animate the window by interpolating the start year
      // and updating the chart on every animation frame. This replaces
      // the previous interval-based jumpy updates.
      function animateStep(startYear) {
        const duration = 800;
        const interp = d3.interpolateNumber(startYear, startYear + 1);

        const t = d3.transition()
          .duration(duration)
          .ease(d3.easeLinear);

        t.tween("window", () => {
          return u => {
            const currYear = interp(u);
            // compute fractional start/end dates
            const startDate = new Date(currYear, 0, 1);
            const endDate = new Date(currYear + windowSize - 1, 11, 31);

            const windowData = fullData.filter(d => d.date >= startDate && d.date <= endDate);
            if (!windowData.length) return;

            const layers = stack(windowData);

            x.domain(d3.extent(windowData, d => d.date));

            // update paths directly each tick for a smooth frame-by-frame morph
            const paths = layersGroup.selectAll("path.layer").data(layers, d => d.key);

            paths.join(
              enter => enter.append("path")
                .attr("class", "layer")
                .attr("fill", d => color(d.key))
                .attr("d", area),
              update => update.attr("d", area),
              exit => exit.remove()
            );

            // update axes without separate transitions to keep in sync
            const xAxis = d3.axisBottom(x)
              .ticks(d3.timeYear.every(1))
              .tickFormat(d3.timeFormat("%Y"));

            const yAxis = d3.axisLeft(y)
              .ticks(5)
              .tickSize(-width)
              .tickSizeOuter(0);

            xAxisGroup.call(xAxis)
              .selectAll("text")
              .style("font-size", "11px");

            yAxisGroup.call(yAxis);
            yAxisGroup.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-opacity", 0.9);
            yAxisGroup.selectAll(".domain").attr("stroke", "#9ca3af");
            xAxisGroup.selectAll("path").attr("stroke", "#9ca3af");
            xAxisGroup.selectAll("line").attr("stroke", "#9ca3af");

            // Re-position ESA markers
            markerLines.attr("x1", d => x(d.date)).attr("x2", d => x(d.date));
            markerCircles.attr("cx", d => x(d.date));

            // update the displayed slider value (rounded)
            const dispYear = Math.round(currYear);
            sliderValue.text(`${dispYear}–${dispYear + windowSize - 1}`);
          };
        });

        // when transition ends, move to next year and continue if still playing
        t.on("end", () => {
          let next = +slider.property("value") + 1;
          if (next > maxYear - windowSize + 1) next = minYear;
          slider.property("value", next);
          // call updateWindow once to ensure final exact frame
          updateWindow(next);
          if (isPlaying) animateStep(next);
        });
      }

      // start the first step
      animateStep(+slider.property("value"));
    }

    function stopPlaying() {
      isPlaying = false;

      playButton
        .classed("is-playing", false)
        .attr("aria-pressed", "false");
      playButton.select("span.play-label").text("Play");

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

    const activeKeys = new Set(keys);  // start with all layers visible

    // Toggle layers on legend click
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


/**
 * Creates a histogram of new species listings in 5-year bins. Connects to ESA amendments using 
 * global function to highlight bins.
 */
 
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

    // Global function so ESA see impact can highlight a bin
    window.highlightListingBin = function(targetStartYear) {
      // Reset all bars
      bars
        .attr("fill", "#69b3a2")
        .attr("opacity", 1);

      // Highlight the bin whose start year matches
      bars
        .filter(d => d.start === targetStartYear)
        .attr("fill", "#ff7f0e")   // highlight color
        .attr("opacity", 1);
    };

  }).catch(error => {
    console.error("Error loading or processing data:", error);
  });
}

/**
 * Renders a US map showing endangered species counts by state for 2019.
 * Loads GeoJSON and CSV data, merges them, and creates an interactive choropleth map.
 */
function renderUSMap() {
  const container = d3.select("#chart-map");
  container.html("");

  // Title
  container.append("h2")
    .attr("class", "chart-title")
    .text("US Endangered Species by State (2019)");

  // Top 5 summary block (above map, inside chart card)
  const summary = container.append("div")
    .attr("id", "top-states-summary");

  const width = 960;
  const height = 600;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = container.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

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

    const totalNational = d3.sum(Object.values(data));

    // Build ranking
    const sortedStates = csvData
      .map(d => [d.State, +d["Endangered (Total) 2019"]])
      .sort((a, b) => b[1] - a[1]);

    const ranks = {};
    sortedStates.forEach(([name, count], i) => {
      ranks[normalize(name)] = i + 1;
    });

    // Top 5 summary HTML
    const top5 = sortedStates
      .slice(0, 5)
      .map(([name, count], i) => `<strong>${i + 1}.</strong> ${name} — ${count} species`)
      .join("<br>");

    summary.html(`
      <strong>Top 5 States With the Most Endangered Species (2019)</strong><br>
      ${top5}
    `);

    const color = d3.scaleLinear()
      .domain([0, 0.5 * maxVal, maxVal])
      .range(["#d2efd2", "#4fa84f", "#145214"]);

    const allStates = topojson.feature(us, us.objects.states).features;

    const usableStates = allStates.filter(f => {
      const key = normalize(f.properties.name || f.id);
      return Object.prototype.hasOwnProperty.call(data, key);
    });

    const statesGroup = svg.append("g");

    statesGroup.selectAll("path")
      .data(usableStates)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", d => {
        const key = normalize(d.properties.name || d.id);
        return color(data[key]);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        const key = normalize(d.properties.name || d.id);
        const stateName = d.properties.name || d.id;
        const value = data[key] || 0;
        const rank = ranks[key] || "N/A";
        const pct = totalNational ? ((value / totalNational) * 100).toFixed(1) : "0.0";

        let category = "Low";
        if (value > 150) category = "Very High";
        else if (value > 80) category = "High";
        else if (value > 40) category = "Moderate";

        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${stateName}</strong><br>
            Rank: #${rank} nationally<br>
            Endangered species: ${value}<br>
            ${pct}% of U.S. total<br>
            Level: <strong>${category}</strong>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");

        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
      })
      .on("dblclick", function (event, d) {
        const key = normalize(d.properties.name || d.id);
        const stateName = d.properties.name || d.id;
        const value = data[key] || 0;
        const rank = ranks[key] || "N/A";
        const pct = totalNational ? ((value / totalNational) * 100).toFixed(1) : "0.0";

        let category = "Low";
        if (value > 150) category = "Very High";
        else if (value > 80) category = "High";
        else if (value > 40) category = "Moderate";

        const overlay = d3.select("#state-detail");
        overlay
          .style("display", "flex")
          .html(`
            <div class="state-detail-card">
              <h3>${stateName} — State Profile</h3>
              <div class="stat-row"><strong>Rank:</strong> #${rank} nationally</div>
              <div class="stat-row"><strong>Endangered species (2019):</strong> ${value}</div>
              <div class="stat-row"><strong>Share of U.S. total:</strong> ${pct}%</div>
              <div class="stat-row"><strong>Level:</strong> ${category}</div>

              <div class="state-mini-chart-title">
                Top 10 states by endangered species (2019)
              </div>
              <div id="state-mini-chart"></div>

              <button class="state-detail-close">Back to map</button>
            </div>
          `);

        // Build mini horizontal bar chart inside overlay
        const miniData = sortedStates.slice(0, 10);
        const miniWidth = 420;
        const miniHeight = 230;
        const miniMargin = { top: 10, right: 20, bottom: 20, left: 130 };

        const xMini = d3.scaleLinear()
          .domain([0, d3.max(miniData, d => d[1])])
          .nice()
          .range([miniMargin.left, miniWidth - miniMargin.right]);

        const yMini = d3.scaleBand()
          .domain(miniData.map(d => d[0]))
          .range([miniMargin.top, miniHeight - miniMargin.bottom])
          .padding(0.15);

        const svgMini = d3.select("#state-mini-chart")
          .append("svg")
          .attr("width", miniWidth)
          .attr("height", miniHeight);

        svgMini.selectAll("rect")
          .data(miniData)
          .join("rect")
          .attr("x", xMini(0))
          .attr("y", d => yMini(d[0]))
          .attr("height", yMini.bandwidth())
          .attr("width", d => xMini(d[1]) - xMini(0))
          .attr("fill", d => d[0] === stateName ? "#b30000" : "#d1d5db");

        svgMini.append("g")
          .attr("transform", `translate(${xMini(0)},0)`)
          .call(d3.axisLeft(yMini).tickSize(0))
          .selectAll("text")
          .style("font-size", "11px")
          .attr("dy", "0.35em");

        // Close handlers
        overlay.select(".state-detail-close").on("click", () => {
          overlay.style("display", "none");
        });

        overlay.on("click", (evt) => {
          if (evt.target === overlay.node()) {
            overlay.style("display", "none");
          }
        });
      });

    // Color legend
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
