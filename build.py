import os
import shutil
import datetime
from app import app

# CONFIGURATION
BASE_URL = "https://khansaqib.com"
OUTPUT_DIR = 'docs'
STATIC_PAGES_DIR = 'static_pages'

def build_site():
    # 1. Clean and Create 'docs' directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    # 2. Copy Static Files (CSS and Images)
    print("📂 Copying static files...")
    shutil.copytree('static', f'{OUTPUT_DIR}/static')

    # 3. Copy Standalone Projects
    print("📂 Copying standalone projects...")
    shutil.copytree(STATIC_PAGES_DIR, OUTPUT_DIR, dirs_exist_ok=True)

    # 4. Generate Main HTML Pages via Flask
    client = app.test_client()
    main_pages = [
        ('/', 'index.html'),
        ('/projects', 'projects.html'),
        ('/apps', 'apps.html')
    ]

    print("⚙️  Generating pages...")
    with app.app_context():
        for route, filename in main_pages:
            response = client.get(route)
            if response.status_code == 200:
                with open(f'{OUTPUT_DIR}/{filename}', 'w', encoding='utf-8') as f:
                    f.write(response.data.decode('utf-8'))
                print(f"✔ Generated {filename}")
            else:
                print(f"❌ Failed to generate {filename}")

    # 5. Generate CNAME (For Custom Domain)
    print("🌐 Generating CNAME...")
    with open(f'{OUTPUT_DIR}/CNAME', 'w') as f:
        f.write("khansaqib.com")

    # 6. Generate Sitemap.xml (For SEO)
    print("🗺️  Generating Sitemap...")
    generate_sitemap(main_pages)

    print(f"✅ Done! Site ready in /{OUTPUT_DIR}")

def generate_sitemap(main_pages):
    """
    Scans generated files to build a sitemap.xml
    """
    urls = []
    
    # Add Flask Pages
    for _, filename in main_pages:
        # We strip .html for clean URLs if your host supports it, 
        # but typically sitemaps should match the exact file unless you have rewrite rules.
        # For GitHub pages, /projects maps to /projects.html, but the canonical URL is usually without .html
        clean_path = filename.replace('index.html', '').replace('.html', '')
        urls.append(f"{BASE_URL}/{clean_path}")

    # Add Standalone Projects (Scan the static_pages dir)
    for root, _, files in os.walk(STATIC_PAGES_DIR):
        for file in files:
            if file == 'index.html':
                # Convert file path to URL path
                rel_path = os.path.relpath(root, STATIC_PAGES_DIR)
                # Ensure forward slashes for URLs
                url_path = rel_path.replace(os.path.sep, '/')
                urls.append(f"{BASE_URL}/{url_path}/")

    # Write sitemap.xml
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    date_str = datetime.date.today().isoformat()
    
    for url in urls:
        # Remove trailing slash if double (except for root)
        final_url = url.replace('//', '/').replace('https:/', 'https://')
        if final_url.endswith('/') and len(final_url) > 22: # > len(https://khansaqib.com/)
             final_url = final_url.rstrip('/')

        sitemap_content += f'  <url>\n'
        sitemap_content += f'    <loc>{final_url}</loc>\n'
        sitemap_content += f'    <lastmod>{date_str}</lastmod>\n'
        sitemap_content += f'    <changefreq>monthly</changefreq>\n'
        sitemap_content += f'  </url>\n'

    sitemap_content += '</urlset>'

    with open(f'{OUTPUT_DIR}/sitemap.xml', 'w') as f:
        f.write(sitemap_content)

if __name__ == "__main__":
    build_site()
