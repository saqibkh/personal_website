import os
import shutil
from app import app

# 1. Clean and Create 'docs' directory
if os.path.exists('docs'):
    shutil.rmtree('docs')
os.makedirs('docs')

# 2. Copy Static Files (CSS and Images)
print("📂 Copying static files...")
shutil.copytree('static', 'docs/static')

# 3. Generate HTML Pages
client = app.test_client()
pages = [
    ('/', 'docs/index.html'),
    ('/projects.html', 'docs/projects.html'),
    ('/apps.html', 'docs/apps.html')
]

print("⚙️  Generating pages...")
with app.app_context():
    for route, path in pages:
        response = client.get(route)
        if response.status_code == 200:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(response.data.decode('utf-8'))
            print(f"✔ Generated {path}")
        else:
            print(f"❌ Failed to generate {path}")

print("✅ Done! Site ready in /docs")
