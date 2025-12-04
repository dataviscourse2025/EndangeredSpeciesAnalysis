# Endangered Species Visualizations  
_By Sydney Lundberg and Victoria Mache_

## Overview

This project is an interactive, browser-based dashboard that explores endangered species in the United States over time and across space. It consists of three linked visualizations built with D3:

1. **Stacked Area Chart** – Number of endangered animal species per class over time with ESA amendment annotations.
2. **Histogram** – Number of new species added to the endangered list in 5-year bins.
3. **Choropleth Map** – Endangered species counts by U.S. state (2019) plus detailed state profiles.

All custom logic for loading data, transforming it, and rendering these visualizations is implemented in JavaScript using D3.


## Project URLs

**Project website:**  
https://dataviscourse2025.github.io/EndangeredSpeciesAnalysis/

**Screencast videos:**  
https://www.youtube.com/watch?v=618dvYIEuB4


## Files and Code Ownership

### Our Code

These parts of the project were written by us:

### **HTML (index.html)**
- Contains containers for:
  - `#chart` (stacked area chart)
  - `#chart-hist` (histogram)
  - `#chart-map` (choropleth map)
  - `#state-detail` (map detail overlay)
- Loads D3, TopoJSON, and our custom script.

### **CSS (style.css)**
- Styles for:
  - Titles, subtitles, tooltips
  - Slider controls and play button
  - Map overlays and legend
- Handles chart layout and spacing.

### **JavaScript (script.js)**  
Contains three major visualization functions:


### **1. renderStackedArea()**
Creates a stacked area chart showing endangered species by class over time.

Features:
- Loads and parses CSV data.
- Uses a **10-year sliding window** controlled by a range slider.
- Smooth **Play/Pause animation** that morphs the stacked layers over time.
- Clickable **ESA amendment markers** (1978, 1982, 1988, 2004):
  - Display a tooltip with bullet-point explanations.
  - Includes a button that scrolls to the histogram and highlights the relevant 5-year bin.
- Legend that toggles individual animal classes.


### **2. renderHistogram5yr()**
Shows how many species were added to the endangered list in 5-year intervals.

Features:
- Loads listing data and bins it automatically.
- Bar chart with axes and labels.
- Global function `window.highlightListingBin(startYear)`:
  - Highlights the correct 5-year bin when invoked from ESA tooltip interactions.


### **3. renderUSMap()**
An interactive choropleth map showing endangered species counts by U.S. state for 2019.

Features:
- Loads TopoJSON and CSV data.
- Renders each state with a linear green color scale.
- Displays a **Top 5 states** summary above the map.
- Hover tooltip shows:
  - Rank
  - Endangered species count
  - Percentage of U.S. total
  - Qualitative category (“Low” → “Very High”)
- **Double-click** opens a full-screen overlay with:
  - State profile details
  - A **mini top-10 bar chart** highlighting the selected state
- Overlay closes via a button or clicking outside the card.
- Includes a gradient legend.


## Data Files Used

These datasets were not written by us:

- `data/endangered_species.csv`  
  Time-series species counts by class (from Kaggle).

- `data/species-listings-by-year-totals-report.csv`  
  Annual counts of new endangered species listings (Virginia open data portal).

We only cleaned, merged, and used these inputs — we did not generate these data sets.

- `data/endangered_by_state_2019.csv`  
  State-level endangered species counts for 2019.

We generated this dataset with an LLM by incorporating outside knowledge of general species trends in each state in order to get a valid spacial distribution of the data.


## External Libraries that we Used

We rely on the following external libraries via CDN:

- **D3.js (v7)**
- **TopoJSON client**
- **US Atlas Topology (`us-atlas@3`)**

We do not modify these libraries.


## Non-Obvious Features in the Interface

### **Stacked Area Chart**
- 10-year sliding window updates automatically when the slider or Play button is used.
- Play mode animates smoothly, advancing one year at a time.
- ESA amendment markers:
  - Open detailed tooltips.
  - Include a button that scrolls to the histogram and highlights the related 5-year listing period.
- Interactive legend, allowing users to click items to hide or show specific species classes and focus on selected layers

### **Histogram**
- Bins all listing data into **5-year intervals** dynamically.
- Responds to ESA tooltip interactions by highlighting the bin associated with the amendment.

### **Choropleth Map**
- Hover:
  - Shows tooltip with rank, percentage of national total, and threat level.
- Double-click:
  - Opens a full-screen state detail card.
  - Displays a mini ranking chart of top 10 states.
- Includes a fixed color legend and a Top 5 summary above the map.
