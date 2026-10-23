import assert from 'node:assert/strict';
import {waveDifficulty} from '../difficulty.js';
let previous=waveDifficulty(1);
assert.equal(previous.count,6);
assert.equal(previous.elites,0);
for(let wave=2;wave<=60;wave++){
  const next=waveDifficulty(wave);
  assert.ok(next.health>previous.health,`health must rise at wave ${wave}`);
  assert.ok(next.eliteHealth>previous.eliteHealth);
  assert.ok(next.count>=previous.count&&next.count<=24);
  assert.ok(next.speed>=previous.speed&&next.speed<4.3,'enemies stay slower than player walking');
  assert.ok(next.damage>=previous.damage);
  assert.ok(next.attackInterval<=previous.attackInterval&&next.attackInterval>=.5);
  assert.ok(next.elites>=previous.elites&&next.elites<=6&&next.elites<next.count);
  previous=next;
}
assert.equal(waveDifficulty(3).elites,1);
assert.equal(waveDifficulty(6).elites,2);
assert.equal(waveDifficulty(12).elites,4);
assert.ok(waveDifficulty(12).health>waveDifficulty(3).health*1.7);
console.log('PASS difficulty: 60 waves, escalating health/pressure, elite progression, bounded enemy count and movement speed.');
