import os
import shutil
import zipfile

def pack_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    zip_paths = [
        os.path.join(base_dir, "..", "Astrix.zip"),
        os.path.join(base_dir, "Astrix.zip")
    ]
    
    exclude_dirs = {"node_modules", ".git", ".gemini", "backups", "__pycache__"}
    exclude_extensions = {".zip", ".log", ".tmp"}

    # Remove old zips
    for zp in zip_paths:
        if os.path.exists(zp):
            try:
                os.remove(zp)
            except Exception:
                pass

    primary_zip = zip_paths[0]
    entries_count = 0

    print("[Packer] Packing Linux/Pterodactyl-compatible POSIX ZIP...")
    with zipfile.ZipFile(primary_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                if any(f.endswith(ext) for ext in exclude_extensions):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                # STRICT POSIX FORWARD SLASHES FOR LINUX/PANEL COMPATIBILITY
                posix_path = rel_path.replace("\\", "/")
                zf.write(full_path, arcname=posix_path)
                entries_count += 1

    shutil.copy2(primary_zip, zip_paths[1])
    print(f"[Packer] Success: Packed {entries_count} files into Astrix.zip with 100% POSIX paths (no backslashes).")

if __name__ == "__main__":
    pack_zip()
