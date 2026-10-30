<div align="center">

# 🏅 Olympic Performance Analytics — 1896–2026

### Explore 130+ years of Olympic history through an interactive analytical dashboard.

**Summer Games · Winter Games · Medals · Athletes · Countries · Sports · Events · Hosts · Records**

<br>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Netlify-00C7B7?style=for-the-badge)](https://olympicanalysis1896-2026.netlify.app/)
[![Data Coverage](https://img.shields.io/badge/Data-1896--2026-111827?style=for-the-badge)](#-data-coverage)
[![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-2563EB?style=for-the-badge)](#-technology-stack)
[![Data Pipeline](https://img.shields.io/badge/Data%20Pipeline-Python%20%2B%20Pandas-F59E0B?style=for-the-badge)](#-data-pipeline)
[![License](https://img.shields.io/badge/License-Source%20Data%20Terms-6B7280?style=for-the-badge)](#-license--attribution)

<br>

> **From Athens 1896 to Milano Cortina 2026 — one dashboard, two Olympic seasons, decades of stories.**

</div>

---

## ✨ What is this project?

**Olympic Performance Analytics** is an interactive data-analysis and visualization website built to explore the history of the modern Olympic Games from **1896 through 2026**.

The project combines historical Olympic records with recent **Paris 2024 Summer** and **Milano Cortina 2026 Winter** data into a normalized analytical model.

Instead of looking at isolated tables, the dashboard lets you investigate Olympic history from multiple perspectives:

- 🥇 Who dominated the medal table?
- 🌍 How did country participation evolve?
- 👤 Which athletes achieved the greatest medal success?
- 🏟️ Which sports and events shaped the Olympic programme?
- 🏙️ Which cities hosted the Games most often?
- ☀️ How do Summer and Winter Olympics compare?
- 📈 How has participation changed across editions?
- 🏆 What records and milestones stand out across Olympic history?

---

## 🚀 Explore the Dashboard

The dashboard is organized into **8 analytical sections**:

| # | Section | What you can explore |
|---|---|---|
| **01** | 🥇 **Medal Tally** | Medal rankings, editions, countries and medal composition |
| **02** | 📊 **Overall Analysis** | Long-term trends in athletes, nations, events and participation |
| **03** | 🌍 **Country-wise Analysis** | Country performance, comparisons, sport strengths and top athletes |
| **04** | 👤 **Athlete-wise Analysis** | Age, gender, body measurements and athlete-level patterns |
| **05** | 🏟️ **Sports & Events** | Sport volume, event evolution and programme changes |
| **06** | 🏙️ **Hosts & Cities** | Host-city history, frequency and Olympic hosting journey |
| **07** | ☀️❄️ **Summer vs Winter** | Side-by-side comparison of Olympic seasons |
| **08** | 🏆 **Records & Milestones** | Season-specific records, peaks and historical milestones |

---

## 📌 Data Coverage

### ☀️ Summer Olympics

| Metric | Coverage |
|---|---:|
| Olympic editions | **31** |
| Years | **1896–2024** |
| Host cities | **23** |
| Sports | **95** |
| Events | **6,206** |
| Athletes | **142,406** |
| Nations | **253** |

### ❄️ Winter Olympics

| Metric | Coverage |
|---|---:|
| Olympic editions | **25** |
| Years | **1924–2026** |
| Host cities | **22** |
| Sports | **26** |
| Events | **1,335** |
| Athletes | **26,459** |
| Nations | **222** |

> **Note:** 2026 belongs to the **Winter Olympics** and is therefore available under the Winter season. Paris 2024 belongs to the Summer season.

---

## 🎯 Key Features

### 🥇 Medal Intelligence
- Gold, Silver, Bronze and Total medal analysis
- Edition/year filtering
- Country filtering
- Searchable medal rankings
- Olympic-style ranking: **Gold → Silver → Bronze**

### 📈 Historical Trends
- Athletes by Olympic edition
- Participating nations over time
- Events and programme growth
- Average athletes per participating nation
- Long-term Olympic participation patterns

### 🌍 Country Analysis
- Select and inspect individual countries
- Compare two countries
- Medal performance over time
- Sport-strength heatmaps
- Top-performing athletes

### 👤 Athlete Analysis
- Age distribution
- Average age of gold medalists by sport
- Height vs. weight analysis
- Men vs. women participation trends
- Athlete-level medal records

### 🏟️ Sports & Events
- Highest-volume sports
- Event distribution
- Sport × edition evolution heatmap
- Programme expansion and contraction

### 🏙️ Hosts & Cities
- Olympic host history
- Most frequent host cities
- Complete host archive
- Latest host spotlight

### ☀️❄️ Summer vs Winter
- Editions
- Sports
- Events
- Athletes
- Nations
- Host cities
- Separate chart scales for meaningful comparison

### 🏆 Records & Milestones
- Most decorated athletes
- Biggest single-edition medal hauls
- Most gold medals in one edition
- Athletes with medals across the most editions
- Largest athlete fields
- Largest Olympic programmes
- Season-specific milestone timelines

---

## 🧠 Data Pipeline

The project uses a reproducible Python pipeline to transform multiple Olympic datasets into browser-ready JSON and JavaScript data.

```text
                    ┌─────────────────────────┐
                    │   Historical Sources    │
                    │       1896–2022         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Paris 2024 Data     │
                    │       Summer Games      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Milano Cortina 2026    │
                    │       Winter Games      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Python + Pandas       │
                    │   Cleaning & Mapping    │
                    │   Normalization         │
                    │   Validation             │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Season-specific JSON   │
                    │   Summer / Winter       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      data.js            │
                    │ Browser-ready dataset   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Interactive Dashboard   │
                    │ HTML + CSS + JavaScript │
                    └─────────────────────────┘
```

---

## 🗂️ Project Structure

```text
Olympic-Performance-Analytics/
│
├── 📄 index.html
├── 📄 data.js
├── 📄 build_data.py
├── 📄 requirements.txt
├── 📄 README.md
├── 📄 DATA_SOURCES.md
├── 📄 noc_regions.csv
├── 📄 netlify.toml
│
├── 📁 data/
│   ├── 📁 summer/
│   └── 📁 winter/
│
├── 📁 raw_data/
│   ├── 📁 historical/
│   ├── 📁 paris2024/
│   └── 📁 milano_cortina2026/
│
├── 📁 css/
│   └── style.css
│
└── 📁 js/
    ├── utils.js
    ├── nav.js
    ├── main.js
    ├── home.js
    ├── medal-tally.js
    ├── overall.js
    ├── country.js
    ├── athlete.js
    └── extended.js
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Visualization** | Chart.js |
| **Data Processing** | Python, Pandas |
| **Data Format** | CSV, JSON, JavaScript |
| **Development Server** | Python HTTP Server |
| **Deployment** | Netlify |
| **Version Control** | Git + GitHub |

---

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Build the analytical data

```bash
python build_data.py
```

The script:

1. Reads the bundled source datasets
2. Cleans and normalizes the data
3. Rebuilds Summer and Winter JSON files
4. Rebuilds `data.js`
5. Starts the local web server

You should see:

```text
Olympic Analysis is running at:
http://127.0.0.1:8000/index.html
```

Open:

```text
http://127.0.0.1:8000/index.html
```

Press **Ctrl + C** to stop the server.

### Change the port

Linux / macOS:

```bash
OLYMPIC_PORT=8080 python build_data.py
```

Windows Command Prompt:

```cmd
set OLYMPIC_PORT=8080 && python build_data.py
```

---

## 🌐 Deploy to Netlify

This project is a **static client-side dashboard**, so no database or backend server is required after the analytical data has been generated.

### GitHub → Netlify

1. Push the project to GitHub.
2. Connect the repository to Netlify.
3. Set the project root as the publish directory.
4. No build command is required when the generated `data.js` and `data/` files are already committed.
5. Deploy.

The repository includes a `netlify.toml` configuration for static publishing.

> **Tip:** If you update the project locally, commit and push the changes to the connected production branch. Netlify can automatically create a new production deployment.

---

## 🔬 Data Methodology

The dashboard intentionally distinguishes between **country-level medal totals** and **athlete-level medal records**.

### Medal counting

- Country medal tallies use country-level medal records/totals.
- Team medals are therefore not multiplied by the number of team members.
- Athlete leaderboards use athlete-level medal records.

### Event analysis

- Events are normalized across source datasets.
- Sport/event combinations are counted by Olympic edition.
- Programme evolution is visualized separately for Summer and Winter.

### Age analysis

- Age is calculated only when sufficient birth/edition information is available.
- Missing birth information is not replaced with guessed values.

### Height & weight

- Only valid positive height and weight measurements are used.
- Missing measurements are excluded from the corresponding analysis.
- Recent datasets that do not provide these fields are not artificially populated.

### Data normalization

Recent Olympic datasets use different schemas from historical sources. The build pipeline maps them into a common analytical structure before generating the dashboard.

---

## 🧹 Data Quality & Special Cases

A few historical cases require explicit handling:

### 1906 Intercalated Games

The **1906 Intercalated Games** are retained for continuity with the historical source used by the project.

### 1956 Equestrian Records

A separate 1956 Equestrian entry exists in the historical source. It is excluded from the main analytical series to avoid duplicating the 1956 Olympic data.

### Tokyo 2020

Tokyo remains labelled **2020**, following the official Olympic edition year, even though the Games were held in 2021.

---

## 📚 Data Sources

The project combines:

- Historical Olympic athlete/event records
- Historical Olympic medal tallies
- Olympic Games and country reference data
- Paris 2024 datasets
- Milano Cortina 2026 datasets

Detailed source information and attribution notes are available in:

👉 **[`DATA_SOURCES.md`](DATA_SOURCES.md)**

Please review the original source terms before redistributing the bundled raw datasets.

---

## 🎨 Design Philosophy

The dashboard is designed around a **data-editorial interface** rather than a plain table-based analytics page.

### Visual principles

- Dark analytical workspace
- Strong typography hierarchy
- Season-aware Summer/Winter navigation
- Card-based information architecture
- Interactive charts
- Responsive layout
- Consistent spacing and visual rhythm
- Thin custom scrollbars
- Hover states and micro-interactions
- Focus on comparison and storytelling

The goal is to make a large historical dataset feel **explorable, readable and visually engaging**.

---

## 🔮 Future Improvements

Potential future extensions include:

- 🌎 Interactive Olympic map
- 🏳️ Country flag integration
- 🥇 Medal prediction models
- 📊 Advanced statistical comparisons
- 🤖 Athlete performance clustering
- 🔎 Global dashboard search
- 📱 Further mobile optimization
- 📥 Export filtered analysis to CSV
- 🧠 Machine-learning based medal forecasting
- 🎯 Olympic edition recommendation/exploration tools

---

## 📈 Why This Project?

This project demonstrates an end-to-end workflow covering:

```text
Raw Data
   ↓
Data Cleaning
   ↓
Data Normalization
   ↓
Data Transformation
   ↓
Exploratory Analysis
   ↓
Visualization
   ↓
Interactive Dashboard
   ↓
Static Web Deployment
```

It is therefore not just a visualization project — it combines **data engineering, analytics, visualization, frontend development and deployment** into one complete application.

---

## 👨‍💻 Project Highlights

**Domain:** Sports Analytics / Data Visualization

**Coverage:** 1896–2026

**Seasons:** Summer + Winter

**Latest Editions:** Paris 2024 + Milano Cortina 2026

**Architecture:** Static frontend + prebuilt analytical data

**Deployment:** Netlify

---

## 📄 License & Attribution

The source datasets bundled with this project may be subject to their respective licenses, terms of use and attribution requirements.

Before redistributing the raw datasets, review:

**[`DATA_SOURCES.md`](DATA_SOURCES.md)**

The analytical code and dashboard structure are provided for educational and project purposes.

---

<div align="center">

### 🏅 Explore the Games. Discover the Patterns. Understand the History.

**Olympic Analysis · 1896–2026**

<br>

[🌐 **Open Live Dashboard**](https://olympicanalysis1896-2026.netlify.app/)

</div>
