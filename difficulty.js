// Every wave increases health and pressure; active counts stay bounded for mobile.
export function waveDifficulty(wave) {
  const level=Math.max(1,Math.floor(wave));
  return {
    count:Math.min(5+level,24),
    health:48+(level-1)*7,
    eliteHealth:130+(level-1)*13,
    speed:1.35+Math.min(level-1,20)*.075,
    damage:10+Math.floor((level-1)/2),
    attackInterval:Math.max(.5,.9-(level-1)*.018),
    elites:level<3?0:Math.min(6,1+Math.floor((level-3)/3)),
    label:level<4?'WARMING UP':level<8?'PRESSURE RISING':level<13?'HIGH ALERT':'OVERDRIVE'
  };
}
