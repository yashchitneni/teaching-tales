#!/usr/bin/env uv run
# /// script
# dependencies = [
#   "playwright",
# ]
# ///

from playwright.sync_api import sync_playwright
import time

def extract_image_tags(url, wait_time=5):
    try:
        with sync_playwright() as p:
            # Launch the browser in headless mode
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Navigate to the URL
            page.goto(url)
            
            # Wait for JavaScript to load (adjust wait_time as needed)
            time.sleep(wait_time)
            
            # Find all <img> elements
            image_elements = page.query_selector_all('img')
            
            # Extract and print each image tag
            if image_elements:
                for idx, img in enumerate(image_elements, start=1):
                    outer_html = img.evaluate('element => element.outerHTML')
                    print(f"Image {idx}: {outer_html}\n")
            else:
                print("No image tags found on the page.")
            
            # Close the browser
            browser.close()
    
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
if __name__ == "__main__":
    url = input("Enter the website URL: ")  # Or hardcode: 'https://example.com'
    extract_image_tags(url)