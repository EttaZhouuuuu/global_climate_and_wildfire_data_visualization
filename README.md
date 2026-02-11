# Global Climate and Wildfire Data Visualization

Course project website for:
- STATS 401: Data Acquisition and Visualization
- Duke Kunshan University
- Group 10: Ziyue Yin, Xin Jiang, Yitong Zhou

## TL;DR

Simply access [https://ettazhouuuuu.github.io/global_climate_and_wildfire_data_visualization/](https://ettazhouuuuu.github.io/global_climate_and_wildfire_data_visualization/) to view the visualization via web!

## Project Overview

This repository contains an interactive website that explores global climate indicators and wildfire detections across multiple coordinated visualizations.

Current pages:
- `website/intro.html`: project introduction, data overview, visualization guide
- `website/vis1.html`: annual wildfire detections by type with climate trend overlays
- `website/vis2.html`: global wildfire map + rotating globe with year/month/day playback
- `website/vis3.html`: country-level bubble plot (CO2 vs temperature change, bubble size by population)
- `website/vis4.html`: Climate-Wildfire Correlation Matrix - analyzes relationships between climate factors and wildfire types
- `website/vis5.html`: Nightingale Rose Diagram - Global Wildfire Count by Year
- `website/vis6.html`: Wildfire Tweet Word Cloud - California wildfire sentiment analysis from social media

## Repository Structure

- `website/`: HTML/CSS/JS for the website
- `website/js/vis1.js`: logic for Visualization 1
- `website/js/vis2.js`: logic for Visualization 2
- `website/js/vis3.js`: logic for Visualization 3
- `website/js/vis4.js`: logic for Visualization 4 (Correlation Matrix)
- `website/js/vis5.js`: logic for Visualization 5 (Nightingale Rose)
- `website/js/vis6.js`: logic for Visualization 6 (Word Cloud)
- `data/`: raw and preprocessed data files
- `data/DisasterTweets.csv`: Kaggle disaster tweets dataset for vis6 word cloud
- `data/wildfire_wordcloud_data.csv`: processed wildfire-specific word cloud data

## Data Used by Each Visualization

- Visualization 1 (`vis1`)
  - `data/preprocessed/wildfire_count_by_year_type.csv`
  - `data/preprocessed/global_co2_by_year.csv`
  - `data/preprocessed/global_tem_by_year.csv`
  - `data/preprocessed/global_precip_by_year.csv`

- Visualization 2 (`vis2`)
  - `data/preprocessed/vis2/fire_points_YYYY.csv`
  - `data/preprocessed/vis2/sample_summary.csv`
  - `data/preprocessed/wildfire_count_by_year_type.csv`

- Visualization 3 (`vis3`)
  - `data/co2/owid-co2-data.csv`
  - `data/preprocessed/vis3/country_to_region.csv`

- Visualization 4 (`vis4`) - Climate-Wildfire Correlation Matrix
  - `data/preprocessed/wildfire_count_by_year_type.csv`: wildfire counts by type (vegetation, volcano, static, offshore)
  - `data/preprocessed/global_co2_by_year.csv`: global CO2 emissions data
  - `data/preprocessed/global_tem_by_year.csv`: global temperature anomaly data
  - `data/preprocessed/global_precip_by_year.csv`: global precipitation data

  **Features:**
  - 7×7 heatmap showing Pearson correlation coefficients between climate factors and wildfire types
  - Color scale: blue (negative correlation) → white (no correlation) → red (positive correlation)
  - Interactive year range selector (2012-2025) to filter data
  - Animation feature to visualize how correlations change over time
  - Speed control for animation playback
  - Tooltips showing correlation values, data points, and year range
  - Automatic insights panel highlighting strongest positive/negative correlations
  - Divider lines separating climate factors from wildfire types

- Visualization 5 (`vis5`) - Nightingale Rose Diagram
  - `data/preprocessed/wildfire_count_by_year_type.csv`: aggregated wildfire counts by year and type

  **Features:**
  - Polar area diagram (Nightingale Rose Chart) showing global wildfire counts by year
  - Each segment represents a year, with area proportional to total wildfire count
  - Color-coded segments based on wildfire type (vegetation, volcano, static, offshore)
  - Interactive hover effects with tooltips showing year, total count, and breakdown by type
  - Displays trends in global wildfire frequency over time
  - Helps identify years with unusual wildfire activity

- Visualization 6 (`vis6`)
  - `data/wildfire_wordcloud_data.csv`: Word cloud data from Kaggle Disaster Tweets, filtered for wildfire-specific terms

## Important Note About Raw Wildfire Data

The website does **not** require `data/wild_fire_nasa/` to render online.

- `data/wild_fire_nasa/` is only needed when rebuilding vis2 sampled files from raw yearly archives.
- For GitHub Pages deployment, committed preprocessed CSVs are sufficient.

## Git LFS Note

Git LFS is disabled for this project because GitHub Pages needs to serve real CSV content to browser-side scripts.

- Current `.gitattributes` keeps normal text tracking and does not apply LFS filters to `data/`.

## Run Locally

Use any static server from repository root.

Example with Python:

```bash
python3 -m http.server 5500
```

Then open:
- `http://127.0.0.1:5500/website/intro.html`

## GitHub Pages Deployment

1. Go to `Settings` -> `Pages`.
2. Set `Source` to `Deploy from a branch`.
3. Select branch `main`.
4. Select folder `/website`.
5. Save and wait for deployment.

Site root:
- `https://<your-username>.github.io/<repo-name>/`

This will serve content from the `website/` folder.

## Update vis2 Data (Yearly Samples)

If you have new raw yearly wildfire archives, regenerate vis2 sampled files:

1. Put yearly files in `data/wild_fire_nasa/` with names like `fire_archive_SV-C2_2025.csv`.
2. Update `YEARS` in `scripts/build_vis2_fire_samples.py` if needed.
3. Run:

```bash
python3 scripts/build_vis2_fire_samples.py
```

This updates:
- `data/preprocessed/vis2/fire_points_YYYY.csv`
- `data/preprocessed/vis2/sample_summary.csv`

Then commit updated preprocessed files to make them available on GitHub Pages.

## About Visualization 6 (Word Cloud)

Visualization 6 displays frequently mentioned words in tweets about California wildfires.

**Data Source:**
- Kaggle Disaster Tweets dataset
- Filtered for wildfire-specific terms only (excluding broader climate/disaster terms)

**Features:**
- Word size indicates usage frequency
- Colors represent sentiment (positive, green; neutral, gray; negative, red)
- Hover over words to enlarge for clearer viewing
