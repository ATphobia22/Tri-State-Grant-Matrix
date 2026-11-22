import json,unittest,importlib.util
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("monitor",root/"scripts/monitor.py")
monitor=importlib.util.module_from_spec(spec);spec.loader.exec_module(monitor)
class SiteContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.c=json.loads((root/"site/data/catalog.json").read_text())
    def test_nine_counties(self):
        self.assertEqual({x["fips"] for x in self.c["counties"]},{"18129","18163","18051","18173","17193","17059","17185","21101","21225"})
    def test_all_programs_and_links(self):
        p=self.c["programs"];self.assertGreaterEqual(len(p),100);self.assertEqual(len(p),len({x["id"] for x in p}))
        for x in p:
            self.assertIn(x["scope"],("IN","IL","KY","FED"))
            self.assertTrue(monitor.allowed(x["official"]),x["id"])
            self.assertTrue(monitor.allowed(x["documents"]),x["id"])
    def test_safe_link_policy(self):
        self.assertFalse(monitor.allowed("http://www.grants.gov/"))
        self.assertFalse(monitor.allowed("https://localhost/"))
        self.assertFalse(monitor.allowed("https://grants.gov.evil.invalid/"))
    def test_corrected_deadlines(self):
        p={x["id"]:x for x in self.c["programs"]}
        self.assertEqual(p["FEMA-FMA-2026"]["deadline"],"2027-02-26")
        self.assertEqual(p["KY-DLG-CDBG-ED"]["deadline"],"2027-03-01")
        self.assertEqual(p["KY-DLG-CDBG-HR"]["deadline"],"2027-02-01")
if __name__=="__main__":unittest.main()
