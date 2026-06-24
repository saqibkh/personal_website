import os
import datetime
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)


@app.context_processor
def inject_current_year():
    return {"current_year": datetime.date.today().year}


# --- PERSONAL DATA ---
BIO = {
    "name": "Saqib Khan",
    "role": "Electrical & Computer Engineer",
    "location": "Texas, USA",
    "email": "saqibkhan@utexas.edu",
    "linkedin": "https://www.linkedin.com/in/saqib-khan-2a0ab164/",
    "github": "https://github.com/saqibkh",
    "text": "I’m Saqib Khan, an Electrical and Computer Engineer with deep expertise in high-performance computing, CPU and GPU validation, and system-level firmware development. I specialize in building robust simulation models, automating complex testing frameworks, and optimizing memory and processor performance.",
    "hobbies": ["Spending time with my sons", "Playing cricket and football"]
}

EXPERIENCE = [
    {
        "role": "HBM Memory Validation Engineer",
        "company": "AMD",
        "date": "06/2024 - Present",
        "details": "Led memory validation tools and automation team, built Python automation frameworks for system-level tests, analyzed performance metrics, and optimized memory subsystem reliability."
    },
    {
        "role": "CPU Validation Engineer",
        "company": "AMD",
        "date": "05/2022 - 06/2024",
        "details": "Designed and executed APU performance and reliability tests, developed benchmark automation frameworks, and collaborated on CPU core validation and optimization."
    },
    {
        "role": "Processor Simulation Engineer",
        "company": "IBM",
        "date": "01/2017 - 05/2022",
        "details": "Built functional models for POWER architecture in C/C++ and implemented dynamic binary translation for x86-PPC64 simulation speedup."
    },
    {
        "role": "Firmware Developer",
        "company": "IBM",
        "date": "05/2015 - 01/2017",
        "details": "Developed OpenBMC firmware and automated tests for POWER system components including HMC, FSP, PHYP, and OpenBMC."
    }
]

EDUCATION = [
    {"degree": "Master's in Electrical and Computer Engineering", "school": "UT Austin", "year": "2019"},
    {"degree": "Bachelor's in Electrical and Computer Engineering", "school": "UT Austin", "year": "2015"}
]

SKILLS = {
    "Languages": ["Python", "C", "C++", "Verilog", "Bash/Shell"],
    "Tools": ["CUDA", "ROCm", "Git", "Linux", "Jupyter", "PyTorch", "HPC Simulation"]
}

