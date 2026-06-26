# Saqib Khan - Personal Portfolio & Tools

[![Tests](https://github.com/saqibkh/personal_website/actions/workflows/test.yml/badge.svg)](https://github.com/saqibkh/personal_website/actions/workflows/test.yml)
[![Build and Deploy](https://github.com/saqibkh/personal_website/actions/workflows/deploy.yml/badge.svg)](https://github.com/saqibkh/personal_website/actions/workflows/deploy.yml)

This repository hosts the source code for my personal portfolio website, **[khansaqib.com](https://khansaqib.com)**. It serves as a central hub for my engineering projects, professional experience, and a suite of interactive web-based tools.

## 🚀 Overview

The site is built as a **hybrid Flask application**. It functions as a dynamic Flask app for local development and templating but includes a custom build system to generate a static version for high-performance hosting on **GitHub Pages**.

### Key Features
* **Professional Portfolio:** Showcases experience at AMD, IBM, and UT Austin.
* **Live Web Tools:** A collection of functional, browser-based engineering utilities.
* **Dark Mode UI:** Modern, responsive design using CSS variables and glassmorphism effects.
* **Automated Deployment:** CI/CD pipeline via GitHub Actions.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask (Jinja2 Templating)
* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Visualization:** Chart.js (Graphs), Leaflet.js (Maps), Web Audio API
* **Automation:** GitHub Actions, Python Build Scripts

---

## 📂 Project Structure

```text
├── .github/workflows/   # CI/CD pipeline configuration (test.yml, deploy.yml)
├── docs/                # Generated static site (public folder for GitHub Pages)
├── static/              # Global assets (CSS, images, favicons)
├── static_pages/        # Standalone web tools (Calculator, Benchmark, etc.) + robots.txt
├── templates/           # Flask HTML templates (Base, Index, Projects, Apps)
├── tests/               # pytest test suite
├── app.py               # Main Flask application logic
├── build.py             # Static site generator script
└── requirements.txt     # Python dependencies
```

## 💻 Local Development

To run the website locally on your machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/saqibkh/personal_website.git
    cd personal_website
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Flask app:**
    ```bash
    python app.py
    ```

4.  **View in Browser:**
    Open `http://127.0.0.1:5001` to see the dynamic version. (Override the port with the `PORT` environment variable if 5001 is in use.)

## ✅ Running Tests

The project has a pytest suite covering Flask routes, SEO meta tags, accessibility, data integrity, and the static build script.

```bash
pytest tests/ -v
```

To check test coverage (CI requires at least 80%):
```bash
pytest tests/ --cov=app --cov=build --cov-report=term-missing
```

## 🚀 Deployment (CI/CD)

Deployment is fully automated across two workflows:

* **`test.yml`** runs the pytest suite (with a coverage gate) on every push to a feature branch and on every pull request targeting `main`.
* **`deploy.yml`** runs on every push to `main`: it re-runs the test suite as a safety gate, then — only if tests pass — runs `build.py` to:
    * Render Flask templates into static HTML.
    * Copy standalone projects, assets, and `robots.txt`.
    * Generate `favicon.ico`, `sitemap.xml`, and the `CNAME` record.
    * Commit the generated files to the `/docs` folder.

GitHub Pages serves the content from `/docs`. Both workflows can also be triggered manually from the **Actions** tab via `workflow_dispatch`.

**Manual Build:**
You can manually trigger a build locally by running:
```bash
python build.py
```
