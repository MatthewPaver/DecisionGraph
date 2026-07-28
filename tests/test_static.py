import re
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]


class DecisionGraphStaticTests(unittest.TestCase):
    def test_required_assets_exist(self):
        for name in ("index.html", "styles.css", "app.js", "cases.js", "retrieval.js"):
            self.assertTrue((ROOT / "docs" / name).is_file(), name)

    def test_demo_has_comparable_outcomes(self):
        cases = (ROOT / "docs" / "cases.js").read_text()
        self.assertGreaterEqual(len(re.findall(r'\bid: "DG-', cases)), 16)
        self.assertGreaterEqual(len(re.findall(r"scheduleOutcome:", cases)), 16)
        self.assertGreaterEqual(len(re.findall(r"costOutcome:", cases)), 16)
        self.assertGreaterEqual(len(re.findall(r"evidence: \[", cases)), 16)

    def test_human_boundary_is_visible(self):
        html = (ROOT / "docs" / "index.html").read_text()
        app = (ROOT / "docs" / "app.js").read_text()
        self.assertIn("Save proposal to review queue", html)
        self.assertIn("not an autonomous approval", app)
        self.assertIn("Files are parsed in your browser", html)

    def test_no_external_runtime_dependencies(self):
        html = (ROOT / "docs" / "index.html").read_text()
        self.assertNotIn("cdn.jsdelivr.net", html)
        self.assertNotIn("unpkg.com", html)


if __name__ == "__main__":
    unittest.main()
