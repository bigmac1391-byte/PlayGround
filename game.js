const initialState = {
  crew: 24,
  morale: 68,
  supplies: 64,
  shields: 78,
  scrap: 24,
  reputation: 0,
  weapon: 'Service blaster',
  armor: 'Flight suit',
  weaponBonus: 1,
  armorBonus: 0,
  inventory: ['Service blaster', 'Flight suit'],
  combatAction: 'attack',
  combatResult: null,
  expansionStep: 0,
  expansionDone: false,
  screen: 'story',
  chapter: 'Launch',
  visited: new Set(),
  log: ['Navigator online. Verge of the Ashen Verge.'],
  ending: null,
  currentKey: 'ambush',
};

const story = {
  intro: {
    title: 'Departure',
    badge: 'Sector 7',
    text: 'The colony ship <strong>Arbiter</strong> breaks free of the wormgate, but the route ahead is fractured by a storm of unstable stars. The crew needs your call on every risky decision.',
    choices: [
      { label: 'Path 1', text: 'Head for the ice moon of Nivara and salvage ancient relay beacons.', effect: { supplies: -8, scrap: 4, reputation: 2 }, next: 'nivara' },
      { label: 'Path 2', text: 'Follow the signal bloom toward the derelict convoy in deep space.', effect: { crew: -2, morale: 4, supplies: -6, scrap: 6, reputation: 3 }, next: 'convoy' },
      { label: 'Path 3', text: 'Stay on the long route and negotiate a fragile convoy escort.', effect: { morale: -4, supplies: -4, reputation: 1 }, next: 'escort' }
    ]
  },
  ambush: {
    title: 'Ambush at the Verge',
    badge: 'D20 Encounter',
    text: 'A raider skiff drops out of the storm and locks onto the Arbiter. Choose your approach, then roll a d20. A natural 20 is a critical success; a natural 1 is a critical failure.',
    type: 'combat'
  },
  nivara: {
    title: 'Ice Moon',
    badge: 'Restock',
    text: 'The moon is a frozen vault of old communications pylons. A local mining drone offers access to hidden caches—if you are willing to risk a short but dangerous descent.',
    choices: [
      { label: 'Route A', text: 'Trust the drone and sweep the caverns for relic supplies.', effect: { crew: -1, supplies: 10, scrap: 8, morale: 6, reputation: 2 }, next: 'relay' },
      { label: 'Route B', text: 'Stay on the surface, set up a beacon, and keep your crew together.', effect: { morale: 4, shields: 5, reputation: 1 }, next: 'icebound' },
      { label: 'Route C', text: 'Cut the drone free and move on before the moon shards collapse around you.', effect: { morale: -2, reputation: -1 }, next: 'stormfront' }
    ]
  },
  convoy: {
    title: 'Ghost Convoy',
    badge: 'Signal',
    text: 'The convoy drifted for centuries. Inside are emergency pods, war-rusted hulls, and a single surviving navigator still clinging to life.',
    choices: [
      { label: 'Route A', text: 'Rescue the navigator and secure the cargo bay before the driftfield closes.', effect: { crew: 1, morale: 8, supplies: 12, scrap: 10, reputation: 4 }, next: 'salvation' },
      { label: 'Route B', text: 'Strip the hull for material and leave no trace of the ghost ship.', effect: { morale: -6, scrap: 14, reputation: -2 }, next: 'outcast' },
      { label: 'Route C', text: 'Set a blockade and force the convoy to surrender its core data.', effect: { crew: -3, morale: -4, reputation: 2 }, next: 'truce' }
    ]
  },
  escort: {
    title: 'Escort Line',
    badge: 'Diplomacy',
    text: 'A convoy of settlers begs for escort through the ion reefs. Their demands are reasonable, but the route is a gauntlet of plasma storms and pirates.',
    choices: [
      { label: 'Route A', text: 'Commit your ship to the escort and hold the line at all costs.', effect: { morale: 4, shields: -10, supplies: -8, reputation: 6 }, next: 'banner' },
      { label: 'Route B', text: 'Offer armed escort only to the strongest cargo and leave the rest behind.', effect: { supplies: -4, reputation: 2 }, next: 'compromise' },
      { label: 'Route C', text: 'Refuse the escort and charge the settlers for a safe corridor.', effect: { scrap: 8, reputation: -5, morale: -4 }, next: 'mercantile' }
    ]
  },
  relay: {
    title: 'Signal Lattice',
    badge: 'Ancient Tech',
    text: 'The relic relay hums to life. With the right calibration, it can guide the entire sector to a safe corridor—but every second increases the risk of a starfire pulse.',
    choices: [
      { label: 'Route A', text: 'Sync the relay to the Arbiter and broadcast a new path through the storm.', effect: { reputation: 6, morale: 8, shields: -6, supplies: -10 }, next: 'finale' },
      { label: 'Route B', text: 'Capture the data core and sell it to the next warlord you meet.', effect: { scrap: 14, reputation: -4, morale: -5 }, next: 'finale' },
      { label: 'Route C', text: 'Disconnect the relay and leave the dead network to rest.', effect: { morale: -2, reputation: 1 }, next: 'finale' }
    ]
  },
  icebound: {
    title: 'Frozen Vigil',
    badge: 'Hold Position',
    text: 'Your crew stabilizes a beacon above the moon and learns that a nearby faction has been hunting for the same old signal. The odds are good—but the cold is merciless.',
    choices: [
      { label: 'Route A', text: 'Deploy the beacon and foster a truce with the local mines.', effect: { reputation: 5, morale: 8, supplies: 4 }, next: 'finale' },
      { label: 'Route B', text: 'Arm the miners and chase off the rival faction by force.', effect: { morale: 2, reputation: 1, crew: -4, shields: -8 }, next: 'finale' },
      { label: 'Route C', text: 'Leave the moon under cover and make for the black rim before dawn.', effect: { morale: -2, supplies: -3 }, next: 'finale' }
    ]
  },
  stormfront: {
    title: 'Storm Front',
    badge: 'Risk',
    text: 'You are in the path of a stellar weather surge. The route to safety splits between the scorched asteroid ring and a narrow breach near a red giant.',
    choices: [
      { label: 'Route A', text: 'Thread the breach and trust your pilot’s intuition.', effect: { morale: 5, shields: -12, crew: -2 }, next: 'finale' },
      { label: 'Route B', text: 'Use the asteroid ring to absorb the shock and buy time.', effect: { morale: -3, supplies: -5, shields: -6 }, next: 'finale' },
      { label: 'Route C', text: 'Fight the storm head-on and gut the ship for speed.', effect: { morale: -8, crew: -6, shields: -18 }, next: 'finale' }
    ]
  },
  salvation: {
    title: 'Safe Harbor',
    badge: 'Saved',
    text: 'The navigator survives, the cargo is intact, and your crew learns that a chain of habitations beyond the storm is waiting for a brave escort line.',
    choices: [
      { label: 'Route A', text: 'Lead the new settlements into the safe corridor.', effect: { reputation: 10, morale: 12 }, next: 'finale' },
      { label: 'Route B', text: 'Keep the cargo secret and establish your own trading lane.', effect: { scrap: 18, reputation: 4 }, next: 'finale' },
      { label: 'Route C', text: 'Share the route freely, turning the sector into a beacon of hope.', effect: { morale: 10, reputation: 8 }, next: 'finale' }
    ]
  },
  outcast: {
    title: 'The Price of Silence',
    badge: 'Hard Choice',
    text: 'The ghost convoy was a treasure trove. Your crew is richer, but the navigators of the fringe now mark you as a thief and a coward.',
    choices: [
      { label: 'Route A', text: 'Turn the salvage into a new independent colony ship.', effect: { scrap: 16, reputation: 2, morale: 6 }, next: 'finale' },
      { label: 'Route B', text: 'Spend the salvage to recruit a mercenary escort fleet.', effect: { morale: 4, crew: 3, reputation: -2 }, next: 'finale' },
      { label: 'Route C', text: 'Sell the knowledge and vanish behind the dark lane.', effect: { scrap: 10, reputation: -8, morale: -4 }, next: 'finale' }
    ]
  },
  truce: {
    title: 'Captured Gate',
    badge: 'Conflict',
    text: 'The convoy fights back with an old defense lattice. You take the data, but the result leaves your own crew questioning every oath you made.',
    choices: [
      { label: 'Route A', text: 'Use the data to rebuild a treaty corridor for all factions.', effect: { reputation: 7, morale: 6 }, next: 'finale' },
      { label: 'Route B', text: 'Sell the data to the highest bidder and rewrite the path for your own fleet.', effect: { scrap: 20, reputation: -4 }, next: 'finale' },
      { label: 'Route C', text: 'Destroy the data and leave the sector to fend for itself.', effect: { morale: -8, reputation: -6 }, next: 'finale' }
    ]
  },
  banner: {
    title: 'The Banner Holds',
    badge: 'Bravery',
    text: 'Your escort line ships through the reefs under fire, and the settlers survive. The victory is heroic, but its cost is written across every hull plate.',
    choices: [
      { label: 'Route A', text: 'Found a mutual defense league from the survivors.', effect: { reputation: 10, morale: 10 }, next: 'finale' },
      { label: 'Route B', text: 'Keep the league secret and profit from the contracts.', effect: { scrap: 14, reputation: 5 }, next: 'finale' },
      { label: 'Route C', text: 'Disband the fleet and return to a quiet route of trade.', effect: { morale: -2, reputation: 1 }, next: 'finale' }
    ]
  },
  compromise: {
    title: 'Controlled Passage',
    badge: 'Measured',
    text: 'The escorts stabilize the route long enough for the settlers to survive. It is not glory, but it is order in a chaotic sector.',
    choices: [
      { label: 'Route A', text: 'Declare a strict trade charter to keep the route safe.', effect: { reputation: 6, morale: 5, supplies: 4 }, next: 'finale' },
      { label: 'Route B', text: 'Convince the settlers to arm themselves and keep the route independent.', effect: { morale: 7, reputation: 3 }, next: 'finale' },
      { label: 'Route C', text: 'Abandon the charter and sell the route to the black market.', effect: { scrap: 12, reputation: -5 }, next: 'finale' }
    ]
  },
  mercantile: {
    title: 'The Price of Isolation',
    badge: 'Isolation',
    text: 'The settlers leave in anger, and your crew learns that a system without trust is one without future. You still keep the cargo lanes open.',
    choices: [
      { label: 'Route A', text: 'Use the profit to build a private corridor and own the route.', effect: { scrap: 22, reputation: -3 }, next: 'finale' },
      { label: 'Route B', text: 'Share the route for a fee and become the sector’s indispensable broker.', effect: { scrap: 14, reputation: 4 }, next: 'finale' },
      { label: 'Route C', text: 'Refuse the route and become a lone operator in the cold dark.', effect: { morale: -6, reputation: -8 }, next: 'finale' }
    ]
  },
  finale: {
    title: 'Final Horizon',
    badge: 'Endgame',
    text: 'The storm breaks. The route ahead opens, and the Arbiter reaches the edge of the Ashen Verge. The sector is waiting for a leader—and they are looking at you.',
    choices: [
      { label: 'Final act', text: 'Claim the sector as a new home for every refugee and every dreamer.', effect: { morale: 8, reputation: 10, crew: 2 }, next: 'ending' },
      { label: 'Final act', text: 'Take the route for your own fleet and build a private empire from the wreckage.', effect: { scrap: 18, reputation: 2 }, next: 'ending' },
      { label: 'Final act', text: 'Sunset the Arbiter and drift into a quiet, unclaimed future.', effect: { morale: -4, reputation: -2 }, next: 'ending' }
    ]
  },
  ending: {
    title: 'The New Horizon',
    badge: 'Outcome',
    text: 'The dust settles. You have shaped the future of the frontier—or doomed it. The wider sector will judge your name around every table and every star.',
    choices: []
  }
};

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function applyEffects(state, effect = {}) {
  Object.entries(effect).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(state, key)) return;
    state[key] += value;
  });

  state.crew = clamp(state.crew, 0, 99);
  state.morale = clamp(state.morale, 0, 100);
  state.supplies = clamp(state.supplies, 0, 100);
  state.shields = clamp(state.shields, 0, 100);
  state.scrap = clamp(state.scrap, 0, 999);
  state.reputation = clamp(state.reputation, -20, 20);
}

