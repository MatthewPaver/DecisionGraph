"""Browser QA for the evidence-first DecisionGraph journey."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "http://127.0.0.1:4190"


def assert_no_overflow(page):
    assert page.evaluate(
        "document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    failures = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("requestfailed", lambda request: failures.append(request.url))
    page.goto(BASE_URL, wait_until="networkidle")

    assert page.get_by_role("heading", name="What happened last time?").is_visible()
    assert page.locator("#caseResults .case-card").count() == 3
    assert page.locator("#evidenceStrength").inner_text() == "3 COMPARABLE CASES"
    assert "synthetic precedents" in page.locator("#evidenceBoundary").inner_text()
    page.get_by_role("button", name="Save proposal to review queue").click()
    assert page.locator('[data-view-panel="memory"]').is_visible()
    assert page.locator("#memoryTimeline .timeline-item").count() == 4
    assert_no_overflow(page)
    page.screenshot(path=str(ROOT / "docs" / "decisiongraph-overview.png"), full_page=True)

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.goto(BASE_URL, wait_until="networkidle")
    assert mobile.locator("#caseResults .case-card").count() == 3
    assert_no_overflow(mobile)
    mobile.screenshot(path=str(ROOT / "docs" / "decisiongraph-mobile.png"), full_page=True)

    assert not errors, errors
    assert not failures, failures
    browser.close()

print("DecisionGraph browser QA passed: retrieval, review queue and mobile")
