"""
Test suite for khansaqib.com personal website.
Covers: Flask routes, data integrity, HTML output, and the build script.
Run with: pytest tests/ -v
"""

import re
import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app, PROJECTS, APPS, BIO, EXPERIENCE, EDUCATION, SKILLS


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as c:
        yield c


# ── Route tests ───────────────────────────────────────────────────────────────

class TestRoutes:
    @pytest.mark.parametrize("route,expected", [
        ("/", 200),
        ("/projects", 200),
        ("/apps", 200),
        ("/does-not-exist", 404),
    ])
    def test_route_status_codes(self, client, route, expected):
        assert client.get(route).status_code == expected

    def test_home_renders_bio_name(self, client):
        r = client.get("/")
        assert BIO["name"].encode() in r.data

    def test_home_renders_all_experience_roles(self, client):
        r = client.get("/")
        for job in EXPERIENCE:
            assert job["role"].encode() in r.data, f"Role '{job['role']}' missing from home page"

    def test_projects_renders_every_project(self, client):
        r = client.get("/projects")
        for p in PROJECTS:
            assert p["name"].encode() in r.data, f"Project '{p['name']}' missing from /projects"

    def test_apps_renders_every_android_app(self, client):
        r = client.get("/apps")
        for a in APPS["android"]:
            assert a["name"].encode() in r.data, f"App '{a['name']}' missing from /apps"


# ── SEO / meta tags ───────────────────────────────────────────────────────────

class TestSEO:
    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_meta_description_present(self, client, route):
        r = client.get(route)
        assert b'<meta name="description"' in r.data, f"{route} missing <meta name='description'>"

    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_og_title_present(self, client, route):
        r = client.get(route)
        assert b'og:title' in r.data, f"{route} missing og:title"

    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_og_description_present(self, client, route):
        r = client.get(route)
        assert b'og:description' in r.data, f"{route} missing og:description"

    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_canonical_link_present(self, client, route):
        r = client.get(route)
        assert b'rel="canonical"' in r.data, f"{route} missing canonical link"

    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_page_title_contains_name(self, client, route):
        r = client.get(route)
        assert b"Khan Saqib" in r.data

    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_favicon_link_present(self, client, route):
        r = client.get(route)
        assert b'rel="icon"' in r.data, f"{route} missing favicon <link rel='icon'>"

    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_apple_touch_icon_present(self, client, route):
        r = client.get(route)
        assert b'apple-touch-icon' in r.data, f"{route} missing apple-touch-icon link"

    @pytest.mark.parametrize("filename", [
        "favicon.svg", "favicon-16x16.png", "favicon-32x32.png",
        "favicon.ico", "apple-touch-icon.png",
    ])
    def test_favicon_asset_exists_on_disk(self, filename):
        path = os.path.join(os.path.dirname(__file__), "..", "static", filename)
        assert os.path.exists(path), f"Missing favicon asset: static/{filename}"


# ── Security / link hygiene ───────────────────────────────────────────────────

class TestLinkSecurity:
    @pytest.mark.parametrize("route", ["/", "/projects", "/apps"])
    def test_no_blank_link_without_noopener(self, client, route):
        html = client.get(route).data.decode("utf-8")
        for m in re.finditer(r'target=["\']_blank["\'][^>]*>', html):
            tag = m.group()
            assert "noopener" in tag, (
                f"Link on {route} uses target=_blank without rel=noopener: {tag[:100]}"
            )

    def test_external_project_links_open_in_new_tab(self, client):
        html = client.get("/projects").data.decode("utf-8")
        for m in re.finditer(r'<a\s[^>]*href="(https?://[^"]+)"[^>]*>', html):
            full_tag = m.group()
            href = m.group(1)
            assert 'target="_blank"' in full_tag or "target='_blank'" in full_tag, (
                f"External link '{href}' should open in a new tab"
            )

    def test_no_javascript_eval_in_calculator(self):
        script_path = os.path.join(
            os.path.dirname(__file__),
            "..", "static_pages", "projects", "misc", "calculator", "script.js"
        )
        src = open(script_path, encoding="utf-8").read()
        # eval() should be completely absent; we use Function() with whitelisting instead
        assert "eval(" not in src, "calculator/script.js still contains eval() — security risk"


# ── Data integrity ────────────────────────────────────────────────────────────

