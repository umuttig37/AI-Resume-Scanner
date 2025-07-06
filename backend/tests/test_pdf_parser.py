import unittest
import os
from backend.app.pdf_parser import extract_text_from_pdf


class TestPdfParser(unittest.TestCase):
    def test_text_extraction(self):
        #created here a test pdf dynamically
        test_pdf = "test.pdf"
        with open(test_pdf, "w") as f:
            f.write("Test resume content")

        text = extract_text_from_pdf(test_pdf)
        self.assertIn("Test resume", text)
        os.remove(test_pdf)