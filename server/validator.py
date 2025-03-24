import sys
import os
import json
from openai import OpenAI
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import re
from dotenv import load_dotenv  # Import the dotenv library
import os
from pathlib import Path


env_path = Path(__file__).resolve().parent.parent / '.env.local'

load_dotenv(dotenv_path=env_path)
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in .env.local")

client = OpenAI(api_key=openai_api_key)

SCREENSHOT_DIR = Path("screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)

def ai_infer_submit_button(button_data):
    """Given a list of buttons, infer which is most likely the form submit button."""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant helping identify the submit button for a demo request form."},
            {"role": "user", "content": f"""
Here are the buttons available on the form submission screen:
{json.dumps(button_data, indent=2)}

Which one should be clicked to submit the demo request?

Return JSON like:
{{
  "buttonIndex": 1
}}
"""}
        ]
    )
    content = response.choices[0].message.content
    print("\U0001f501 Raw AI Output (submit button):\n", content, flush=True)
    return extract_json(content)
    
def fill_form_with_fallback(page, field_values):
    try:
        if "name" in field_values:
            name_input = page.query_selector('input[placeholder*="name" i], input[name*="name" i], input[id*="name" i]')
            if name_input:
                name_input.fill(field_values["name"])

        if "email" in field_values:
            email_input = page.query_selector('input[placeholder*="email" i], input[name*="email" i], input[id*="email" i]')
            if email_input:
                email_input.fill(field_values["email"])

        if "notes" in field_values:
            notes_input = page.query_selector('textarea')
            if notes_input:
                notes_input.fill(field_values["notes"])

    except Exception as e:
        print(f"⚠️ Fallback form filling failed: {e}", flush=True)

def send_result(name, status, message):
    print(json.dumps({"name": name, "status": status, "message": message}))
    print()
    sys.stdout.flush()

def take_screenshot(page, label):
    filename = SCREENSHOT_DIR / f"{label}_{uuid.uuid4().hex[:8]}.png"
    page.screenshot(path=str(filename), full_page=True)
    send_result(f"Screenshot: {label}", "success", f"Saved screenshot: {filename.name}")
    return str(filename)

def create_pdf_report(test_results, screenshots):
    pdf_path = f"report_{uuid.uuid4().hex[:8]}.pdf"
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Landing Page Validation Report")
    y = height - 100
    c.setFont("Helvetica", 12)
    for test in test_results:
        c.drawString(50, y, f"{test['name']}: {test['status'].upper()} - {test['message']}")
        y -= 20
        if y < 100:
            c.showPage()
            y = height - 50
    for shot in screenshots:
        y -= 30
        if y < 300:
            c.showPage()
            y = height - 50
        c.drawString(50, y, f"Screenshot: {shot}")
        y -= 250
        c.drawImage(str(SCREENSHOT_DIR / shot), 50, y, width=500, preserveAspectRatio=True, mask='auto')
    c.save()
    return pdf_path

def extract_json(content):
    matches = re.findall(r"```(?:json)?\s*({[\s\S]*?})\s*```", content, re.MULTILINE)
    if not matches:
        matches = re.findall(r"({[\s\S]*?})", content)
    for match in matches:
        cleaned = match.strip()
        if cleaned.count('{') > cleaned.count('}'):
            cleaned += "}"
        try:
            print("\U0001f4e6 Trying JSON block:\n", cleaned, flush=True)
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print("\u26a0\ufe0f Skipping invalid block:", str(e), flush=True)
            continue
    raise ValueError("\u274c No valid JSON block could be parsed from AI output.")

def ai_infer_button_and_fields(button_data, input_data):
    print(button_data)
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant helping identify demo booking buttons and form fields."},
            {"role": "user", "content": f"""
Here are some buttons on a webpage:
{json.dumps(button_data, indent=2)}

Which one is most likely for scheduling a demo?

Here are the form fields:
{json.dumps(input_data, indent=2)}

Please return a JSON like:
{{
  "buttonIndex": 2,
  "fieldValues": {{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "OpenAI"
  }}
}}
"""}
        ]
    )
    content = response.choices[0].message.content
    print("\U0001f501 Raw AI Output:\n", content, flush=True)
    return extract_json(content)

def handle_cal_booking_flow(page):
    try:
        date_button = page.query_selector("button[role='option']:not([disabled])")
        if date_button:
            date_button.click()
            page.wait_for_timeout(500)
        time_button = page.query_selector("button:has-text('am'), button:has-text('pm')")
        if time_button:
            time_button.click()
            page.wait_for_timeout(1500)
        form_fields = page.query_selector_all("input, textarea, select")
        input_data = []
        for i in form_fields:
            try:
                input_data.append({
                    "label": i.get_attribute("placeholder") or "",
                    "name": i.get_attribute("name") or "",
                    "id": i.get_attribute("id") or ""
                })
            except:
                continue
        return input_data
    except Exception as e:
        print("\u274c Error in calendar booking flow:", str(e), flush=True)
        return []

