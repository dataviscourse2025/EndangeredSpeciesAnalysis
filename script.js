d3.csv("data/endangered_species.csv").then(data => {
  console.log("Loaded data:", data);

  const tbody = d3.select("#data-table tbody");
  data.slice(0, 10).forEach(d => {
    const row = tbody.append("tr");
    row.append("td").text(d.Species);
    row.append("td").text(d.Region);
    row.append("td").text(d.Status);
  });

  const regionCounts = d3.rollups(
    data,
    v => v.length,
    d => d.Region
  );

  const width = 600, height = 400;
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(regionCounts.map(d => d[0]))
    .range([50, width - 20])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(regionCounts, d => d[1])])
    .nice()
    .range([height - 50, 20]);

  svg.selectAll("rect")
    .data(regionCounts)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - 50 - y(d[1]))
    .attr("fill", "#006d77");

  svg.append("g")
    .attr("transform", `translate(0,${height - 50})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", "translate(50,0)")
    .call(d3.axisLeft(y));
});
