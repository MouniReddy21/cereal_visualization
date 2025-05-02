# Interactive Cereal Nutrition Visualizer

This project is a browser-based interactive visualization system built with **D3.js** to explore the nutritional content of 77 breakfast cereals. Users can analyze cereal clusters, compare manufacturers, and examine nutritional trends based on shelf placement.

---

## Live Demo

👉 [View the live project](https://mounireddy21.github.io/cereal_visualization/)  

---

## 📁 Project Structure

<pre>
/ (root)
├── index.html # Home navigation page
├── clusters_nutritional_profile.html
├── compare_manufacturers.html
├── compare_shelves.html
├── style.css
│
├── js/
│ ├── cereal_clusters.js
│ ├── compare_manufacturers.js
│ ├── compare_shelves.js
│
├── data/
│ ├── cerealCluster/
│ │ ├── cereal_clustered_data.csv
│ │ └── cereal_dendrogram.json
│ ├── nutritional/
│ │ ├── cereal_manufacturer_summary.csv
│ │ └── nutrient_correlation_matrix.csv
│ └── shelf/
│ └── shelf_nutrition_summary.csv
</pre>
---

## Features

### Task 1: Cluster Nutritional Profiles
- PCA scatter plot, parallel coordinates plot, and dendrogram
- Interactive cluster toggles, search, tooltips, and data export

### Task 2: Compare Manufacturers
- Bar chart and boxplot by nutrient
- Correlation heatmap with click-to-highlight feature

### Task 3: Compare Shelves
- Radar chart to compare average nutrients across shelf levels
- Shelf toggle checkboxes and tooltip details

---

## Setup Locally

1. Clone the repo:
git clone https://github.com/MouniReddy21/cereal_visualization.git
cd cereal-visualization

2. Start a simple local server (Python 3):
python -m http.server

3. Open in browser:
http://localhost:8000/

---