const shopItems = [
  { id: 'coil-carbine', name: 'Coil Carbine', kind: 'weapon', price: 12, bonus: 2, detail: '+2 to attack checks. Reliable, low-recoil burst fire.' },
  { id: 'arc-lance', name: 'Arc Lance', kind: 'weapon', price: 22, bonus: 4, detail: '+4 to attack checks. A heavy close-range shock weapon.' },
  { id: 'reinforced-suit', name: 'Reinforced Suit', kind: 'armor', price: 14, bonus: 1, detail: '+1 to maneuver checks while evading danger.' },
  { id: 'phaseweave', name: 'Phaseweave Rig', kind: 'armor', price: 24, bonus: 3, detail: '+3 to maneuver checks. Experimental and light.' },
  { id: 'field-rations', name: 'Field Rations', kind: 'supply', price: 8, detail: 'Restore 22 supply points (up to 100).' },
  { id: 'medkit', name: 'Crew Medkit', kind: 'medkit', price: 10, detail: 'Recover 2 crew after the ambush.' }
];

const expansionScenes = [
  {
    title: 'Free Episode: The Quiet Signal',
    badge: 'Bonus Chapter 01',
    text: 'A faint distress pulse comes from a habitat hidden in the Verge. This free story chapter is optional and carries no premium currency or paywall.',
    choices: [
      { text: 'Answer openly and risk revealing your position.', effect: { reputation: 3, morale: 4 } },
      { text: 'Send a drone with food and keep the ship concealed.', effect: { supplies: -5, reputation: 2, morale: 2 } },
      { text: 'Ignore it; the signal could be bait.', effect: { supplies: 3, reputation: -1 } }
    ]
  },
  {
    title: 'The Habitat Below',
    badge: 'Bonus Chapter 02',
    text: 'The station is running on its last reactor cell. Its keeper, Imani, says the signal was meant for an old fleet that never came. You can still help them reach a safe orbit.',
    choices: [
      { text: 'Share your navigation charts and guide their escape.', effect: { supplies: -4, reputation: 3, morale: 3 } },
      { text: 'Trade spare parts for the keeper’s star map.', effect: { scrap: 5, supplies: 2 } },
      { text: 'Offer a berth aboard the Arbiter to the station’s families.', effect: { crew: 2, supplies: -6, morale: 4 } }
    ]
  },
  {
    title: 'A Signal Returned',
    badge: 'Bonus Chapter 03',
    text: 'The habitat’s beacon lights up. A dozen small ships answer from the dark: scattered descendants of the missing fleet, finally reunited by your choice.',
    choices: [
      { text: 'Invite them to join the frontier alliance.', effect: { reputation: 4, morale: 4 } },
      { text: 'Give them the route and let them choose their own future.', effect: { reputation: 2, supplies: 3 } },
      { text: 'Ask them to escort your colony through the next passage.', effect: { shields: 5, reputation: 1 } }
    ]
  }
];

