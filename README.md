# HCL Resource Fulfillment Analytics Agent

The **Resource Fulfillment Analytics Agent** is an interactive, analytical React application designed to help talent acquisition, resource managers, and leadership monitor and optimize resource fulfillment pipelines. 

By uploading standard resource demand spreadsheets (.xlsx, .xls, .csv), the application automatically detects sheets, fuzzy-maps columns to system fields, performs multi-point validations, clusters free-text roles into an structured skill taxonomy, and evaluates a blended fulfillment health score. It also features a simulated AI Manager Assistant to let users query findings using natural language.

---

## 🚀 Key Features

### 1. Upload & Data Processing Module (`src/components/UploadModule.tsx` & `src/lib/parsing.ts`)
*   **Drag-and-Drop Interface:** An intuitive UI with progress indicators for importing fulfillment data.
*   **Automatic Sheet Detection:** A score-based heuristic that analyzes headers and row dimensions to identify the main database sheet, with manual selection fallbacks.
*   **Fuzzy Column Mapping (`src/lib/mapping.ts`):** Employs **Levenshtein distance** and a comprehensive synonym dictionary to automatically bind spreadsheet headers (e.g., *Requisition No*, *TAT*, *Joined Date*) to target system fields. Users can manually drag-and-drop column headings to re-map fields.
*   **Comprehensive Data Validation (`src/lib/validation.ts`):** Audits imported rows for:
    *   Mandatory fields (IDs, dates, skills, hiring types).
    *   Duplicate IDs or requisition numbers.
    *   Invalid or unparseable dates.
    *   Chronological anomalies (e.g., candidate onboarding date occurring prior to demand creation date).
    *   Hiring type validation (must be either "Internal" or "External").
*   **Error Reporting:** Displays row-level validation errors directly in the UI and generates a downloadable CSV error report detailing specific row references and issues.

### 2. Fulfillment Analytics Engine (`src/lib/aggregation.ts`)
*   **Internal vs. External Performance:** Tallies and compares the distribution and average lead times (TAT) for positions filled internally (bench/rotations) versus externally (recruiting agency/direct hiring).
*   **Geographic Sourcing Velocity:** Aggregates average lead times across multiple locations to highlight regional bottlenecks.

### 3. Skill Intelligence Module (`src/lib/clustering.ts`)
*   **Skill Taxonomy Seed Database:** Automatically categorizes messy, free-text role titles into standard skill domains (e.g., *SAP*, *Cloud & Data Engineering*, *Programming & Full-Stack Dev*, *DevOps & SRE*, *Data Science & AI/ML*, etc.).
*   **Volume Thresholding:** Consolidates sparse or low-volume skill categories representing less than 1% of the overall dataset into a dynamic category: `"Other / Emerging Skills"`. This prevents noise in the analytical visuals.

### 4. Health & Bottleneck Engine (`src/lib/healthScore.ts` & `src/lib/trendAnalysis.ts`)
*   **Fulfillment Health Score Formula:** Evaluates each skill cluster on a scale of `0 - 100` and assigns a status band (`Healthy` (>=75), `Watch` (50-74), `At Risk` (<50)):
    $$\text{Health Score} = (\text{Internal Ratio Component} \times 0.45) + (\text{Lead Time Component} \times 0.55)$$
    *   **Internal Ratio Component:** Scores how well the cluster meets the target internal fulfillment threshold (standard target is 70%).
    *   **Lead Time Component:** Evaluates average lead times against a benchmark (default 45 days). Average lead times scaling past 90 days reduce this component to 0.
*   **Root Cause Diagnosis:** Automatically flags whether bottlenecked clusters are suffering from *Skill Shortages* (bench and external market constrained), *Approval Delays* (bench exists but transfer approvals are lagging), or *Hiring Delays* (external pipeline sourcing latency).
*   **Demand Trend Analysis:** Tracks demand volumes across chronological halves of the dataset. Skills with growth meeting volume floors and percentage change thresholds are classified as **Trending**, while declining ones are marked as decaying.

### 5. Interactive Dashboards & AI Assistant (`src/components/AnalyticsDashboard.tsx`)
*   **Executive Dashboard:** High-level KPIs, internal/external comparisons, critical location latency points, and cluster health radar charts.
*   **Detailed Tabs:** Dive deep into skill counts, chronological trend lists, location-based heatmaps, and root cause analysis graphs.
*   **Actionable Recommendation Cards:** Suggests custom mitigations dynamically (e.g., establishing training bootcamps for slow internal pipelines, setting up preferred supplier agreements for slow external regions).
*   **AI Manager Assistant:** An in-browser chatbot that answers natural language questions (e.g., *What are our top bottle-necked skills?*, *Explain SAP performance*) and renders formatted answers, code snippets, or charts.

---

## 📂 Project Architecture

```
HCL_project3/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── ui.tsx                  # Reusable styling components (Cards, Badges, Buttons)
│   │   ├── Layout.tsx              # Standard application wrapper and header/back controls
│   │   ├── UploadModule.tsx        # File drag-and-drop, parsing UI, and column mapper
│   │   └── AnalyticsDashboard.tsx  # KPI cards, charts, and interactive AI chat agent
│   ├── lib/
│   │   ├── __tests__/              # Unit test suites
│   │   ├── types.ts                # Unified type declarations
│   │   ├── parsing.ts              # SheetJS controller and automatic sheet scoring logic
│   │   ├── validation.ts           # Business validation rules and error logs
│   │   ├── mapping.ts              # Fuzzy string matching (Levenshtein distance)
│   │   ├── clustering.ts           # Seed taxonomy classification & thresholding
│   │   ├── healthScore.ts          # Blended Health Score calculators
│   │   ├── leadTime.ts             # Target-to-fulfillment day calculators
│   │   ├── trendAnalysis.ts        # Chronological demand trend analyzer
│   │   └── aggregation.ts          # Cluster & Location group-by calculators
│   ├── App.tsx             # Application router and state provider
│   ├── main.tsx            # React entrypoint
│   └── index.css           # Global stylesheet and modern styling variables
├── package.json            # Node project configuration and dependencies
├── vite.config.ts          # Vite bundling and dev-server parameters
└── tsconfig.json           # TypeScript configuration
```

---

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies
Run the following command in the project root:
```bash
npm install
```

### 2. Run the Development Server
Launch the local development environment:
```bash
npm run dev
```
Open your browser and navigate to the local address displayed (typically `http://localhost:5173`).

### 3. Build for Production
To bundle the application for production deployment:
```bash
npm run build
```
This generates optimized static files inside the `dist/` directory.

### 4. Running Unit Tests
To execute unit tests verify business logic modules:
```bash
npm run test
```

---

## 📊 Business Logic Specifications

| Parameter | Default Value | Purpose |
|---|---|---|
| **Target Internal Fulfillment Ratio** | 70% | Ideal proportion of hires filled internally before relying on external sourcing. |
| **Benchmark Lead Time (TAT)** | 45 Days | Ideal target duration to fulfill an open position. |
| **Skill Clustering Threshold** | 1% | Clusters representing less than 1% of total records are grouped into "Other / Emerging Skills". |
| **Trend Growth Threshold** | 25% | Percentage growth required to flag a skill cluster as trending. |
| **Trend Volume Floor** | 10 Records | Minimum count of records required in the current period to qualify a cluster for trending status. |