class TestDataIntegrity:
    @pytest.mark.parametrize("field", ["name", "role", "email", "github", "linkedin", "location"])
    def test_bio_required_fields(self, field):
        assert BIO.get(field), f"BIO missing or empty field: {field}"

    def test_all_projects_have_name(self):
        for p in PROJECTS:
            assert p.get("name"), "A project is missing its name"

    def test_all_projects_have_description(self):
        for p in PROJECTS:
            assert p.get("desc"), f"Project '{p.get('name')}' has an empty description"

    def test_no_external_project_link_uses_plain_http(self):
        for p in PROJECTS:
            link = p.get("link", "")
            assert not link.startswith("http://"), (
                f"Project '{p['name']}' links to insecure http:// — should be https://"
            )

    def test_all_projects_have_link(self):
        for p in PROJECTS:
            assert p.get("link"), f"Project '{p.get('name')}' has no link"

    def test_all_projects_have_tag(self):
        for p in PROJECTS:
            assert p.get("tag"), f"Project '{p.get('name')}' has no tag"

    def test_no_project_has_dead_hash_link(self):
        for p in PROJECTS:
            assert p.get("link") != "#", f"Project '{p['name']}' has a dead '#' link"

    def test_project_descriptions_not_too_short(self):
        for p in PROJECTS:
            words = len(p.get("desc", "").split())
            assert words >= 5, (
                f"Project '{p['name']}' description is only {words} word(s) — too short: '{p['desc']}'"
            )

    def test_project_descriptions_not_too_long(self):
        max_words = 30
        for p in PROJECTS:
            words = len(p.get("desc", "").split())
            assert words <= max_words, (
                f"Project '{p['name']}' description is {words} words — exceeds {max_words} limit, "
                f"will break card grid layout"
            )

    def test_all_android_apps_have_required_fields(self):
        for a in APPS["android"]:
            assert a.get("name"), "An Android app is missing its name"
            assert a.get("desc"), f"Android app '{a.get('name')}' has empty description"
            assert a.get("tag"),  f"Android app '{a.get('name')}' has no tag"

    def test_experience_entries_are_complete(self):
        for job in EXPERIENCE:
            for field in ["role", "company", "date", "details"]:
                assert job.get(field), f"Experience entry missing field '{field}': {job}"

    def test_education_entries_are_complete(self):
        for edu in EDUCATION:
            for field in ["degree", "school", "year"]:
                assert edu.get(field), f"Education entry missing field '{field}': {edu}"

    def test_skills_has_required_categories(self):
        assert SKILLS.get("Languages"), "SKILLS 'Languages' is missing or empty"
        assert SKILLS.get("Tools"),     "SKILLS 'Tools' is missing or empty"


# ── Build script ──────────────────────────────────────────────────────────────

class TestBuild:
    @pytest.fixture(autouse=True)
    def patch_output_dir(self, tmp_path, monkeypatch):
        import build
        monkeypatch.setattr(build, "OUTPUT_DIR", str(tmp_path))
        self.out = tmp_path
        build.build_site()

    def test_index_html_generated(self):
        assert (self.out / "index.html").exists()

    def test_projects_html_generated(self):
        assert (self.out / "projects.html").exists()

    def test_apps_html_generated(self):
        assert (self.out / "apps.html").exists()

    def test_sitemap_generated(self):
        assert (self.out / "sitemap.xml").exists()

    def test_cname_generated(self):
        assert (self.out / "CNAME").exists()

    def test_static_assets_copied(self):
        assert (self.out / "static" / "style.css").exists()

    def test_favicon_copied_to_site_root(self):
        assert (self.out / "favicon.ico").exists(), "favicon.ico missing from docs root"

    def test_cname_contains_correct_domain(self):
        assert (self.out / "CNAME").read_text().strip() == "khansaqib.com"

    def test_sitemap_contains_main_routes(self):
        sitemap = (self.out / "sitemap.xml").read_text()
        for fragment in ["khansaqib.com/", "khansaqib.com/projects", "khansaqib.com/apps"]:
            assert fragment in sitemap, f"Sitemap missing: {fragment}"

    def test_sitemap_contains_tool_pages(self):
        sitemap = (self.out / "sitemap.xml").read_text()
        for tool in ["calculator", "geolocation", "deciscope", "advanced_browser_system_benchmark"]:
            assert tool in sitemap, f"Sitemap missing tool page: {tool}"

    def test_sitemap_tool_urls_have_trailing_slash(self):
        sitemap = (self.out / "sitemap.xml").read_text()
        tool_urls = re.findall(r"<loc>(https://[^<]+misc/[^<]+)</loc>", sitemap)
        assert tool_urls, "No tool URLs found in sitemap"
        for url in tool_urls:
            assert url.endswith("/"), f"Tool URL missing trailing slash: {url}"

    def test_built_projects_html_contains_all_projects(self):
        html = (self.out / "projects.html").read_text(encoding="utf-8")
        for p in PROJECTS:
            assert p["name"] in html, f"Built projects.html missing: {p['name']}"

    def test_built_home_contains_bio_name(self):
        html = (self.out / "index.html").read_text(encoding="utf-8")
        assert BIO["name"] in html
