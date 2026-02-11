# Saqib Khan - Personal Portfolio & Tools

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
├── .github/workflows/   # CI/CD Pipeline configuration
├── docs/                # Generated static site (Public folder for GitHub Pages)
├── static/              # Global assets (CSS, Images)
├── static_pages/        # Standalone web tools (Calculators, Benchmarks)
├── templates/           # Flask HTML templates (Base, Index, Projects)
├── app.py               # Main Flask application logic
├── build.py             # Static site generator script
└── requirements.txt     # Python dependencies
```

## 💻 Local Development

To run the website locally on your machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/saqibkh/personal_website.git](https://github.com/saqibkh/personal_website.git)
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
    Open `http://127.0.0.1:5000` to see the dynamic version.



## 🚀 Deployment (CI/CD)

Deployment is fully automated. When code is pushed to the `main` branch, the **GitHub Actions** workflow triggers:

1.  Sets up a Python environment.
2.  Runs `build.py` to:
    * Render Flask templates into static HTML.
    * Copy standalone projects and assets.
    * Generate `sitemap.xml` and `CNAME` records.
3.  Commits the generated files to the `/docs` folder.
4.  GitHub Pages serves the content from `/docs`.

**Manual Build:**
You can manually trigger a build locally by running:
```bash
python build.py