function createStats(state) {
  const stats = [
    { label: 'Crew', value: state.crew },
    { label: 'Morale', value: `${state.morale}%` },
    { label: 'Supplies', value: `${state.supplies}%` },
    { label: 'Shields', value: `${state.shields}%` },
    { label: 'Scrap', value: state.scrap },
    { label: 'Rep', value: `${state.reputation}` }
  ];

  const wrapper = document.getElementById('stats');
  wrapper.innerHTML = '';
  stats.forEach(({ label, value }) => {
    const el = document.createElement('div');
    el.className = 'stat-card';
    el.innerHTML = `
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    `;
    wrapper.appendChild(el);
  });
}

function updateLog(state) {
  const logList = document.getElementById('logList');
  logList.innerHTML = '';
  state.log.slice(-5).reverse().forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = entry;
    logList.appendChild(item);
  });
}

function getEndingTone(state) {
  const score = state.reputation + Math.floor(state.morale / 10) + Math.floor(state.supplies / 10) - Math.floor(state.crew / 10);
  if (score >= 14) return { tone: 'good', message: 'The frontier accepts your leadership and the sector begins to thrive.' };
  if (score <= 3) return { tone: 'danger', message: 'Your choices leave the sector fractured, bitter, and unable to trust the next generation.' };
  return { tone: 'warn', message: 'A mixed legacy: the route is open, but the cost remains heavy and the future is uncertain.' };
}