# --- PORTFOLIO DATA ---
PROJECTS = [
    {
        "name": "UptimeHelm",
        "tag": "Web & DevOps",
        "desc": "Free website monitoring with uptime tracking, security checks, and AI-powered vulnerability assessments.",
        "link": "https://www.uptimehelm.com/"
    },
    {
        "name": "TerraScoutX",
        "tag": "Web & Data",
        "desc": "Texas property intelligence platform generating due-diligence reports on flood risk, tax burden, permits, and legal considerations.",
        "link": "https://terrascoutx.com/"
    },
    {
        "name": "CrashPilotX",
        "tag": "Systems & AI",
        "desc": "AI-powered Linux crash forensics tool for diagnosing and investigating system crashes.",
        "link": "https://crashpilotx.com/"
    },
    {
        "name": "NilPDF",
        "tag": "Web Application",
        "desc": "A free, browser-based PDF toolkit — merge, split, compress, convert, and more without uploading your files to a server.",
        "link": "https://nilpdf.com"
    },
    {
        "name": "Pantheon",
        "tag": "Hardware & Performance",
        "desc": "A GPU workload stress-testing tool designed to push hardware limits and analyze performance stability.",
        "link": "https://saqibkh.github.io/pantheongpu_website"
    },
    {
        "name": "Muslim Name Vault",
        "tag": "Web & Data",
        "desc": "A comprehensive, SEO-optimized database for Muslim baby names, built with Python automation.",
        "link": "https://muslimnamevault.com"
    },
    {
        "name": "ISA Database",
        "tag": "Computer Architecture",
        "desc": "A web-based resource documenting Instruction Set Architectures for educational and technical reference.",
        "link": "https://instructionsets.com"
    },
    {
        "name": "Cloud Sound YouTube Channel",
        "tag": "Youtube Channel",
        "desc": "Ambient and atmospheric soundscapes for focus, relaxation, and deep work.",
        "link": "https://www.youtube.com/@Cloud__Sound"
    },
    {
        "name": "Intelligence Lab YouTube Channel",
        "tag": "Youtube Channel",
        "desc": "Tech and Engineering educational content.",
        "link": "https://www.youtube.com/@Intelligence_Lab_SK"
    },
    {
        "name": "Advanced Browser System Benchmark",
        "tag": "Web Application",
        "desc": "Analyze your browser's capabilities and system performance with this comprehensive benchmark tool.",
        "link": "/projects/misc/advanced_browser_system_benchmark/"
    },
    {
        "name": "Calculator",
        "tag": "Web Application",
        "desc": "All-in-one calculator web utility. Standard, Scientific & Programmer modes with customizable themes.",
        "link": "/projects/misc/calculator/"
    },
    {
        "name": "Deciscope",
        "tag": "Web Application",
        "desc": "Real-time browser-based decibel meter and frequency analyzer for noise monitoring.",
        "link": "/projects/misc/deciscope/"
    },
    {
        "name": "Geolocation",
        "tag": "Web Application",
        "desc": "Precise geolocation tool for tracking coordinates and mapping routes.",
        "link": "/projects/misc/geolocation/"
    }
]

APPS = {
    "android": [
        {
            "name": "SoundCanvas",
            "tag": "Android Native",
            "desc": "A native Android application focused on audio manipulation and creative sound design.",
            "link": "#"
        },
        {
            "name": "WarmMeUp",
            "tag": "Android Native",
            "desc": "Virtual handwarmer with heat simulation, vibration, and customizable themes.",
            "link": "#"
        },
        {
            "name": "Calculator",
            "tag": "Android Native",
            "desc": "All-in-one calculator: Standard, Scientific & Programmer modes with themes.",
            "link": "#"
        },
        {
            "name": "SproutSpace",
            "tag": "Android Native",
            "desc": "All-in-one gardening companion — plan your layout, track planting schedules, and manage daily plant care.",
            "link": "#"
        },
        {
            "name": "Paddle_Smash",
            "tag": "Android Native",
            "desc": "A fast-paced arcade brick-breaker with modern visuals and smooth controls!",
            "link": "#"
        }
    ],
    "ios": []
}


@app.route('/')
def home():
    return render_template('index.html', title="About Me", bio=BIO, experience=EXPERIENCE, education=EDUCATION, skills=SKILLS,
        description="Saqib Khan — Electrical & Computer Engineer specializing in high-performance computing, GPU validation, and firmware development.")

@app.route('/projects')
def projects():
    return render_template('projects.html', title="Projects", projects=PROJECTS,
        description="Technical projects by Saqib Khan — GPU stress tools, web apps, databases, and Android apps.")

@app.route('/apps')
def apps():
    return render_template('apps.html', title="Apps", apps=APPS,
        description="Android and iOS mobile apps by Saqib Khan — calculators, soundscapes, gardening tools, and more.")

@app.route('/projects/misc/<path:filename>')
def serve_projects(filename):
    full_path = os.path.join('static_pages/projects/misc', filename)
    
    # If the user requests a folder (e.g. .../calculator/), serve index.html
    if os.path.isdir(full_path):
        filename = os.path.join(filename, 'index.html')
        
    return send_from_directory('static_pages/projects/misc', filename)
if __name__ == '__main__':
    # Try to get port from environment, otherwise default to 5001
    # This avoids the common port 5000 conflict entirely
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
