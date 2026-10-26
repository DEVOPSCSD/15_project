
import os
import time
import unittest
from urllib.request import urlopen

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE_URL = os.getenv("BASE_URL", "http://localhost:8081")
REMOTE_URL = os.getenv(
    "SELENIUM_REMOTE_URL",
    "http://localhost:4444/wd/hub"
)


class DevShopUITests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Wait for the frontend to become available.
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
            raise RuntimeError(
                f"Frontend did not become ready: {last_error}"
            )

        # Configure headless Chrome through Selenium Grid.
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1440,1000")

        cls.driver = webdriver.Remote(
            command_executor=REMOTE_URL,
            options=options
        )

        cls.driver.set_window_size(1440, 1000)
        cls.wait = WebDriverWait(cls.driver, 30)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "driver"):
            cls.driver.quit()

    def test_home_page_and_products_render(self):
        self.driver.get(BASE_URL)

        self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, ".product-card")
            )
        )

        self.assertIn("DevShop", self.driver.title)

        products = self.driver.find_elements(
            By.CSS_SELECTOR, ".product-card"
        )
        self.assertGreaterEqual(len(products), 1)

    def test_search_filters_products(self):
        self.driver.get(BASE_URL)

        self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, ".product-card")
            )
        )

        search = self.wait.until(
            EC.element_to_be_clickable(
                (
                    By.CSS_SELECTOR,
                    'input[aria-label="Search products"]'
                )
            )
        )

        search.clear()
        search.send_keys("Headphones")

        self.wait.until(
            lambda driver: len(
                driver.find_elements(
                    By.CSS_SELECTOR, ".product-card"
                )
            ) == 1
        )

        product_name = self.driver.find_element(
            By.CSS_SELECTOR, ".product-card h3"
        ).text

        self.assertTrue(product_name.strip())

    def test_add_to_cart_and_open_bag(self):
        self.driver.get(BASE_URL)

        self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, ".product-card")
            )
        )

        # Find and click the first Add to Cart button.
        add_button = self.wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, ".quick-add")
            )
        )

        self.driver.execute_script(
            "arguments[0].scrollIntoView({"
            "block: 'center', inline: 'nearest'});",
            add_button
        )

        self.driver.execute_script(
            "arguments[0].click();",
            add_button
        )

        # Verify the cart count updates to 1.
        self.wait.until(
            lambda driver: driver.find_element(
                By.CSS_SELECTOR, '[data-testid="cart-count"]'
            ).text.strip() == "1"
        )

        # Find the shopping-bag button.
        cart_button = self.wait.until(
            EC.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    'button[aria-label="Open shopping bag"]'
                )
            )
        )

        # Bring the button into the visible browser area.
        self.driver.execute_script(
            "arguments[0].scrollIntoView({"
            "block: 'center', inline: 'center'});",
            cart_button
        )

        self.wait.until(
            lambda driver: cart_button.is_displayed()
            and cart_button.is_enabled()
        )

        # Use JavaScript to avoid Selenium's intercepted mouse click.
        self.driver.execute_script(
            "arguments[0].click();",
            cart_button
        )

        # Verify that the shopping-bag drawer opens.
        drawer = self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, ".cart-drawer")
            )
        )

        heading = drawer.find_element(
            By.CSS_SELECTOR, ".drawer-heading"
        ).text

        self.assertIn("Your bag", heading)


if __name__ == "__main__":
    unittest.main(verbosity=2)