def run_test(url):
    test_results = []
    screenshots = []
    def log(name, status, message):
        test_results.append({"name": name, "status": status, "message": message})
        send_result(name, status, message)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        try:
            page.goto(url, timeout=15000)
            log("Page Accessibility", "success", "Page loaded successfully.")
            screenshots.append(Path(take_screenshot(page, "loaded")).name)
        except:
            log("Page Accessibility", "fail", "Page failed to load.")
            browser.close()
            return
        buttons = page.query_selector_all("button, a")
        inputs = page.query_selector_all("input, textarea, select")
        button_data = []
        filtered_buttons = []
        for b in buttons:
            try:
                text = b.inner_text().strip()
                if text:
                    html = b.evaluate("e => e.outerHTML")
                    button_data.append({"text": text, "html": html})
                    filtered_buttons.append(b)
            except:
                continue
        input_data = []
        for i in inputs:
            try:
                input_data.append({
                    "label": i.get_attribute("placeholder") or "",
                    "name": i.get_attribute("name") or "",
                    "id": i.get_attribute("id") or ""
                })
            except:
                continue
        try:
            ai_response = ai_infer_button_and_fields(button_data, input_data)
            print("AI Response:", ai_response, flush=True)
            log("AI Inference", "success", "OpenAI identified booking button and fields.")
        except Exception as e:
            log("AI Inference", "fail", f"OpenAI error: {str(e)}")
            browser.close()
            return
        try:
            button_index = ai_response["buttonIndex"]
            print("Button Index:", button_index, flush=True)
            if isinstance(button_index, list):
                button_index = button_index[0]
            print("----------------")
            print(buttons[int(button_index)])
            print("---------------")
            with page.context.expect_page() as new_page_info:
                filtered_buttons[int(button_index)].click()
            new_page = new_page_info.value
            new_page.wait_for_load_state()
            page = new_page  # Switch context if needed

            #page.pause()
            log("Demo Button Detection", "success", f"Clicked button at index {button_index}.")
            page.wait_for_timeout(2000)
            screenshots.append(Path(take_screenshot(page, "booking_screen")).name)
            input_data = handle_cal_booking_flow(page)
            screenshots.append(Path(take_screenshot(page, "time_selected")).name)
            try:
                ai_response = ai_infer_button_and_fields(button_data, input_data)
                print("🔁 AI Response (after booking screen):", ai_response, flush=True)
                log("AI Inference (form)", "success", "AI provided field values.")
            except Exception as e:
                log("AI Inference (form)", "fail", f"OpenAI form field inference failed: {str(e)}")
                browser.close()
                return
            fill_form_with_fallback(page, ai_response["fieldValues"])
            take_screenshot(page, "before_confirm_click")
            try:
                try:
                    ai_response = ai_infer_submit_button(button_data)
                    print("AI Response:", ai_response, flush=True)
                    log("AI Inference", "success", "OpenAI identified the submit button.")
                except Exception as e:
                    log("AI Inference", "fail", f"OpenAI error: {str(e)}")
                    browser.close()
                    return
                try:
                    button_index = ai_response["buttonIndex"]
                    print("Button Index:", button_index, flush=True)
                    if isinstance(button_index, list):
                        button_index = button_index[0]
                    filtered_buttons[int(button_index)].click()

                    log("Submit Button Click", "success", f"Clicked button at index {button_index}.")
                    screenshots.append(Path(take_screenshot(page, "after_submit_click")).name)
                except Exception as e:
                    log("Submit Button Click", "fail", f"Failed to click AI-identified button: {str(e)}")
                    browser.close()
                    return

                log("Form Validation", "success", "Form filled and submitted using AI.")
                screenshots.append(Path(take_screenshot(page, "form_submitted")).name)
            except Exception as e:
                log("Form Validation", "fail", f"Failed to fill or submit form: {e}")
                browser.close()
                return
        except:
            log("Demo Button Detection", "fail", "Failed to click AI-identified button.")
            browser.close()
            return
        try:
            page.wait_for_selector("text=Confirm", timeout=5000)
            log("Booking Process", "success", "Booking process completed.")
            log("Confirmation Page", "success", "Confirmation message found.")
            screenshots.append(Path(take_screenshot(page, "confirmation_page")).name)
        except:
            log("Booking Process", "fail", "No confirmation message found.")
            log("Confirmation Page", "fail", "Confirmation page not detected.")
        browser.close()
    try:
        pdf_path = create_pdf_report(test_results, screenshots)
        log("PDF Report", "success", f"Report generated: {pdf_path}")
    except Exception as e:
        log("PDF Report", "fail", f"Error generating report: {str(e)}")

if __name__ == "__main__":
    run_test(sys.argv[1])