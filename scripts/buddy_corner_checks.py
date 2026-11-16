"""Shared CI browser assertions for the full-size, content-safe corner actor."""
from playwright.sync_api import expect


def assert_corner_placement(page):
    actor = page.locator('[data-buddy-actor]')
    expect(actor).to_have_count(1)
    expect(page.locator('[data-buddy-form]')).to_have_count(1)
    expect(actor).to_have_attribute('data-buddy-placement', 'corner')
    expect(actor).to_have_attribute('data-buddy-travelling', 'false')
    page.wait_for_function("""() => {
      const a = document.querySelector('[data-buddy-actor]');
      if (!a || !a.dataset.buddyCornerState) return false;
      if (a.dataset.buddyCornerState === 'no-clear-space') return getComputedStyle(a).visibility === 'hidden';
      const r = a.getBoundingClientRect();
      return a.dataset.buddyCornerState === 'clear' && getComputedStyle(a).visibility === 'visible' &&
        Math.abs(r.x - Number(a.dataset.buddyTargetX)) < 1 &&
        Math.abs(r.y - Number(a.dataset.buddyTargetY)) < 1 &&
        Math.abs(r.width - Number(a.dataset.buddyTargetSize)) < 1;
    }""")
    width, height = page.viewport_size['width'], page.viewport_size['height']
    expected = 96 if height <= 500 else 208 if width < 640 else 288
    minimum = 96 if height <= 500 else 160 if width < 640 else 192
    corner_slot = page.locator('[data-buddy-slot="corner"]')
    expect(corner_slot).to_have_attribute('data-buddy-occupied', 'true')
    slot = corner_slot.bounding_box()
    assert slot and abs(slot['width'] - expected) < 1, 'Buddy lost the enlarged responsive corner slot'
    if actor.get_attribute('data-buddy-corner-state') == 'no-clear-space':
        expect(actor).to_have_attribute('data-buddy-corner-clear', 'false')
        expect(actor).to_be_hidden()
        expect(page.locator('[data-buddy-actor] [data-buddy-form]')).to_have_attribute('data-buddy-motion', 'off')
        launcher = page.locator('[data-buddy-launcher]')
        expect(launcher).to_be_visible()
        expect(launcher).to_be_enabled()
        launcher.click(trial=True)
        return False
    expect(actor).to_be_visible()
    expect(actor).to_have_attribute('data-buddy-corner-clear', 'true')
    body = actor.bounding_box()
    assert minimum - 1 <= body['width'] <= expected + 1, 'Buddy shrank below the readable full-body minimum'
    assert abs(body['height'] - body['width']) < 1, 'Buddy stage is distorted'
    shift = slot['x'] + slot['width'] - (body['x'] + body['width'] * 1.125)
    rise = slot['y'] + slot['height'] - body['y'] - body['height']
    assert -1 <= shift <= 97 and -1 <= rise <= 241, f'Corner search escaped its bounded neighbourhood: {shift=}, {rise=}'
    # Independently measure the actual canvas, visible text lines and controls.
    # No model bounds, fabricated text fixtures or smaller pointer target stand in
    # for the full arm/scenery envelope.
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    evidence = actor.evaluate("""actor => {
      const canvas = actor.querySelector('canvas'), rect = canvas.getBoundingClientRect();
      const excluded = '[data-buddy-actor], [data-buddy-widget], [data-buddy-slot], [hidden], [inert], .sr-only, .visually-hidden, script, style, noscript, template';
      const controls = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
      const visible = el => !el || ((css => css.display !== 'none' && css.visibility !== 'hidden' && css.visibility !== 'collapse' && Number(css.opacity) !== 0)(getComputedStyle(el)) && visible(el.parentElement));
      const overlap = r => r.width > 0 && r.height > 0 && rect.left < r.right && rect.right > r.left && rect.top < r.bottom && rect.bottom > r.top;
      const conflicts = [], range = document.createRange(), walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || !node.textContent.trim() || parent.closest(excluded) || !visible(parent)) continue;
        range.selectNodeContents(node);
        if ([...range.getClientRects()].some(overlap)) conflicts.push(node.textContent.trim().slice(0, 100));
      }
      for (const el of document.querySelectorAll(controls)) {
        if (!el.closest(excluded) && visible(el) && [...el.getClientRects()].some(overlap)) conflicts.push(el.outerHTML.slice(0, 120));
      }
      return {canvas:rect.toJSON(), conflicts};
    }""")
    canvas = evidence['canvas']
    assert canvas['left'] >= 7 and canvas['right'] <= width - 7 and canvas['top'] >= 79 and canvas['bottom'] <= height - 7, f'Full corner artwork leaves the safe viewport: {evidence}'
    assert not evidence['conflicts'], f'Full corner artwork covers reading text or controls: {evidence}'
    return True