function renderShop(state) {
  const sceneEl = document.getElementById('scene');
  const cards = shopItems.map((item) => {
    const owned = state.inventory.includes(item.id);
    const equipped = (item.kind === 'weapon' && state.weapon === item.name)
      || (item.kind === 'armor' && state.armor === item.name);
    const status = equipped ? 'Equipped' : owned ? 'Owned' : `${item.price} scrap`;
    const disabled = (owned && item.kind !== 'supply' && item.kind !== 'medkit') || state.scrap < item.price;
    const buttonText = equipped ? 'Equipped' : owned ? 'Already owned' : state.scrap < item.price ? 'Not enough scrap' : 'Purchase';
    return `<article class="shop-item">
      <div class="shop-item-head"><span class="choice-tag">${item.kind}</span><span class="shop-cost">${status}</span></div>
      <h3>${item.name}</h3><p>${item.detail}</p>
      <button class="choice-btn shop-buy" data-item="${item.id}" type="button" ${disabled ? 'disabled' : ''}><strong>${buttonText}</strong></button>
    </article>`;
  }).join('');

  sceneEl.innerHTML = `<div class="scene-top"><h2>Shipyard & Supply Deck</h2><span class="scene-badge">${state.scrap} scrap available</span></div>
    <div class="scene-body shop-layout"><div class="story-copy">
      <p>Upgrade the Arbiter before you commit to the Verge. Bought weapons and suits stay in your inventory; equipping a new one is free. Consumables take effect immediately.</p>
      <div class="shop-grid">${cards}</div>
    </div><aside class="side-panel">
      <div class="mission-box"><h3>Loadout</h3><p><strong>Weapon:</strong> ${state.weapon} (+${state.weaponBonus})<br><strong>Suit:</strong> ${state.armor} (+${state.armorBonus})</p></div>
      <div class="mission-box"><h3>Free expansions</h3><p>The Quiet Signal bonus episode is included at no cost. Open it any time from the top bar.</p></div>
      <button id="returnFromShop" class="ghost-btn" type="button">Return to voyage</button>
    </aside></div>`;

  sceneEl.querySelectorAll('.shop-buy').forEach((button) => {
    button.addEventListener('click', () => {
      const item = shopItems.find((entry) => entry.id === button.dataset.item);
      if (!item || state.scrap < item.price) return;
      if (item.kind !== 'supply' && item.kind !== 'medkit' && state.inventory.includes(item.id)) return;
      state.scrap -= item.price;
      if (item.kind === 'weapon') {
        state.inventory.push(item.id);
        state.weapon = item.name;
        state.weaponBonus = item.bonus;
        state.log.push(`Purchased and equipped ${item.name}.`);
      } else if (item.kind === 'armor') {
        state.inventory.push(item.id);
        state.armor = item.name;
        state.armorBonus = item.bonus;
        state.log.push(`Purchased and equipped ${item.name}.`);
      } else if (item.kind === 'supply') {
        state.supplies = clamp(state.supplies + 22, 0, 100);
        state.log.push('Field rations restored 22 supplies.');
      } else {
        state.crew = clamp(state.crew + 2, 0, 99);
        state.log.push('A crew medkit restored two crew.');
      }
      renderGame(state);
    });
  });
  document.getElementById('returnFromShop').addEventListener('click', () => {
    state.screen = 'story';
    renderGame(state);
  });
}

