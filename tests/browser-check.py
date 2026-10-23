"""Run against the static server with Python Playwright and Chromium installed.
Usage: RAIDERS_URL=http://127.0.0.1:8002 python3 tests/browser-check.py
Test hooks are injected by browser routing and are never shipped in game.js.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = os.environ.get('RAIDERS_URL','http://127.0.0.1:8002')
ROOT = Path(__file__).resolve().parents[1]
HOOKS = '''
window.__test={
 scenario(index=0,hp=48,x=0,z=6){
   for(const e of enemies)scene.remove(e.model);enemies=[];
   player={x:0,y:0,z:11,hp:100,vy:0};yaw=0;pitch=0;keys={};firing=false;aim=false;
   cooldown=0;reloadTime=0;swapTime=0;nextWave=0;invincible=5;
   ammo=weapons.map(w=>w.capacity);setWeapon(index,true);swapTime=0;
   const enemy=addEnemy(x,z,2);enemy.hp=hp;enemy.maxHP=hp;
   camera.position.set(0,1.65,11);camera.rotation.set(0,0,0);camera.updateMatrixWorld();scene.updateMatrixWorld();syncHUD();
 },
 snapshot(){return {hp:enemies.map(e=>e.hp),ammo:[...ammo],gun:weaponIndex,mode,reloadTime,cooldown,swapTime,keys,firing,focus:document.activeElement.id,aim,y:player.y,yaw,pitch}},
 ready(){cooldown=0;swapTime=0},
 empty(){for(const e of enemies)scene.remove(e.model);enemies=[];nextWave=2.99;return wave},
 wall(){player.x=44/14*4.5;player.z=18;camera.position.set(player.x,1.65,18);for(const e of enemies){e.x=player.x;e.z=6;e.model.position.set(player.x,0,6)}scene.updateMatrixWorld()},
 boundary(){player.x=0;player.z=-21;enemies.forEach(e=>e.attack=99)},
 death(){player.hp=0;die()},
 elite(){for(const e of enemies)scene.remove(e.model);enemies=[];wave=2;spawnWave();return enemies.some(e=>e.elite&&e.maxHP>=130)},
 atWave(level){for(const e of enemies)scene.remove(e.model);enemies=[];wave=level-1;spawnWave();return {count:enemies.length,elites:enemies.filter(e=>e.elite).length,hp:Math.min(...enemies.map(e=>e.maxHP)),speed:Math.min(...enemies.map(e=>e.speed))}},
 audio(){return {context:audio.context?.state,muted:audio.muted,music:audio.musicVolume,effects:audio.effectsVolume}},
 audioProbe(){const analyser=audio.context.createAnalyser();analyser.fftSize=1024;audio.master.connect(analyser);window.__analyser=analyser;audio.shot(2)},
 energy(){const data=new Float32Array(1024);window.__analyser.getFloatTimeDomainData(data);return data.reduce((a,v)=>a+v*v,0)/1024}
};
'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    errors=[]
    def configure(page):
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('**/game.js',lambda route:route.fulfill(body=(ROOT/'game.js').read_text()+HOOKS,content_type='text/javascript'))
    page=browser.new_page(viewport={'width':960,'height':640});configure(page)
    page.goto(BASE);page.wait_for_function('window.__test')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('[data-raider="2"]').click();assert page.locator('#hero-name').inner_text()=='Orange Crush'
    page.locator('#play').click();page.wait_for_function('raiderStatus().mode==="playing"')
    assert page.evaluate('raiderStatus().scenery.grass')>1000
    assert page.evaluate('raiderStatus().scenery.flowers')>100
    assert page.evaluate('raiderStatus().engine')=='Three.js WebGL 3D'
    assert page.evaluate('__test.audio().context')=='running'
    # Real key input fires raycast bullets at a known 3D mesh.
    for index in range(3):
        page.evaluate(f'__test.scenario({index},1000)');page.wait_for_timeout(100)
        page.keyboard.press('Space');page.wait_for_timeout(100)
        state=page.evaluate('__test.snapshot()')
        assert state['ammo'][index]==[15,29,5][index],state
        assert state['hp'][0]<1000,state
        page.keyboard.press('r');assert page.evaluate('__test.snapshot().reloadTime')>0
        page.wait_for_function('__test.snapshot().reloadTime===0',timeout=30000)
        assert page.evaluate('__test.snapshot().ammo')[index]==[16,30,6][index]
    page.evaluate('__test.scenario(0,25)');page.wait_for_timeout(80);page.keyboard.press('Space')
    page.wait_for_function('raiderStatus().score>=100');assert page.evaluate('raiderStatus().kills')>=1
    # Wall cover stops a centre ray even with an enemy lined up behind it.
    page.evaluate('__test.scenario(1,1000);__test.wall()');page.wait_for_timeout(80);page.keyboard.press('Space');page.wait_for_timeout(100)
    assert page.evaluate('__test.snapshot().hp[0]')==1000
    # Shotgun damage stops at its configured range.
    page.evaluate('__test.scenario(2,1000,0,-12)');page.wait_for_timeout(80);page.keyboard.press('Space');page.wait_for_timeout(100)
    assert page.evaluate('__test.snapshot().hp[0]')==1000
    page.evaluate('__test.scenario(1,1000)');page.wait_for_timeout(80)
    page.keyboard.down('Space');page.wait_for_function('__test.snapshot().ammo[1]<28',timeout=30000);page.keyboard.up('Space')
    assert page.evaluate('__test.snapshot().ammo[1]')<28
    page.mouse.down(button='right');page.wait_for_timeout(80);assert page.evaluate('__test.snapshot().aim');page.mouse.up(button='right')
    page.keyboard.press('e');page.wait_for_function('__test.snapshot().y>0')
    page.evaluate('__test.boundary()');page.keyboard.down('w');page.wait_for_timeout(600);page.keyboard.up('w')
    assert page.evaluate('raiderStatus().position.z')>=-21.2
    old=page.evaluate('__test.empty()');page.wait_for_function(f'raiderStatus().wave>{old}')
    assert page.evaluate('__test.elite()')
    levels=[page.evaluate(f'__test.atWave({w})') for w in [1,3,6,12]]
    assert [v['count'] for v in levels]==[6,8,11,17],levels
    assert [v['elites'] for v in levels]==[0,1,2,4],levels
    assert all(levels[i+1]['hp']>levels[i]['hp'] and levels[i+1]['speed']>levels[i]['speed'] for i in range(3))
    page.evaluate('__test.atWave(1)')
    page.keyboard.press('Escape');page.locator('#resume').wait_for();assert page.evaluate('raiderStatus().mode')=='paused'
    page.locator('#resume').click();page.wait_for_function('raiderStatus().mode==="playing"')
    page.evaluate('__test.death()');page.locator('#restart').click();page.wait_for_function('raiderStatus().health===100')
    # The Web Audio output contains actual non-zero samples.
    page.evaluate('__test.audioProbe()');page.wait_for_timeout(30);assert page.evaluate('__test.energy()')>.000001
    page.keyboard.press('Escape');page.locator('#back-home').click();page.locator('#menu').wait_for()
    page.locator('#sound').click();assert page.evaluate('__test.audio().muted')
    page.locator('.audio-settings summary').click();page.locator('#music-volume').focus();page.keyboard.press('Home');[page.keyboard.press('ArrowRight') for _ in range(4)];page.locator('#effects-volume').focus();page.keyboard.press('Home');[page.keyboard.press('ArrowRight') for _ in range(10)]
    assert page.evaluate('__test.audio().music')==.2;assert page.evaluate('__test.audio().effects')==.5
    print('PASS desktop: real WebGL rendering, 3D ray hits, all weapons, magazines/reloads, auto fire, wall occlusion, shotgun range, aiming, hopping, collision, escalating waves/elites, meadow scenery, death/restart, pause, selection, nonzero synthesized audio, mute/mix sliders.',flush=True)
    page.close()
    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);configure(mobile)
    mobile.goto(BASE);mobile.wait_for_function('window.__test');assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
    mobile.locator('[data-raider="3"]').tap();mobile.locator('#play').tap();mobile.locator('#touch').wait_for()
    mobile.locator('[data-weapon="1"]').tap();assert mobile.evaluate('raiderStatus().weapon')=='VIBE RIFLE'
    mobile.evaluate('__test.ready()');mobile.locator('#fire').tap();assert mobile.evaluate('raiderStatus().ammo')<30
    mobile.locator('#aim').tap();assert mobile.locator('#aim').get_attribute('aria-pressed')=='true'
    # A real touch drag turns the camera, not just a synthetic mouse event.
    cdp=mobile.context.new_cdp_session(mobile)
    before=mobile.evaluate('__test.snapshot().yaw')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':210,'y':350}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':270,'y':365}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    assert mobile.evaluate('__test.snapshot().yaw')!=before
    mobile.locator('#pause').tap();mobile.locator('#resume').wait_for();mobile.locator('#resume').tap()
    mobile.screenshot(path='/tmp/raiders-3d-mobile.png')
    assert not errors,errors
    print('PASS mobile: layout, crew selection, 3D launch, touch firing, weapon selection, aim toggle, touch-drag look, pause/resume; no browser JavaScript errors.',flush=True)
    browser.close()
