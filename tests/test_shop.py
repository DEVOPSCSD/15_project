import os
import time
import unittest
from urllib.request import urlopen
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException

BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
REMOTE_URL = os.getenv("SELENIUM_REMOTE_URL", "http://localhost:4444/wd/hub")

class DevShopUITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        deadline = time.time() + 120
        last_error = None
        while time.time() < deadline:
            try:
                with urlopen(BASE_URL, timeout=4) as response:
                    if response.status == 200:
                        break
            except Exception as exc:
                last_error = exc
            time.sleep(2)
        else:
            raise RuntimeError(f"Frontend did not become ready: {last_error}")

        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        cls.driver = webdriver.Remote(command_executor=REMOTE_URL, options=options)
        cls.driver.set_window_size(1440, 1000)
        cls.wait = WebDriverWait(cls.driver, 30)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "driver"):
            cls.driver.quit()

    def test_home_page_and_products_render(self):
        self.driver.get(BASE_URL)
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".product-card")))
        self.assertIn("DevShop", self.driver.title)
        self.assertGreaterEqual(len(self.driver.find_elements(By.CSS_SELECTOR, ".product-card")), 1)

    def test_search_filters_products(self):
        self.driver.get(BASE_URL)
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".product-card")))
        search = self.driver.find_element(By.CSS_SELECTOR, 'input[aria-label="Search products"]')
        search.send_keys("Headphones")
        self.wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".product-card")) == 1)
        self.assertIn("Headphones", self.driver.find_element(By.CSS_SELECTOR, ".product-card h3").text)

    def test_add_to_cart_and_open_bag(self):
        self.driver.get(BASE_URL)
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".product-card")))
        self.driver.find_element(By.CSS_SELECTOR, ".quick-add").click()
        self.assertEqual(self.driver.find_element(By.CSS_SELECTOR, '[data-testid="cart-count"]').text, "1")
        self.driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Open cart"]').click()
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".cart-drawer")))
        self.assertIn("Your bag", self.driver.find_element(By.CSS_SELECTOR, ".drawer-heading").text)

if __name__ == "__main__":
    unittest.main(verbosity=2)