function renderCombat(state, scene) {
  const sceneEl = document.getElementById('scene');
  const result = state.combatResult;
  const actionLabels = { attack: 'Fire weapon', maneuver: 'Evasive maneuver', negotiate: 'Open a channel' };
  const actionInfo = {
    attack: `Attack bonus: +${state.weaponBonus} weapon + ${Math.floor(state.morale / 25)} morale`,
    maneuver: `Maneuver bonus: +${state.armorBonus} suit + 2 pilot training`,
    negotiate: `Diplomacy bonus: +${Math.floor(state.reputation / 2)} reputation + ${Math.floor(state.morale / 20)} morale`
  };
  sceneEl.innerHTML = `<div class="scene-top"><h2>${scene.title}</h2><span class="scene-badge">${scene.badge}</span></div>
    <div class="scene-body combat-layout"><div class="story-copy">
      <p>${scene.text}</p>
      <div class="combat-console">
        <div class="enemy-card"><span class="eyebrow">Hostile contact · threat 14</span><strong>Verge Raider Skiff</strong><p>Hull 1 · Disruptor lock active</p></div>
        ${result ? `<div class="roll-result ${result.success ? 'good' : 'danger'}"><span class="die-face">${result.roll}</span><div><strong>${result.headline}</strong><p>d20 ${result.roll} + ${result.bonus} = ${result.total} vs DC ${result.dc}. ${result.message}</p></div></div>
          <button id="continueCombat" class="choice-btn" type="button"><strong>Continue to the Verge</strong></button>` : `<div class="action-list" role="group" aria-label="Combat approach">
          ${Object.entries(actionLabels).map(([key, label]) => `<button class="action-btn ${state.combatAction === key ? 'selected' : ''}" data-action="${key}" type="button"><strong>${label}</strong><span>${actionInfo[key]}</span></button>`).join('')}
        </div><button id="rollCombat" class="roll-btn" type="button">🎲 Roll d20 — ${actionLabels[state.combatAction]}</button><p class="dice-note">Natural 20: critical success · Natural 1: critical failure</p>`}
      </div>
    </div><aside class="side-panel"><div class="mission-box"><h3>Equipped</h3><p><strong>${state.weapon}</strong><br>Weapon bonus +${state.weaponBonus}<br><br><strong>${state.armor}</strong><br>Maneuver bonus +${state.armorBonus}</p></div><div class="outcome-box warn"><h3>Check</h3><p>Roll a d20 and add the bonus for your chosen approach. Meet or beat the DC to turn the ambush in your favor.</p></div></aside></div>`;

  if (result) {
    document.getElementById('continueCombat').addEventListener('click', () => {
      state.currentKey = 'intro';
      state.chapter = 'Departure';
      state.combatResult = null;
      renderGame(state);
    });
    return;
  }
  sceneEl.querySelectorAll('.action-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.combatAction = button.dataset.action;
      renderGame(state);
    });
  });
  document.getElementById('rollCombat').addEventListener('click', () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonuses = {
      attack: state.weaponBonus + Math.floor(state.morale / 25),
      maneuver: state.armorBonus + 2,
      negotiate: Math.floor(state.reputation / 2) + Math.floor(state.morale / 20)
    };
    const dc = state.combatAction === 'maneuver' ? 15 : state.combatAction === 'negotiate' ? 13 : 14;
    const bonus = bonuses[state.combatAction];
    const total = roll + bonus;
    const success = roll === 20 || (roll !== 1 && total >= dc);
    let headline;
    let message;
    if (success) {
      headline = roll === 20 ? 'Critical success!' : 'Success — raider disabled';
      message = state.combatAction === 'negotiate' ? 'The raider accepts your ceasefire and shares its salvage.' : 'The skiff breaks off and its salvage is yours.';
      applyEffects(state, { scrap: roll === 20 ? 14 : 8, shields: 6, reputation: 2, morale: 3 });
    } else {
      headline = roll === 1 ? 'Critical failure!' : 'Failed check — impact sustained';
      message = 'The raider slips away after scoring a hit on the Arbiter.';
      applyEffects(state, { shields: roll === 1 ? -24 : -14, crew: roll === 1 ? -3 : -1, morale: -2 });
    }
    state.combatResult = { roll, bonus, total, dc, success, headline, message };
    state.log.push(`${headline} (d20 ${roll} + ${bonus} vs DC ${dc}).`);
    renderGame(state);
  });
}

