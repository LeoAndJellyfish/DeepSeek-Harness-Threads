"""Build and validate the tgz, offline ZIP and checksum file for a release."""

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tarfile
import zipfile


ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
version = manifest["version"]
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    raise SystemExit("Release version must have major.minor.patch form")
client = (ROOT / "client.js").read_text(encoding="utf-8")
if f"const PLUGIN_VERSION = '{version}';" not in client:
    raise SystemExit("Client and package versions differ")
if f"当前版本：**{version}**" not in (ROOT / "README.md").read_text(encoding="utf-8"):
    raise SystemExit("README and package versions differ")

output = ROOT / "dist" / f"release-{version}"
output.mkdir(parents=True, exist_ok=True)
npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
if not npm:
    raise SystemExit("npm is unavailable")
packed = subprocess.run(
    [npm, "pack", "--json", "--pack-destination", str(output)],
    cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8",
)
metadata = json.loads(packed.stdout)[0]
tgz = output / metadata["filename"]
required = {
    "package.json", "client.js", "index.js", "cordis.patch.yml",
    "icon.svg", "LICENSE", "README.md", "locale/zh.json", "locale/en.json",
}
contents = {}
with tarfile.open(tgz, "r:gz") as archive:
    for member in archive.getmembers():
        name = PurePosixPath(member.name)
        if not member.isfile() or name.is_absolute() or ".." in name.parts or name.parts[0] != "package":
            raise SystemExit(f"Unexpected archive member: {member.name}")
        relative = str(PurePosixPath(*name.parts[1:]))
        data = archive.extractfile(member).read()
        if relative in contents:
            raise SystemExit(f"Duplicate archive member: {relative}")
        if data != (ROOT / relative).read_bytes():
            raise SystemExit(f"Packaged bytes differ from source: {relative}")
        contents[relative] = data
if set(contents) != required:
    raise SystemExit(f"Unexpected package contents: {sorted(contents)}")
if json.loads(contents["package.json"])["version"] != version:
    raise SystemExit("Packaged version differs")

zip_path = output / f"dsh-threads-{version}.zip"
with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for relative, data in sorted(contents.items()):
        # Fixed timestamps keep repeated packaging reproducible.
        entry = zipfile.ZipInfo(f"dsh-threads/{relative}", date_time=(2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, data)
with zipfile.ZipFile(zip_path) as archive:
    if archive.testzip() is not None:
        raise SystemExit("ZIP integrity check failed")
    for relative, data in contents.items():
        if archive.read(f"dsh-threads/{relative}") != data:
            raise SystemExit(f"ZIP contents differ: {relative}")

checksums = [f"{hashlib.sha256(file.read_bytes()).hexdigest()}  {file.name}" for file in (tgz, zip_path)]
(output / "SHA256SUMS").write_text("\n".join(checksums) + "\n", encoding="utf-8", newline="\n")
print(json.dumps({"version": version, "directory": str(output), "files": [tgz.name, zip_path.name, "SHA256SUMS"], "entries": len(contents)}, ensure_ascii=False))
