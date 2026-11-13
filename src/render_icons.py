from playwright.sync_api import sync_playwright
import pathlib
svg = pathlib.Path('logo.svg').read_text()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for size, name, pad in [(512,'icon-maskable-512.png','logo-maskable.svg'),(512,'icon-512.png',0),(192,'icon-192.png',0),(180,'apple-touch-icon.png',0),(48,'favicon-48.png',0)]:
        pg = b.new_page(viewport={'width':size,'height':size})
        src = pathlib.Path(pad).read_text() if pad else svg
        pg.set_content(f'<html><body style="margin:0">{src.replace("<svg ", f"<svg width=\"{size}\" height=\"{size}\" ",1)}</body></html>')
        pg.screenshot(path=f'icons/{name}', omit_background=False); pg.close()
    # rounded preview as it looks on a phone
    pg = b.new_page(viewport={'width':300,'height':300})
    pg.set_content(f'<html><body style="margin:0;background:#20202a;display:grid;place-items:center;height:300px"><div style="width:200px;height:200px;border-radius:46px;overflow:hidden">{svg.replace("<svg ", "<svg width=\"200\" height=\"200\" ",1)}</div></body></html>')
    pg.screenshot(path='icons/preview.png'); b.close()
