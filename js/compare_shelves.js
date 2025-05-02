// Constants
const margin = { top: 50, right: 100, bottom: 50, left: 100 };
const width = 600 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const radarSvg = d3.select("#radar").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 100)
    .append("g")
    .attr("transform", `translate(${(width / 2) + margin.left}, ${(height / 2) + margin.top})`);

const radarLevels = 5; // Concentric circles
const color = d3.scaleOrdinal().domain([1, 2, 3]).range(["#FF6347", "#4682B4", "#32CD32"]);

// Tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("z-index", "10");

// Load Shelf Summary
d3.csv("data/shelf/shelf_nutrition_summary.csv").then(data => {
    const variables = ["Calories", "Protein", "Fat", "Sodium", "Fiber", "Carbohydrates", "Sugars", "Potassium"];

    const angleSlice = (2 * Math.PI) / variables.length;
    const radius = Math.min(width / 2, height / 2) - 50;

    const rScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(variables.map(v => +d[v])))])
        .range([0, radius]);

    // Draw grid
    for (let level = 0; level < radarLevels; level++) {
        const r = radius / radarLevels * (level + 1);
        radarSvg.append("circle")
            .attr("r", r)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-dasharray", "2,2");
    }

    // Draw axis lines and labels
    variables.forEach((v, i) => {
        const angle = i * angleSlice;
        const lineCoord = angleToCoordinate(angle, radius);
        const labelCoord = angleToCoordinate(angle, radius + 20);

        radarSvg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", lineCoord.x)
            .attr("y2", lineCoord.y)
            .attr("stroke", "black");

        radarSvg.append("text")
            .attr("x", labelCoord.x)
            .attr("y", labelCoord.y)
            .text(v)
            .style("font-size", "11px")
            .attr("text-anchor", "middle");
    });

    function angleToCoordinate(angle, value) {
        return { "x": Math.cos(angle - Math.PI / 2) * value, "y": Math.sin(angle - Math.PI / 2) * value };
    }

    function drawRadar(shelfData, shelf) {
        const line = d3.lineRadial()
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);

        const values = variables.map(v => ({ axis: v, value: +shelfData[v] }));

        radarSvg.append("path")
            .datum(values)
            .attr("d", line)
            .attr("fill", color(shelf))
            .attr("fill-opacity", 0.3)
            .attr("stroke", color(shelf))
            .attr("stroke-width", 2)
            .attr("class", `shelf-${shelf}`)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 0.6); // brighter

                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`<strong>Shelf ${shelf}</strong><br>` + values.map(v => `${v.axis}: ${v.value}`).join("<br>"))
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 0.3);

                tooltip.transition().duration(500).style("opacity", 0);
            });

    }

    // Initial draw all shelves
    data.forEach(d => drawRadar(d, d.Shelf));

    // Toggle Shelves
    d3.selectAll(".shelf-toggle").on("change", function () {
        const selectedShelves = Array.from(document.querySelectorAll(".shelf-toggle:checked")).map(d => +d.value);
        radarSvg.selectAll("path")
            .style("display", function () {
                const shelf = +this.classList.value.split("-")[1];
                return selectedShelves.includes(shelf) ? null : "none";
            });
    });

    // Add Legend
    const legend = radarSvg.append("g")
        .attr("transform", `translate(${-(width / 2)}, ${height / 2 + 20})`);

    const legendData = [1, 2, 3];
    legendData.forEach((shelf, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(shelf));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(`Shelf ${shelf}`)
            .attr("text-anchor", "start")
            .style("font-size", "12px");
    });
});
