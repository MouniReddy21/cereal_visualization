

function highlightCereal(cereal) {
  const cls = cereal.replace(/\s+/g, "_");
  d3.selectAll("." + cls).classed("highlight", true).raise();
}
function unhighlightCereal() {
  d3.selectAll(".highlight").classed("highlight", false);
}

const clusterMap = {};

console.log("Script Loaded---");

d3.csv("data/cerealCluster/cereal_clustered_data.csv").then(data => {
  console.log("CSV Loaded", data.length);

  // DATA CLEANING
  data.forEach(d => {
    d.PCA1 = +d.PCA1; d.PCA2 = +d.PCA2; d.Cluster = +d.Cluster;
    d.Calories = +d.Calories; d.Protein = +d.Protein; d.Fat = +d.Fat;
    d.Sodium = +d.Sodium; d.Fiber = +d.Fiber; d.Carbohydrates = +d.Carbohydrates;
    d.Sugars = +d.Sugars; d.Potassium = +d.Potassium;
  });

  data.forEach(d => clusterMap[d.Cereal] = d.Cluster);


  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
  const width = 700, height = 400;
  const margin = { top: 20, right: 40, bottom: 40, left: 50 };

  // === PCA Scatter Plot
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.PCA1)).nice().range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.PCA2)).nice().range([height - margin.bottom, margin.top]);
  const svg = d3.select("#scatter").append("svg").attr("width", width).attr("height", height);
  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  const points = svg.selectAll("circle").data(data).enter().append("circle")
    .attr("cx", d => x(d.PCA1)).attr("cy", d => y(d.PCA2)).attr("r", 6)
    .attr("fill", d => color(d.Cluster))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`<strong>${d.Cereal}</strong><br>Calories: ${d.Calories}<br>Protein: ${d.Protein}g<br>Sugar: ${d.Sugars}g<br>Cluster: ${d.Cluster}`)
        .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    }).on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

  // === Parallel Coordinates Plot
  const nutrients = ["Calories", "Protein", "Fat", "Sodium", "Fiber", "Carbohydrates", "Sugars", "Potassium"];
  const pcMargin = { top: 40, right: 10, bottom: 10, left: 10 },
    pcWidth = 900 - pcMargin.left - pcMargin.right,
    pcHeight = 400 - pcMargin.top - pcMargin.bottom;

  const pcSvg = d3.select("#parallel").append("svg")
    .attr("width", pcWidth + pcMargin.left + pcMargin.right)
    .attr("height", pcHeight + pcMargin.top + pcMargin.bottom)
    .append("g")
    .attr("transform", `translate(${pcMargin.left},${pcMargin.top})`);

  const yScales = {};
  nutrients.forEach(n => {
    yScales[n] = d3.scaleLinear().domain(d3.extent(data, d => +d[n])).range([pcHeight, 0]);
  });

  const xScale = d3.scalePoint().range([0, pcWidth]).padding(1).domain(nutrients);
  const line = d3.line();
  function path(d) {
    return line(nutrients.map(p => [xScale(p), yScales[p](d[p])]));
  }

  const lines = pcSvg.selectAll(".pc-line").data(data).enter().append("path")
    .attr("class", "pc-line")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", d => color(d.Cluster))
    .style("stroke-width", 1)
    .style("opacity", 0.4);

  console.log("Nutrient data check:", data[0]);
  console.log("Drawing Parallel Lines:", data.length, "items");


  const axisGroup = pcSvg.selectAll(".dimension").data(nutrients).enter().append("g")
    .attr("class", "dimension")
    .attr("transform", d => `translate(${xScale(d)})`);

  axisGroup.each(function (d) {
    d3.select(this).call(d3.axisLeft(yScales[d]));
  });

  axisGroup.append("text")
    .attr("y", -9)
    .style("text-anchor", "middle")
    .text(d => d)
    .style("fill", "#333");

  // === Filter Logic (applies to both PCA + PC)
  function updateFilters() {
    const proteinMin = +document.getElementById("proteinSlider").value;
    const sugarMax = +document.getElementById("sugarSlider").value;

    document.getElementById("proteinVal").textContent = proteinMin;
    document.getElementById("sugarVal").textContent = sugarMax;

    points.attr("display", d => (d.Protein >= proteinMin && d.Sugars <= sugarMax) ? null : "none");
    lines.attr("display", d => (d.Protein >= proteinMin && d.Sugars <= sugarMax) ? null : "none");
  }

  d3.select("#proteinSlider").on("input", updateFilters);
  d3.select("#sugarSlider").on("input", updateFilters);

  // === Export Filtered Cereals to CSV
  d3.select("#exportBtn").on("click", () => {
    const visibleData = data.filter(d =>
      d3.select(`circle[cx='${x(d.PCA1)}']`).attr("display") !== "none"
    );
    const csvContent = d3.csvFormat(visibleData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "filtered_cereals.csv"; a.click(); URL.revokeObjectURL(url);
  });

  updateFilters(); // apply initial filter on load

  // 1. LEGEND TOGGLE by Cluster
  const clusterSet = new Set(data.map(d => d.Cluster));
  const legend = d3.select("#scatter svg").selectAll(".legend")
    .data(clusterSet)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 20})`)
    .style("cursor", "pointer");

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", d => color(d));

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(d => "Cluster " + d);

  let activeClusters = new Set(clusterSet);
  legend.on("click", (event, cluster) => {
    if (activeClusters.has(cluster)) {
      activeClusters.delete(cluster);
    } else {
      activeClusters.add(cluster);
    }
    points.attr("display", d => activeClusters.has(d.Cluster) ? null : "none");
    lines.attr("display", d => activeClusters.has(d.Cluster) ? null : "none");

    // Also apply toggle to dendrogram nodes
    d3.selectAll(".node").attr("display", function () {
      const classes = this.className.baseVal.split(" ");
      const clusterClass = classes.find(cls => cls.startsWith("cluster-"));
      if (!clusterClass) return null;
      const clusterNum = +clusterClass.split("-")[1];
      return activeClusters.has(clusterNum) ? null : "none";
    });
  });



  // Modify PCA + PCP Hover:
  points.on("mouseover", (event, d) => {
    tooltip.transition().duration(200).style("opacity", .9);
    tooltip.html(`<strong>${d.Cereal}</strong><br>Calories: ${d.Calories}<br>Protein: ${d.Protein}g<br>Sugar: ${d.Sugars}g<br>Cluster: ${d.Cluster}`)
      .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    highlightCereal(d.Cereal);
  }).on("mouseout", () => {
    tooltip.transition().duration(500).style("opacity", 0);
    unhighlightCereal();
  });

  lines.attr("class", d => "pc-line " + d.Cereal.replace(/\s+/g, "_"));

  // 3. SEARCH BOX TO JUMP TO CEREAL
  const searchBox = d3.select("body").insert("div", ":first-child").attr("id", "search-box");
  searchBox.append("label").text("Search cereal: ");
  const searchInput = searchBox.append("input").attr("type", "text").attr("id", "searchInput");

  searchInput.on("input", () => {
    const val = searchInput.node().value.toLowerCase();
    if (!val) return unhighlightCereal();

    const match = data.find(d => d.Cereal.toLowerCase().includes(val));
    if (match) {
      highlightCereal(match.Cereal);

      // Scroll to cereal node in dendrogram
      const target = document.querySelector("." + match.Cereal.replace(/\s+/g, "_"));
      if (target) {
        const bbox = target.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + bbox.top - window.innerHeight / 2,
          behavior: "smooth"
        });
      }
    }
  });

  d3.json("data/cerealCluster/cereal_dendrogram.json").then(treeData => {
    const width = 960, height = 600;

    const svg = d3.select("#dendrogram").append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g").attr("transform", "translate(40,0)");

    const root = d3.hierarchy(treeData);
    function injectCluster(node) {
      if (!node.children) {
        node.Cluster = clusterMap[node.name];
      } else {
        node.children.forEach(injectCluster);
      }
    }
    injectCluster(treeData);

    const cluster = d3.cluster().size([height, width - 160]);  //160
    cluster(root);

    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      );

    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => {
        const nameClass = d.data.name.replace(/\s+/g, "_");
        const clusterClass = d.data.Cluster !== undefined ? `cluster-${d.data.Cluster}` : "";
        return `node ${nameClass} ${clusterClass}`;
      })
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("mouseover", (event, d) => highlightCereal(d.data.name))
      .on("mouseout", unhighlightCereal);

    node.append("circle")
      .attr("r", 3)
      .attr("fill", d => d.children ? "#555" : "#999");

    node.append("text")
      .attr("dy", 3)
      .attr("x", d => d.children ? -8 : 10)
      .style("text-anchor", d => d.children ? "end" : "start")
      .style("font-size", "11px")
      .text(d => d.data.name);
  }).catch(error => {
    console.error("Error loading JSON:", error);
  });
  // === MULTI-VIEW TOGGLE CHECKBOX HANDLER
  document.querySelectorAll(".plot-toggle").forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = Array.from(document.querySelectorAll(".plot-toggle:checked")).map(c => c.value);
      ["scatter", "parallel", "dendrogram"].forEach(id => {
        document.getElementById(id).style.display = selected.includes(id) ? "block" : "none";
      });
    });
  });

}).catch(error => {
  console.error("Error loading CSV:", error);
});