function renderExpansion(state) {
  const sceneEl = document.getElementById('scene');
  if (state.expansionStep >= expansionScenes.length) {
    sceneEl.innerHTML = `<div class="scene-top"><h2>The Quiet Signal</h2><span class="scene-badge">Free expansion complete</span></div><div class="scene-body"><div class="story-copy"><p>The habitat has a future, and the signal is no longer unanswered. Your choices in this bonus chapter have been added to the voyage ledger.</p><div class="outcome-box good"><h3>Chapter reward</h3><p>+8 reputation for bringing the scattered fleet together.</p></div><button id="finishExpansion" class="choice-btn" type="button"><strong>Return to your voyage</strong></button></div><aside class="side-panel"><div class="mission-box"><h3>Included content</h3><p>Three short scenes, multiple outcomes, and no purchase required.</p></div></aside></div>`;
    if (!state.expansionRewarded) {
      state.reputation = clamp(state.reputation + 8, -20, 20);
      state.expansionRewarded = true;
      state.log.push('Completed the free Quiet Signal episode (+8 reputation).');
      createStats(state);
      updateLog(state);
    }
    document.getElementById('finishExpansion').addEventListener('click', () => {
      state.screen = 'story';
      state.expansionDone = true;
      renderGame(state);
    });
    return;
  }
  const episode = expansionScenes[state.expansionStep];
  sceneEl.innerHTML = `<div class="scene-top"><h2>${episode.title}</h2><span class="scene-badge">${episode.badge}</span></div><div class="scene-body"><div class="story-copy"><p>${episode.text}</p><div class="choice-list">${episode.choices.map((choice, index) => `<button class="choice-btn expansion-choice" data-index="${index}" type="button"><strong>${choice.text}</strong></button>`).join('')}</div></div><aside class="side-panel"><div class="mission-box"><h3>Free story pack</h3><p>Episode scene ${state.expansionStep + 1} of ${expansionScenes.length}. Your decisions affect the same crew, supplies, and reputation as the main voyage.</p></div><button id="leaveExpansion" class="ghost-btn" type="button">Leave episode</button></aside></div>`;
  sceneEl.querySelectorAll('.expansion-choice').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = episode.choices[Number(button.dataset.index)];
      applyEffects(state, choice.effect);
      state.log.push(`Quiet Signal: ${choice.text}`);
      state.expansionStep += 1;
      renderGame(state);
    });
  });
  document.getElementById('leaveExpansion').addEventListener('click', () => {
    state.screen = 'story';
    renderGame(state);
  });
}

