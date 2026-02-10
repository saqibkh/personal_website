from flask import Flask, render_template

app = Flask(__name__)

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
        "name": "Pantheon",
        "tag": "Hardware & Performance",
        "desc": "A GPU workload stress-testing tool designed to push hardware limits and analyze performance stability.",
        "link": "#"
    },
    {
        "name": "Muslim Name Vault",
        "tag": "Web & Data",
        "desc": "A comprehensive, SEO-optimized database for Muslim baby names, built with Python automation.",
        "link": "#"
    },
    {
        "name": "ISA Database",
        "tag": "Computer Architecture",
        "desc": "A web-based resource documenting Instruction Set Architectures for educational and technical reference.",
        "link": "#"
    },
    {
        "name": "Algorithmic Trading Bot",
        "tag": "FinTech",
        "desc": "Automated trading strategies implemented in Python using the Alpaca API for real-time market execution.",
        "link": "#"
    }
]

APPS = {
    "android": [
        {
            "name": "SoundCanvas",
            "tag": "Android Native",
            "desc": "A native Android application focused on audio manipulation and creative sound design.",
            "link": "#"
        }
    ],
    "ios": []
}

@app.route('/')
def home():
    return render_template('index.html', title="About Me", bio=BIO, experience=EXPERIENCE, education=EDUCATION, skills=SKILLS)

@app.route('/projects.html')
def projects():
    return render_template('projects.html', title="Projects", projects=PROJECTS)

@app.route('/apps.html')
def apps():
    return render_template('apps.html', title="Apps", apps=APPS)

if __name__ == '__main__':
    app.run(debug=True)
