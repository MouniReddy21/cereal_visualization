// Constants
const margin = { top: 20, right: 30, bottom: 70, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// SVGs
const barChartSvg = d3.select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const boxplotSvg = d3.select("#boxplot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const heatmapSvg = d3.select("#heatmap").append("svg")
    .attr("width", 500)
    .attr("height", 500)
    .append("g")
    .attr("transform", "translate(50,50)");

// Load manufacturer data
d3.csv("data/nutritional/cereal_manufacturer_summary.csv").then(data => {
    const nutrients = ["Sugars_mean", "Fiber_mean", "Sodium_mean", "Protein_mean", "Potassium_mean", "Calories_mean", "Carbohydrates_mean", "Fat_mean"];
    const nutrientLabels = {
        Sugars_mean: "Sugars",
        Fiber_mean: "Fiber",
        Sodium_mean: "Sodium",
        Protein_mean: "Protein",
        Potassium_mean: "Potassium",
        Calories_mean: "Calories",
        Carbohydrates_mean: "Carbohydrates",
        Fat_mean: "Fat"
    };

    const select = d3.select("#nutrientSelect");
    nutrients.forEach(n => {
        select.append("option").attr("value", n).text(nutrientLabels[n]);
    });

    select.on("change", updateVisuals);

    function updateVisuals() {
        const selectedNutrient = select.property("value");

        const x = d3.scaleBand()
            .range([0, width])
            .domain(data.map(d => d.Manufacturer))
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[selectedNutrient]) * 1.2])
            .range([height, 0]);

        // --- Bar Chart
        barChartSvg.selectAll("*").remove();
        barChartSvg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .style("text-anchor", "end");

        barChartSvg.append("g").call(d3.axisLeft(y));

        barChartSvg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.Manufacturer))
            .attr("y", d => y(d[selectedNutrient]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d[selectedNutrient]))
            .attr("fill", "orange")
            .append("title")
            .text(d => `${d.Manufacturer}: ${(+d[selectedNutrient]).toFixed(2)}`);

        // Numbers on bars
        barChartSvg.selectAll("text.bar")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "bar")
            .attr("x", d => x(d.Manufacturer) + x.bandwidth() / 2)
            .attr("y", d => y(d[selectedNutrient]) - 5)
            .attr("text-anchor", "middle")
            .text(d => (+d[selectedNutrient]).toFixed(1))
            .style("font-size", "10px");

        // --- Boxplot
        boxplotSvg.selectAll("*").remove();

        boxplotSvg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .style("text-anchor", "end");

        boxplotSvg.append("g").call(d3.axisLeft(y));

        // Tooltip div
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "6px")
            .style("border-radius", "4px")
            .style("font-size", "12px");

        // Draw boxplots
        data.forEach(d => {
            const mean = +d[selectedNutrient];
            const min = mean * 0.8;
            const q1 = mean * 0.9;
            const median = mean;
            const q3 = mean * 1.1;
            const max = mean * 1.2;
            const center = x(d.Manufacturer) + x.bandwidth() / 2;
            const boxWidth = x.bandwidth() * 0.5;

            // Whiskers
            boxplotSvg.append("line")
                .attr("x1", center)
                .attr("x2", center)
                .attr("y1", y(min))
                .attr("y2", y(max))
                .attr("stroke", "black");

            // Box
            boxplotSvg.append("rect")
                .attr("x", center - boxWidth / 2)
                .attr("y", y(q3))
                .attr("width", boxWidth)
                .attr("height", y(q1) - y(q3))
                .attr("stroke", "black")
                .attr("fill", "lightblue")
                .on("mouseover", (event) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(
                        `<strong>${d.Manufacturer}</strong><br/>
        Min: ${min.toFixed(1)}<br/>
        Q1: ${q1.toFixed(1)}<br/>
        Median: ${median.toFixed(1)}<br/>
        Q3: ${q3.toFixed(1)}<br/>
        Max: ${max.toFixed(1)}`
                    )
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

            // Median line
            boxplotSvg.append("line")
                .attr("x1", center - boxWidth / 2)
                .attr("x2", center + boxWidth / 2)
                .attr("y1", y(median))
                .attr("y2", y(median))
                .attr("stroke", "black")
                .attr("stroke-width", 2);
        });

    }

    updateVisuals();
});

// Load heatmap
d3.csv("data/nutritional/nutrient_correlation_matrix.csv").then(raw => {
    const nutrients = Object.keys(raw[0]).filter(d => d !== "");
    const matrix = [];
    raw.forEach(row => {
        const r = [];
        nutrients.forEach(n => {
            r.push(+row[n]);
        });
        matrix.push(r);
    });

    const x = d3.scaleBand().domain(nutrients).range([0, 400]);
    const y = d3.scaleBand().domain(nutrients).range([0, 400]);
    const color = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

    const cells = heatmapSvg.selectAll()
        .data(nutrients.flatMap((n1, i) => nutrients.map((n2, j) => ({ x: n1, y: n2, value: matrix[i][j] }))))
        .enter()
        .append("g");

    cells.append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => color(d.value))
        .on("click", (event, d) => highlightCorrelation(d.x));

    cells.append("text")
        .attr("x", d => x(d.x) + x.bandwidth() / 2)
        .attr("y", d => y(d.y) + y.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "10px")
        .style("fill", "#000")
        .text(d => d.value.toFixed(2));

    heatmapSvg.append("g")
        .call(d3.axisTop(x).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", "rotate(-45)");

    heatmapSvg.append("g")
        .call(d3.axisLeft(y).tickSize(0));

    heatmapSvg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        .text("Correlation Heatmap of Nutrients");

    function highlightCorrelation(selected) {
        cells.selectAll("rect")
            .style("stroke", d => (d.x === selected || d.y === selected) ? "black" : "none")
            .style("stroke-width", d => (d.x === selected || d.y === selected) ? 2 : 0);
    }
});
