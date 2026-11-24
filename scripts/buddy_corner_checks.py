"""Shared CI browser assertions for the full-size, content-safe corner actor."""
from playwright.sync_api import expect


def assert_corner_placement(page):
    actor = page.locator('[data-buddy-actor]')
    expect(actor).to_have_count(1)
    expect(page.locator('[data-buddy-form]')).to_have_count(1)
    expect(actor).to_have_attribute('data-buddy-placement', 'corner')
    expect(actor).to_have_attribute('data-buddy-travelling', 'false')
    # Read the placement, visibility and actual canvas in a single frame.
    # A hidden actor retains its geometry when a new scroll position is crowded.
    # Playwright can observe a programmatic scroll before the browser delivers
    # its scroll event. Allow that event and the queued placement frame to paint.
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    evidence = page.wait_for_function("""() => {
      const actor = document.querySelector('[data-buddy-actor]');
      const slot = document.querySelector('[data-buddy-slot="corner"]');
      if (!actor || slot?.dataset.buddyOccupied !== 'true' || actor.dataset.buddyPlacement !== 'corner' ||
          actor.dataset.buddyTravelling !== 'false') return false;
      const state = actor.dataset.buddyCornerState;
      const clear = actor.dataset.buddyCornerClear;
      const visibility = getComputedStyle(actor).visibility;
      const result = {state, clear, slot: slot.getBoundingClientRect().toJSON()};
      if (state === 'no-clear-space') {
        return visibility === 'hidden' && actor.querySelector('[data-buddy-form]')?.dataset.buddyMotion === 'off' && result;
      }
      const body = actor.getBoundingClientRect();
      if (state !== 'clear' || visibility !== 'visible' ||
          Math.abs(body.x - Number(actor.dataset.buddyTargetX)) >= 1 ||
          Math.abs(body.y - Number(actor.dataset.buddyTargetY)) >= 1 ||
          Math.abs(body.width - Number(actor.dataset.buddyTargetSize)) >= 1) return false;
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
      return {...result, body: body.toJSON(), canvas: rect.toJSON(), conflicts};
    }""").json_value()
    width, height = page.viewport_size['width'], page.viewport_size['height']
    expected = 96 if height <= 500 else 208 if width < 640 else 288
    minimum = 96 if height <= 500 else 160 if width < 640 else 192
    slot = evidence['slot']
    assert abs(slot['width'] - expected) < 1, 'Buddy lost the enlarged responsive corner slot'
    if evidence['state'] == 'no-clear-space':
        assert evidence['clear'] == 'false', 'Hidden Buddy incorrectly marked its corner clear'
        launcher = page.locator('[data-buddy-launcher]')
        expect(launcher).to_be_visible()
        expect(launcher).to_be_enabled()
        launcher.click(trial=True)
        return False
    assert evidence['clear'] == 'true', 'Visible Buddy did not verify a clear corner'
    body = evidence['body']
    assert minimum - 1 <= body['width'] <= expected + 1, 'Buddy shrank below the readable full-body minimum'
    assert abs(body['height'] - body['width']) < 1, 'Buddy stage is distorted'
    shift = slot['x'] + slot['width'] - (body['x'] + body['width'] * 1.125)
    rise = slot['y'] + slot['height'] - body['y'] - body['height']
    assert -1 <= shift <= 97 and -1 <= rise <= 241, f'Corner search escaped its bounded neighbourhood: {shift=}, {rise=}'
    canvas = evidence['canvas']
    assert canvas['left'] >= 7 and canvas['right'] <= width - 7 and canvas['top'] >= 79 and canvas['bottom'] <= height - 7, f'Full corner artwork leaves the safe viewport: {evidence}'
    assert not evidence['conflicts'], f'Full corner artwork covers reading text or controls: {evidence}'
    return True
