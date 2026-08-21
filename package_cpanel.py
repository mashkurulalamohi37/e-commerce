import os
import zipfile
import shutil

ROOT_DIR = r"d:\Intern Projects\E-commerce"
FRONTEND_DIST = os.path.join(ROOT_DIR, "dist", "client")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

FRONTEND_ZIP = os.path.join(ROOT_DIR, "cpanel_frontend_public_html.zip")
BACKEND_ZIP = os.path.join(ROOT_DIR, "cpanel_backend_nillsmart_api.zip")

def package_frontend():
    print(f"Packaging frontend from {FRONTEND_DIST} to {FRONTEND_ZIP}...")
    if os.path.exists(FRONTEND_ZIP):
        os.remove(FRONTEND_ZIP)
    
    with zipfile.ZipFile(FRONTEND_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(FRONTEND_DIST):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, FRONTEND_DIST)
                zipf.write(file_path, arcname=rel_path)
    
    size_mb = os.path.getsize(FRONTEND_ZIP) / (1024 * 1024)
    print(f"Frontend package ready: {FRONTEND_ZIP} ({size_mb:.2f} MB)")

def package_backend():
    print(f"Packaging backend from {BACKEND_DIR} to {BACKEND_ZIP}...")
    if os.path.exists(BACKEND_ZIP):
        os.remove(BACKEND_ZIP)

    included_dirs = ["app", "scripts"]
    included_files = ["passenger_wsgi.py", "requirements-cpanel.txt", ".env.cpanel.example"]

    with zipfile.ZipFile(BACKEND_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        # Add single files
        for f in included_files:
            fp = os.path.join(BACKEND_DIR, f)
            if os.path.exists(fp):
                zipf.write(fp, arcname=f)

        # Add directories
        for d in included_dirs:
            dp = os.path.join(BACKEND_DIR, d)
            for root, dirs, files in os.walk(dp):
                if "__pycache__" in root or ".pytest_cache" in root:
                    continue
                for file in files:
                    if file.endswith(".pyc") or file.endswith(".pyo"):
                        continue
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, BACKEND_DIR)
                    zipf.write(file_path, arcname=rel_path)

    size_kb = os.path.getsize(BACKEND_ZIP) / 1024
    print(f"Backend package ready: {BACKEND_ZIP} ({size_kb:.2f} KB)")

if __name__ == "__main__":
    package_frontend()
    package_backend()