function renderScene(state, sceneKey) {
  const scene = story[sceneKey] || story.intro;
  if (scene.type === 'combat') {
    renderCombat(state, scene);
    return;
  }
  const sceneEl = document.getElementById('scene');
  const outcome = getEndingTone(state);

  sceneEl.innerHTML = `
    <div class="scene-top">
      <h2>${scene.title}</h2>
      <span class="scene-badge">${scene.badge}</span>
    </div>
    <div class="scene-body">
      <div class="story-copy">
        <p>${scene.text}</p>
        <div class="choice-list">
          ${scene.choices.length
            ? scene.choices.map((choice, index) => `
              <button class="choice-btn" type="button" data-next="${choice.next}" data-index="${index}">
                <span class="choice-tag">${choice.label}</span>
                <strong>${choice.text}</strong>
              </button>
            `).join('')
            : `
              <div class="outcome-box ${outcome.tone}">
                <h3>Legacy</h3>
                <p>${outcome.message}</p>
              </div>
            `}
        </div>
      </div>
      <div class="side-panel">
        <div class="mission-box">
          <h3>Mission</h3>
          <p>Hold the line through the Ashen Verge and shape a future that the colony can survive.</p>
        </div>
        <div class="outcome-box ${outcome.tone}">
          <h3>Forecast</h3>
          <p>${outcome.message}</p>
        </div>
      </div>
    </div>
  `;

  if (scene.choices.length) {
    sceneEl.querySelectorAll('.choice-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const nextKey = button.dataset.next;
        const idx = Number(button.dataset.index);
        const selected = scene.choices[idx];
        if (!selected) return;

        applyEffects(state, selected.effect);
        state.log.push(`${selected.text} — a choice with consequences.`);
        state.currentKey = nextKey;
        state.chapter = nextKey;

        const nextScene = story[nextKey];
        if (nextScene && nextScene.title) {
          renderGame(state);
        } else {
          state.ending = 'complete';
          renderGame(state);
        }
      });
    });
  }
}

function renderGame(state) {
  createStats(state);
  updateLog(state);
  if (state.screen === 'shop') {
    renderShop(state);
  } else if (state.screen === 'expansion') {
    renderExpansion(state);
  } else {
    renderScene(state, state.currentKey);
  }
}

function resetGame() {
  const fresh = {
    ...initialState,
    inventory: [...initialState.inventory],
    visited: new Set(),
    log: ['Navigator online. Verge of the Ashen Verge.'],
    screen: 'story',
    currentKey: 'ambush'
  };
  renderGame(fresh);
  return fresh;
}

let state = resetGame();

document.getElementById('restartBtn').addEventListener('click', () => {
  state = resetGame();
});

document.getElementById('shipyardBtn').addEventListener('click', () => {
  state.screen = 'shop';
  renderGame(state);
});

document.getElementById('expansionBtn').addEventListener('click', () => {
  state.screen = 'expansion';
  renderGame(state);
});
