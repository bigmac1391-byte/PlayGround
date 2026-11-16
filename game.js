const SAVE_KEY = 'starlance.save.v1';
const RECORDS_KEY = 'starlance.records.v1';
const SETTINGS_KEY = 'starlance.settings.v1';
const SAVE_VERSION = 1;

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
  expansionRewarded: false,
  screen: 'title',
  started: false,
  chapter: 'Launch',
  visited: new Set(),
  log: ['Navigator online. Verge of the Ashen Verge.'],
  ending: null,
  currentKey: 'ambush',
  pendingNext: null,
  voyageDay: 1,
  encountersPlayed: 0,
  lastEncounterId: null,
  lastEncounterType: null,
  chanceRemaining: 0,
  currentEncounter: null,
  repairsUsed: false,
  endingRecorded: false,
};

const defaultSettings = {
  sound: true,
  motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

let settings = loadSettings();
let deferredInstallPrompt = null;
let lastSceneSignature = '';
let modalReturnFocus = null;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return {
        sound: saved.sound !== false,
        motion: saved.motion !== false
      };
    }
  } catch (error) {
    // Storage can be unavailable in private browsing; defaults still work.
  }
  return { ...defaultSettings };
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore storage failures so gameplay keeps working.
  }
  applySettings();
}

function applySettings() {
  document.documentElement.dataset.motion = settings.motion ? 'full' : 'reduced';
  const soundButton = document.getElementById('soundBtn');
  if (soundButton) {
    soundButton.classList.toggle('muted', !settings.sound);
    soundButton.setAttribute('aria-pressed', String(settings.sound));
    soundButton.setAttribute('aria-label', settings.sound ? 'Mute sound effects' : 'Enable sound effects');
    soundButton.title = settings.sound ? 'Sound on' : 'Sound off';
  }
}

/* ---------- Sound ---------- */

const audio = { context: null };

function initAudio() {
  if (!settings.sound) return;
  if (!audio.context) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio.context = new AudioCtx();
  }
  if (audio.context.state === 'suspended') audio.context.resume().catch(() => {});
}

function playSound(kind = 'click') {
  if (!settings.sound) return;
  initAudio();
  if (!audio.context) return;

  const presets = {
    click: [[420, 0.05, 0.035]],
    choice: [[360, 0.05, 0.035], [540, 0.07, 0.03]],
    good: [[523, 0.08, 0.05], [659, 0.09, 0.045], [784, 0.14, 0.04]],
    bad: [[220, 0.12, 0.05], [155, 0.18, 0.045]],
    roll: [[300, 0.04, 0.03], [470, 0.04, 0.03], [620, 0.06, 0.03]],
    ending: [[392, 0.1, 0.045], [523, 0.12, 0.045], [659, 0.14, 0.045], [784, 0.3, 0.05]]
  };
  const notes = presets[kind] || presets.click;
  const now = audio.context.currentTime;
  notes.forEach(([frequency, duration, volume], index) => {
    const start = now + index * 0.07;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    oscillator.type = kind === 'bad' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  });
}

/* ---------- Saving ---------- */

function serializeState(gameState) {
  const { visited, currentEncounter, ...rest } = gameState;
  return {
    ...rest,
    visited: [...visited],
    currentEncounterId: currentEncounter ? currentEncounter.id : null
  };
}

function saveGame(gameState = state) {
  if (!gameState.started) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: SAVE_VERSION,
      savedAt: Date.now(),
      state: serializeState(gameState)
    }));
  } catch (error) {
    // A failed save should never interrupt the voyage.
  }
}

function readSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!raw || raw.version !== SAVE_VERSION || !raw.state) return null;
    const saved = raw.state;
    if (!story[saved.currentKey] && saved.currentKey !== 'chance') return null;
    if (saved.currentKey === 'chance' && !saved.currentEncounterId) return null;

    const restored = {
      ...initialState,
      ...saved,
      visited: new Set(Array.isArray(saved.visited) ? saved.visited : []),
      currentEncounter: null,
      started: true,
      screen: saved.screen === 'shop' || saved.screen === 'expansion' ? saved.screen : 'story',
      savedAt: raw.savedAt || null
    };

    if (saved.currentEncounterId) {
      restored.currentEncounter = chanceEncounters.find((encounter) => encounter.id === saved.currentEncounterId) || null;
      if (!restored.currentEncounter) return null;
      restored.visited.add(restored.currentEncounter.id);
    }
    return restored;
  } catch (error) {
    return null;
  }
}

function loadGame() {
  const restored = readSave();
  if (!restored) {
    showToast('No saved voyage found.');
    return;
  }
  closeModal();
  state = restored;
  lastSceneSignature = '';
  playSound('choice');
  renderGame(state);
  showToast('Voyage restored.');
}

function makeNewState() {
  return {
    ...initialState,
    inventory: [...initialState.inventory],
    visited: new Set(),
    log: ['Navigator online. Verge of the Ashen Verge.'],
    screen: 'story',
    started: true,
    currentKey: 'ambush',
    currentEncounter: null,
    pendingNext: null,
    voyageDay: 1,
    encountersPlayed: 0,
    lastEncounterId: null,
    lastEncounterType: null,
    chanceRemaining: 0,
    repairsUsed: false,
    endingRecorded: false
  };
}

function startNewVoyage() {
  closeModal();
  state = makeNewState();
  lastSceneSignature = '';
  saveGame(state);
  playSound('choice');
  renderGame(state);
  showToast('New voyage underway.');
}

function restartGame() {
  startNewVoyage();
}

/* ---------- Records ---------- */

function getRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(RECORDS_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return { voyages: Number(saved.voyages) || 0, best: Number(saved.best) || 0 };
    }
  } catch (error) {
    // Ignore and start a fresh record book.
  }
  return { voyages: 0, best: 0 };
}

function getLegacyScore(gameState) {
  return gameState.reputation
    + Math.floor(gameState.morale / 10)
    + Math.floor(gameState.supplies / 10)
    - Math.floor(gameState.crew / 10);
}

function recordVoyage(gameState) {
  const records = getRecords();
  const score = getLegacyScore(gameState);
  records.voyages += 1;
  records.best = Math.max(records.best, score);
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    // Records are optional polish.
  }
}

/* ---------- Modal, toast, announcements ---------- */

function announce(message) {
  const region = document.getElementById('announcer');
  if (region) region.textContent = message;
}

function showToast(message, tone = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function openModal({ title, description = '', content = '', actions = [], onMount = null }) {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  if (root.hidden) modalReturnFocus = document.activeElement;

  const actionMarkup = actions.map((action, index) => `
    <button class="choice-btn modal-action ${action.kind || ''}" data-modal-action="${index}" type="button">
      <strong>${action.label}</strong>
      ${action.detail ? `<span class="modal-action-detail">${action.detail}</span>` : ''}
    </button>
  `).join('');

  root.hidden = false;
  root.innerHTML = `
    <div class="modal-backdrop" data-close-modal="true">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalDescription">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Arbiter command</p>
            <h2 id="modalTitle">${title}</h2>
          </div>
          <button class="icon-btn modal-close" type="button" aria-label="Close menu" data-close-modal="true">✕</button>
        </div>
        ${description ? `<p id="modalDescription" class="modal-description">${description}</p>` : '<span id="modalDescription" class="sr-only">Game menu</span>'}
        ${content ? `<div class="modal-content">${content}</div>` : ''}
        <div class="modal-actions">${actionMarkup}</div>
      </section>
    </div>
  `;

  root.querySelectorAll('[data-close-modal="true"]').forEach((el) => {
    el.addEventListener('click', (event) => {
      if (event.target.closest('.modal-card') && el.classList.contains('modal-backdrop')) return;
      closeModal();
    });
  });

  root.querySelectorAll('[data-modal-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = actions[Number(button.dataset.modalAction)];
      if (!action) return;
      playSound('click');
      if (action.onClick) action.onClick();
    });
  });

  const card = root.querySelector('.modal-card');
  const focusTarget = card.querySelector('.modal-action') || card.querySelector('.modal-close');
  if (focusTarget) focusTarget.focus({ preventScroll: true });

  if (onMount) onMount(card);
  document.body.classList.add('modal-open');
}

function closeModal() {
  const root = document.getElementById('modalRoot');
  if (!root || root.hidden) return;
  root.hidden = true;
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
  if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') {
    modalReturnFocus.focus({ preventScroll: true });
  }
  modalReturnFocus = null;
}

function openMenu() {
  if (!state.started) return;
  openModal({
    title: 'Pause menu',
    description: 'Progress saves automatically after every decision.',
    content: `
      <div class="settings-list">
        <div class="settings-row">
          <div><strong>Sound effects</strong><span>Short tones for choices, dice, and endings.</span></div>
          <button id="menuSoundToggle" class="toggle-btn" type="button" aria-pressed="${settings.sound}">${settings.sound ? 'On' : 'Off'}</button>
        </div>
        <div class="settings-row">
          <div><strong>Animations</strong><span>Turn off motion for a calmer interface.</span></div>
          <button id="menuMotionToggle" class="toggle-btn" type="button" aria-pressed="${settings.motion}">${settings.motion ? 'On' : 'Off'}</button>
        </div>
      </div>
    `,
    actions: [
      { label: 'Resume voyage', onClick: closeModal, kind: 'primary' },
      { label: 'View full ship log', onClick: () => openLog() },
      { label: 'Save and return to title', onClick: returnToTitle },
      { label: 'Restart voyage', detail: 'Return to the ambush with fresh stats.', kind: 'danger', onClick: confirmRestart }
    ],
    onMount: (card) => {
      card.querySelector('#menuSoundToggle').addEventListener('click', (event) => {
        settings.sound = !settings.sound;
        saveSettings();
        event.currentTarget.textContent = settings.sound ? 'On' : 'Off';
        event.currentTarget.setAttribute('aria-pressed', String(settings.sound));
        playSound('click');
      });
      card.querySelector('#menuMotionToggle').addEventListener('click', (event) => {
        settings.motion = !settings.motion;
        saveSettings();
        event.currentTarget.textContent = settings.motion ? 'On' : 'Off';
        event.currentTarget.setAttribute('aria-pressed', String(settings.motion));
      });
    }
  });
}

function openLog() {
  const entries = state.log.slice().reverse();
  openModal({
    title: 'Ship log',
    description: 'The full record of this voyage, newest first.',
    content: `<ol class="full-log">${entries.map((entry) => `<li>${entry}</li>`).join('')}</ol>`,
    actions: [{ label: 'Back', onClick: openMenu }]
  });
}

function confirmRestart() {
  openModal({
    title: 'Restart the voyage?',
    description: 'Current progress and stats will be replaced. Your completed-voyage record is kept.',
    actions: [
      { label: 'Keep playing', onClick: closeModal, kind: 'primary' },
      { label: 'Restart from the ambush', onClick: startNewVoyage, kind: 'danger' }
    ]
  });
}

/* ---------- PWA ---------- */

function setupInstallPrompt() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (state.screen === 'title') renderGame(state);
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    showToast('Starlance installed.');
  });
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast('Use your browser menu to install this app.');
    return;
  }
  deferredInstallPrompt.prompt();
  try {
    await deferredInstallPrompt.userChoice;
  } finally {
    deferredInstallPrompt = null;
    if (state.screen === 'title') renderGame(state);
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(window.location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

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

const chanceEncounters = [
  {
    id: 'singing-comet', type: 'Fortune', title: 'The Singing Comet', badge: 'Lucky Find',
    text: 'A blue comet brushes the Arbiter’s wake, scattering ice that glitters with trace metals. The crew spots a clean harvest window before the fragments drift away.',
    choices: [
      { label: 'Harvest', text: 'Send a careful team to collect the richest fragments.', effect: { scrap: 9, supplies: 3 } },
      { label: 'Study', text: 'Scan the comet’s strange song and share the data.', effect: { reputation: 3, morale: 4 } },
      { label: 'Keep moving', text: 'Avoid the debris and save the crew a risky EVA.', effect: { shields: 3, morale: 2 } }
    ]
  },
  {
    id: 'drifting-garden', type: 'Fortune', title: 'A Garden Adrift', badge: 'Good Fortune',
    text: 'An automated greenhouse pod tumbles out of the dark, still warm and full of hardy crops. Its caretaker AI offers the harvest freely.',
    choices: [
      { label: 'Rescue', text: 'Bring the pod aboard and feed the colony.', effect: { supplies: 12, morale: 3 } },
      { label: 'Welcome', text: 'Invite its lone caretaker to join your crew.', effect: { crew: 2, morale: 5, supplies: -3 } },
      { label: 'Salvage', text: 'Strip the grow lights and leave the pod on its way.', effect: { scrap: 7, supplies: 4 } }
    ]
  },
  {
    id: 'pilgrim-beacon', type: 'Fortune', title: 'Pilgrim Beacon', badge: 'Friendly Contact',
    text: 'A string of pilgrim ships recognizes the Arbiter’s call sign. They offer a safe passage through nearby reefs and a little help for the road.',
    choices: [
      { label: 'Share', text: 'Trade stories and supplies with the pilgrims.', effect: { supplies: 7, morale: 7, reputation: 3 } },
      { label: 'Escort', text: 'Protect their slowest ship through the next passage.', effect: { reputation: 5, shields: 4 } },
      { label: 'Decline', text: 'Thank them and take their charts without delay.', effect: { supplies: 4, reputation: 1 } }
    ]
  },
  {
    id: 'repair-drone', type: 'Fortune', title: 'The Little Repair Drone', badge: 'Unexpected Help',
    text: 'A battered service drone clings to the hull. Its old owner is long gone, but its repair arms still work—and it has a cache of spare parts.',
    choices: [
      { label: 'Repair', text: 'Let the drone patch the shield array.', effect: { shields: 12, scrap: 2 } },
      { label: 'Recruit', text: 'Welcome the drone into the engineering bay.', effect: { morale: 4, scrap: 6 } },
      { label: 'Trade', text: 'Swap a few supplies for its spare components.', effect: { supplies: -3, scrap: 10 } }
    ]
  },
  {
    id: 'solar-flare', type: 'Hazard', title: 'Solar Flare', badge: 'Bad Luck',
    text: 'The star ahead erupts without warning. Warning lights bloom across the bridge as charged particles rake the Arbiter.',
    choices: [
      { label: 'Brace', text: 'Seal the bulkheads and ride out the impact.', effect: { shields: -10, crew: -1 } },
      { label: 'Burn', text: 'Spend fuel and supplies to outrun the worst of it.', effect: { supplies: -8, shields: -3 } },
      { label: 'Shield', text: 'Overload the array to protect the crew.', effect: { shields: -16, morale: 3 } }
    ]
  },
  {
    id: 'ration-spoilage', type: 'Hazard', title: 'Spoiled Stores', badge: 'Bad Luck',
    text: 'A coolant valve fails in the galley. Half a day later, several ration lockers are ruined and a handful of crew are sick.',
    choices: [
      { label: 'Discard', text: 'Throw out everything suspect and prevent an outbreak.', effect: { supplies: -10, morale: 1 } },
      { label: 'Triage', text: 'Save what you can; accept a few sick days.', effect: { supplies: -5, crew: -2, morale: -3 } },
      { label: 'Stretch', text: 'Mix the damaged stock into emergency meal packs.', effect: { supplies: -2, morale: -8 } }
    ]
  },
  {
    id: 'engine-swarm', type: 'Hazard', title: 'Scrap-Eater Swarm', badge: 'Hull Damage',
    text: 'A cloud of metallic scavengers mistakes the Arbiter for a derelict. They chew through an exterior panel before the crew can drive them off.',
    choices: [
      { label: 'Repel', text: 'Use the point-defense cannons to clear the hull.', effect: { shields: -7, scrap: -3 } },
      { label: 'Lure', text: 'Dump spare metal to draw the swarm away.', effect: { scrap: -8, shields: -2 } },
      { label: 'Harvest', text: 'Trap a few and recover their useful alloys.', effect: { crew: -1, shields: -5, scrap: 5 } }
    ]
  },
  {
    id: 'stowaway', type: 'Hazard', title: 'The Stowaway', badge: 'Shipboard Trouble',
    text: 'A frightened refugee is discovered in a sealed cargo compartment. Their presence has strained life support, but sending them back out would be a death sentence.',
    choices: [
      { label: 'Shelter', text: 'Make room for them and calm the worried crew.', effect: { crew: 1, supplies: -6, morale: 3 } },
      { label: 'Detain', text: 'Keep them aboard under guard until the next port.', effect: { morale: -5, supplies: -2 } },
      { label: 'Turn away', text: 'Put them in a shuttle with emergency rations.', effect: { supplies: -4, reputation: -3, morale: -2 } }
    ]
  },
  {
    id: 'toll-gate', type: 'Crossroads', title: 'The Toll Gate', badge: 'Risk & Reward',
    text: 'A private beacon operator controls the only stable passage through this patch of space. The fee is steep, and their credentials are questionable.',
    choices: [
      { label: 'Pay', text: 'Buy the safe coordinates and keep the ship intact.', effect: { scrap: -7, shields: 5 } },
      { label: 'Bargain', text: 'Offer your charts in exchange for a discount.', effect: { reputation: 2, supplies: -3 } },
      { label: 'Sneak', text: 'Try the route without permission and risk a patrol.', effect: { scrap: 6, shields: -8, reputation: -2 } }
    ]
  },
  {
    id: 'old-cache', type: 'Crossroads', title: 'Cache in the Dust', badge: 'Risk & Reward',
    text: 'A distress marker points to an old survival cache wedged into an asteroid. It could be a genuine lifeline—or a trap that never got switched off.',
    choices: [
      { label: 'Careful', text: 'Send a drone to map the cache before anyone approaches.', effect: { supplies: 5, scrap: 3 } },
      { label: 'Rush', text: 'Grab the visible stores before the asteroid shifts.', effect: { supplies: 12, shields: -7 } },
      { label: 'Leave', text: 'Mark the location for another traveler and move on.', effect: { reputation: 2, morale: 2 } }
    ]
  },
  {
    id: 'echoes', type: 'Crossroads', title: 'Echoes on the Comms', badge: 'A Strange Signal',
    text: 'A voice matching your own comes over the comms, warning of a dangerous turn ahead. The recording is dated three days in the future.',
    choices: [
      { label: 'Trust it', text: 'Alter course and avoid the coordinates in the message.', effect: { supplies: -4, shields: 7 } },
      { label: 'Trace it', text: 'Use the signal’s origin to find a hidden transmitter.', effect: { scrap: 8, morale: -3 } },
      { label: 'Broadcast', text: 'Share the warning with every ship in range.', effect: { reputation: 4, supplies: -2 } }
    ]
  },
  {
    id: 'debris-field', type: 'Crossroads', title: 'The Debris Field', badge: 'Split Decision',
    text: 'A shattered freighter spins through a dense debris field. Its black box may hold the location of a safe corridor, but the ship is coming apart.',
    choices: [
      { label: 'Rescue', text: 'Search for survivors before the hull breaks up.', effect: { crew: 1, shields: -6, reputation: 3 } },
      { label: 'Salvage', text: 'Recover the engine core and leave the wreck behind.', effect: { scrap: 11, supplies: -3 } },
      { label: 'Navigate', text: 'Plot a careful course around the wreckage.', effect: { shields: 3, morale: 2 } }
    ]
  }
];

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
  sceneEl.innerHTML = `<div class="scene-top"><h2 id="sceneTitle" tabindex="-1">${scene.title}</h2><span class="scene-badge">${scene.badge}</span></div>
    <div class="scene-body combat-layout"><div class="story-copy">
      <p>${scene.text}</p>
      <div class="combat-console">
        <div class="enemy-card"><span class="eyebrow">Hostile contact · threat 14</span><strong>Verge Raider Skiff</strong><p>Hull 1 · Disruptor lock active</p></div>
        ${result ? `<div class="roll-result ${result.success ? 'good' : 'danger'}"><span class="die-face">${result.roll}</span><div><strong>${result.headline}</strong><p>d20 ${result.roll} + ${result.bonus} = ${result.total} vs DC ${result.dc}. ${result.message}</p></div></div>
          <button id="continueCombat" class="choice-btn" type="button"><strong>Continue to the Verge</strong></button>` : `<div class="action-list" role="group" aria-label="Combat approach">
          ${Object.entries(actionLabels).map(([key, label]) => `<button class="action-btn ${state.combatAction === key ? 'selected' : ''}" data-action="${key}" type="button" aria-pressed="${state.combatAction === key}"><strong>${label}</strong><span>${actionInfo[key]}</span></button>`).join('')}
        </div><button id="rollCombat" class="roll-btn" type="button">🎲 Roll d20 — ${actionLabels[state.combatAction]}</button><p class="dice-note">Natural 20: critical success · Natural 1: critical failure</p>`}
      </div>
    </div><aside class="side-panel"><div class="mission-box"><h3>Equipped</h3><p><strong>${state.weapon}</strong><br>Weapon bonus +${state.weaponBonus}<br><br><strong>${state.armor}</strong><br>Maneuver bonus +${state.armorBonus}</p></div><div class="outcome-box warn"><h3>Check</h3><p>Roll a d20 and add the bonus for your chosen approach. Meet or beat the DC to turn the ambush in your favor.</p></div></aside></div>`;

  if (result) {
    document.getElementById('continueCombat').addEventListener('click', () => {
      state.currentKey = 'intro';
      state.chapter = 'Departure';
      state.combatResult = null;
      playSound('choice');
      renderGame(state);
    });
    return;
  }
  sceneEl.querySelectorAll('.action-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.combatAction = button.dataset.action;
      playSound('click');
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
    playSound(success ? 'good' : 'bad');
    renderGame(state);
  });
}

function renderExpansion(state) {
  const sceneEl = document.getElementById('scene');
  if (state.expansionStep >= expansionScenes.length) {
    sceneEl.innerHTML = `<div class="scene-top"><h2 id="sceneTitle" tabindex="-1">The Quiet Signal</h2><span class="scene-badge">Free expansion complete</span></div><div class="scene-body"><div class="story-copy"><p>The habitat has a future, and the signal is no longer unanswered. Your choices in this bonus chapter have been added to the voyage ledger.</p><div class="outcome-box good"><h3>Chapter reward</h3><p>+8 reputation for bringing the scattered fleet together.</p></div><button id="finishExpansion" class="choice-btn" type="button"><strong>Return to your voyage</strong></button></div><aside class="side-panel"><div class="mission-box"><h3>Included content</h3><p>Three short scenes, multiple outcomes, and no purchase required.</p></div></aside></div>`;
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
      playSound('choice');
      renderGame(state);
      showToast('Free episode saved to the voyage ledger.');
    });
    return;
  }
  const episode = expansionScenes[state.expansionStep];
  sceneEl.innerHTML = `<div class="scene-top"><h2 id="sceneTitle" tabindex="-1">${episode.title}</h2><span class="scene-badge">${episode.badge}</span></div><div class="scene-body"><div class="story-copy"><p>${episode.text}</p><div class="choice-list">${episode.choices.map((choice, index) => `<button class="choice-btn expansion-choice" data-index="${index}" type="button"><span class="choice-tag">${describeEffects(choice.effect)}</span><strong>${choice.text}</strong></button>`).join('')}</div></div><aside class="side-panel"><div class="mission-box"><h3>Free story pack</h3><p>Episode scene ${state.expansionStep + 1} of ${expansionScenes.length}. Your decisions affect the same crew, supplies, and reputation as the main voyage.</p></div><button id="leaveExpansion" class="ghost-btn" type="button">Leave episode</button></aside></div>`;
  sceneEl.querySelectorAll('.expansion-choice').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = episode.choices[Number(button.dataset.index)];
      const net = Object.values(choice.effect || {}).reduce((sum, value) => sum + value, 0);
      playSound(net >= 2 ? 'good' : net <= -2 ? 'bad' : 'choice');
      applyEffects(state, choice.effect);
      state.log.push(`Quiet Signal: ${choice.text}`);
      state.expansionStep += 1;
      renderGame(state);
    });
  });
  document.getElementById('leaveExpansion').addEventListener('click', () => {
    state.screen = 'story';
    playSound('click');
    renderGame(state);
  });
}

function drawChanceEncounter(state) {
  const visited = state.visited instanceof Set ? state.visited : new Set();
  const unseen = (encounter) => !visited.has(encounter.id) && encounter.id !== state.lastEncounterId;

  const roll = Math.random();
  let type = roll < 0.38 ? 'Fortune' : roll < 0.76 ? 'Hazard' : 'Crossroads';
  if (type === state.lastEncounterType) {
    type = ['Fortune', 'Hazard', 'Crossroads'].filter((candidate) => candidate !== type)[Math.floor(Math.random() * 2)];
  }

  let pool = chanceEncounters.filter((encounter) => encounter.type === type && unseen(encounter));
  if (!pool.length) pool = chanceEncounters.filter(unseen);
  if (!pool.length) pool = chanceEncounters.filter((encounter) => encounter.id !== state.lastEncounterId);
  if (!pool.length) pool = chanceEncounters.slice();

  const encounter = pool[Math.floor(Math.random() * pool.length)];
  state.visited.add(encounter.id);
  state.lastEncounterId = encounter.id;
  state.lastEncounterType = encounter.type;
  return encounter;
}

function describeEffects(effect = {}) {
  const labels = { crew: 'crew', morale: 'morale', supplies: 'supplies', shields: 'shields', scrap: 'scrap', reputation: 'rep' };
  return Object.entries(effect).map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${labels[key] || key}`).join(' · ');
}

function getChancePips(state) {
  const total = 3;
  const completed = clamp(total - state.chanceRemaining, 0, total);
  return `<div class="chance-pips" role="img" aria-label="${completed} of ${total} long-passage encounters completed">
    ${Array.from({ length: total }, (_, index) => `<span class="${index < completed ? 'done' : index === completed ? 'active' : ''}"></span>`).join('')}
  </div>`;
}

function copyVoyageSummary(state, outcome) {
  const summary = [
    `Starlance: A New Horizon`,
    `${state.voyageDay} days · ${state.encountersPlayed} chance encounters · ${state.crew} crew · ${state.reputation} reputation`,
    outcome.message
  ].join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(summary)
      .then(() => showToast('Voyage summary copied to the clipboard.'))
      .catch(() => showToast('Could not copy the summary.'));
  } else {
    showToast('Clipboard is not available in this browser.');
  }
}

function renderScene(state, sceneKey) {
  const scene = sceneKey === 'chance' ? state.currentEncounter : (story[sceneKey] || story.intro);
  if (scene.type === 'combat') {
    renderCombat(state, scene);
    return;
  }
  const sceneEl = document.getElementById('scene');
  const outcome = getEndingTone(state);
  const isEnding = sceneKey === 'ending';
  const badge = isEnding
    ? { good: 'Triumph', warn: 'Costly victory', danger: 'Broken legacy' }[outcome.tone]
    : scene.badge;

  if (isEnding && !state.endingRecorded) {
    state.endingRecorded = true;
    recordVoyage(state);
    saveGame(state);
  }

  sceneEl.innerHTML = `
    <div class="scene-top">
      <h2 id="sceneTitle" tabindex="-1">${scene.title}</h2>
      <span class="scene-badge ${isEnding ? `tone-${outcome.tone}` : ''}">${badge}</span>
    </div>
    <div class="scene-body">
      <div class="story-copy">
        <p>${scene.text}</p>
        <div class="choice-list">
          ${scene.choices.length
            ? scene.choices.map((choice, index) => `
              <button class="choice-btn" type="button" data-next="${choice.next}" data-index="${index}">
                <span class="choice-tag">${choice.label} · ${describeEffects(choice.effect)}</span>
                <strong>${choice.text}</strong>
              </button>
            `).join('')
            : `
              <div class="outcome-box ${outcome.tone}">
                <h3>Legacy</h3>
                <p>${outcome.message}</p>
              </div>
              <div class="ending-stats">
                <div><span>Days</span><strong>${state.voyageDay}</strong></div>
                <div><span>Crew</span><strong>${state.crew}</strong></div>
                <div><span>Reputation</span><strong>${state.reputation}</strong></div>
                <div><span>Encounters</span><strong>${state.encountersPlayed}</strong></div>
              </div>
              <p class="legacy-score">Legacy score <strong>${getLegacyScore(state)}</strong></p>
              <div class="button-row">
                <button id="playAgain" class="choice-btn primary-action" type="button"><strong>Launch another voyage</strong></button>
                <button id="shareRun" class="ghost-btn" type="button">Copy voyage summary</button>
              </div>
            `}
        </div>
      </div>
      <div class="side-panel">
        <div class="mission-box">
          <h3>Mission</h3>
          <p>Hold the line through the Ashen Verge and shape a future that the colony can survive.<br><br><strong>Voyage day:</strong> ${state.voyageDay}<br><strong>Chance encounters:</strong> ${state.encountersPlayed}${state.currentKey === 'chance' ? ` · ${state.chanceRemaining} ahead` : ''}</p>
          ${state.currentKey === 'chance' || state.encountersPlayed >= 3 ? getChancePips(state) : ''}
        </div>
        <div class="outcome-box ${outcome.tone}">
          <h3>Forecast</h3>
          <p>${outcome.message}</p>
        </div>
      </div>
    </div>
  `;

  if (!scene.choices.length) {
    document.getElementById('playAgain').addEventListener('click', () => {
      playSound('choice');
      restartGame();
    });
    document.getElementById('shareRun').addEventListener('click', () => {
      playSound('click');
      copyVoyageSummary(state, outcome);
    });
  }
  if (scene.choices.length) {
    sceneEl.querySelectorAll('.choice-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const idx = Number(button.dataset.index);
        const selected = scene.choices[idx];
        if (!selected) return;

        const nextKey = button.dataset.next;
        const net = Object.values(selected.effect || {}).reduce((sum, value) => sum + value, 0);
        playSound(isEnding ? 'ending' : nextKey === 'ending' ? 'ending' : net >= 2 ? 'good' : net <= -2 ? 'bad' : 'choice');
        applyEffects(state, selected.effect);
        state.log.push(`${selected.text} — ${describeEffects(selected.effect) || 'no change'}.`);
        if (sceneKey === 'chance') {
          state.chanceRemaining = Math.max(0, state.chanceRemaining - 1);
          state.encountersPlayed += 1;
          state.voyageDay += 1;
          if (state.chanceRemaining > 0) {
            state.currentEncounter = drawChanceEncounter(state);
            state.currentKey = 'chance';
          } else {
            state.currentKey = state.pendingNext || 'finale';
            state.chapter = state.currentKey;
            state.pendingNext = null;
          }
        } else {
          state.currentKey = nextKey;
          state.chapter = nextKey;
          const isMajorTravelBeat = ['relay', 'icebound', 'stormfront', 'salvation', 'outcast', 'truce', 'banner', 'compromise', 'mercantile'].includes(sceneKey);
          if (isMajorTravelBeat && nextKey === 'finale') {
            state.pendingNext = nextKey;
            state.chanceRemaining = 3;
            state.currentEncounter = drawChanceEncounter(state);
            state.currentKey = 'chance';
            state.chapter = 'The Long Passage';
            state.log.push('Three uncertain days remain before the final horizon.');
          }
        }
        renderGame(state);
      });
    });
  }
}

function getCriticalState(state) {
  if (state.crew <= 0) {
    return {
      title: 'The Arbiter is lost',
      badge: 'Voyage ended',
      tone: 'danger',
      message: 'The crew has fallen, the ship is drifting, and the colony has no future on this route. The storm claims the last of your command.',
      action: 'Restart the voyage',
      canRepair: false
    };
  }

  if (state.shields <= 0) {
    const canRepair = !state.repairsUsed && state.supplies >= 10 && state.scrap >= 8;
    return {
      title: 'Hull breach',
      badge: 'Emergency',
      tone: 'warn',
      message: state.repairsUsed
        ? 'The Arbiter is crippled and the emergency reserves are spent. The frontier will bury the ship under its own wreckage unless you return to the start.'
        : 'The shields have collapsed and the outer hull is open to the dark. One emergency repair could still bring the Arbiter back, but the parts will cost supplies and scrap.',
      action: 'Restart the voyage',
      canRepair
    };
  }

  return null;
}

function renderTitle() {
  const saved = readSave();
  const records = getRecords();
  const sceneEl = document.getElementById('scene');
  const savedFinished = saved && saved.currentKey === 'ending';
  const savedLine = saved
    ? savedFinished
      ? `Voyage complete · ${saved.voyageDay} days`
      : `Day ${saved.voyageDay} · ${saved.crew} crew · ${saved.currentKey === 'chance' ? 'long passage' : 'in transit'}`
    : '';

  sceneEl.innerHTML = `
    <div class="scene-top title-top">
      <h2 id="sceneTitle" tabindex="-1">A New Horizon</h2>
      <span class="scene-badge">Command the Arbiter</span>
    </div>
    <div class="scene-body title-body">
      <div class="story-copy">
        <p class="title-lead">The colony ship <strong>Arbiter</strong> is through the wormgate, but the route ahead is a storm of unstable stars. Every decision spends crew, supplies, and trust—and the frontier remembers.</p>
        <div class="feature-row">
          <div class="feature-chip"><strong>Branching route</strong><span>16 story scenes</span></div>
          <div class="feature-chip"><strong>12 encounters</strong><span>Fortune, hazard, crossroads</span></div>
          <div class="feature-chip"><strong>Auto-save</strong><span>Resume any time</span></div>
        </div>
        <div class="title-actions">
          <button id="beginVoyage" class="roll-btn title-primary" type="button">Begin a new voyage</button>
          ${saved ? `<button id="continueVoyage" class="choice-btn continue-btn" type="button"><span class="choice-tag">${savedFinished ? 'Last voyage' : 'Continue voyage'} · ${savedLine}</span><strong>${savedFinished ? 'Review your last ending' : 'Resume from your last decision'}</strong></button>` : ''}
        </div>
        ${saved ? `<p class="save-note">Progress is saved automatically${saved.savedAt ? ` · last saved ${new Date(saved.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}.</p>` : ''}
        <details class="briefing">
          <summary>How to play</summary>
          <p>Choose a route, manage six ship stats, and survive the d20 ambush. In the long passage before the final horizon, three chance encounters test your judgment. Every choice is permanent for that voyage.</p>
        </details>
        <div class="title-acts">
          <div><span>Act I</span><strong>Break the blockade</strong><p>Pick a route through the fractured Verge.</p></div>
          <div><span>Act II</span><strong>Survive the passage</strong><p>Three chance encounters decide what you carry forward.</p></div>
          <div><span>Act III</span><strong>Claim the horizon</strong><p>Spend your legacy on the sector's future.</p></div>
        </div>
        ${deferredInstallPrompt ? '<button id="installApp" class="ghost-btn install-btn" type="button">Install Starlance</button>' : ''}
      </div>
      <aside class="side-panel">
        <div class="mission-box">
          <h3>Captain's record</h3>
          <div class="record-grid">
            <div><span>Voyages completed</span><strong>${records.voyages}</strong></div>
            <div><span>Best legacy</span><strong>${records.voyages ? records.best : '—'}</strong></div>
          </div>
        </div>
        <div class="mission-box">
          <h3>What's aboard</h3>
          <p>Three acts, twelve chance encounters, a free three-scene episode, a shipyard, and several endings. No accounts, no ads, no purchase required.</p>
        </div>
      </aside>
    </div>
  `;

  document.getElementById('beginVoyage').addEventListener('click', () => {
    playSound('choice');
    const activeSave = readSave();
    if (activeSave && activeSave.currentKey !== 'ending') {
      openModal({
        title: 'Begin a new voyage?',
        description: 'An unfinished voyage is waiting. Starting over will replace its save file; completed voyage records are kept.',
        actions: [
          { label: 'Continue the saved voyage', onClick: loadGame, kind: 'primary' },
          { label: 'Start over anyway', onClick: startNewVoyage, kind: 'danger' }
        ]
      });
    } else {
      startNewVoyage();
    }
  });

  const continueButton = document.getElementById('continueVoyage');
  if (continueButton) continueButton.addEventListener('click', loadGame);

  const installButton = document.getElementById('installApp');
  if (installButton) installButton.addEventListener('click', installApp);
}

function updateHeader(gameState) {
  const critical = getCriticalState(gameState);
  const exploring = gameState.started && gameState.screen !== 'title' && !critical;
  ['shipyardBtn', 'expansionBtn'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = !exploring;
  });
  const menu = document.getElementById('menuBtn');
  if (menu) menu.disabled = !gameState.started || gameState.screen === 'title';
  document.body.dataset.screen = gameState.started ? (gameState.screen || 'story') : 'title';
}

function focusScene(gameState) {
  const sceneEl = document.getElementById('scene');
  if (!sceneEl) return;
  const critical = getCriticalState(gameState);
  const signature = [
    gameState.screen,
    gameState.currentKey,
    gameState.currentEncounter ? gameState.currentEncounter.id : '',
    gameState.combatResult ? `roll-${gameState.combatResult.roll}-${gameState.combatResult.success}` : '',
    gameState.expansionStep,
    gameState.started ? 'started' : 'title',
    critical ? critical.title : ''
  ].join('|');
  if (signature === lastSceneSignature) return;
  lastSceneSignature = signature;
  const heading = sceneEl.querySelector('h2');
  if (heading) {
    if (!heading.id) heading.id = 'sceneTitle';
    heading.tabIndex = -1;
    heading.focus({ preventScroll: false });
    const badge = sceneEl.querySelector('.scene-badge');
    announce(`${heading.textContent}${badge ? `. ${badge.textContent}` : ''}`);
  }
}

function renderCritical(critical) {
  const sceneEl = document.getElementById('scene');
  sceneEl.innerHTML = `<div class="scene-top"><h2 id="sceneTitle" tabindex="-1">${critical.title}</h2><span class="scene-badge tone-${critical.tone}">${critical.badge}</span></div>
    <div class="scene-body"><div class="story-copy"><p>${critical.message}</p>
      <div class="choice-list">
        ${critical.canRepair ? `<button id="repairHull" class="choice-btn primary-action" type="button"><span class="choice-tag">Emergency repair · -10 supplies · -8 scrap</span><strong>Divert emergency power to the shield array</strong></button>` : ''}
        <button id="restartCritical" class="choice-btn ${critical.canRepair ? '' : 'primary-action'}" type="button"><strong>${critical.action}</strong></button>
      </div>
      ${critical.canRepair ? '<p class="save-note">One emergency repair is available this voyage.</p>' : '<p class="save-note">No emergency repair is available. A fresh voyage is the only way forward.</p>'}
    </div><aside class="side-panel"><div class="outcome-box ${critical.tone}"><h3>Emergency protocol</h3><p>${critical.canRepair ? 'The engine room can reroute power and seal the breach, but the patch is temporary and costly.' : 'The line is broken. Your ship can only recover by returning to the start and choosing a wiser path.'}</p></div></aside></div>`;

  if (critical.canRepair) {
    document.getElementById('repairHull').addEventListener('click', () => {
      state.repairsUsed = true;
      applyEffects(state, { shields: 30, supplies: -10, scrap: -8 });
      state.log.push('Emergency repair restored 30 shields for 10 supplies and 8 scrap.');
      playSound('good');
      renderGame(state);
      showToast('Emergency repair complete. Shields restored.');
    });
  }
  document.getElementById('restartCritical').addEventListener('click', () => {
    playSound('choice');
    restartGame();
  });
}

function renderGame(gameState = state) {
  createStats(gameState);
  updateLog(gameState);
  updateHeader(gameState);
  if (gameState.started) saveGame(gameState);

  const critical = getCriticalState(gameState);
  if (critical) {
    renderCritical(critical);
    focusScene(gameState);
    return;
  }

  if (gameState.screen === 'title' || !gameState.started) {
    renderTitle();
  } else if (gameState.screen === 'shop') {
    renderShop(gameState);
  } else if (gameState.screen === 'expansion') {
    renderExpansion(gameState);
  } else {
    renderScene(gameState, gameState.currentKey);
  }
  focusScene(gameState);
}

function makeTitleState() {
  return {
    ...initialState,
    inventory: [...initialState.inventory],
    visited: new Set(),
    log: ['Navigator online. Verge of the Ashen Verge.'],
    screen: 'title',
    started: false,
    currentKey: 'ambush',
    currentEncounter: null
  };
}

function returnToTitle() {
  const previous = state;
  saveGame(previous);
  closeModal();
  state = makeTitleState();
  lastSceneSignature = '';
  renderGame(state);
  showToast('Voyage saved. Continue from the title screen.');
}

let state = makeTitleState();

document.getElementById('menuBtn').addEventListener('click', openMenu);

document.getElementById('soundBtn').addEventListener('click', () => {
  settings.sound = !settings.sound;
  saveSettings();
  if (settings.sound) playSound('good');
  showToast(settings.sound ? 'Sound on.' : 'Sound muted.');
});

document.getElementById('shipyardBtn').addEventListener('click', () => {
  if (!state.started) return;
  state.screen = 'shop';
  playSound('click');
  renderGame(state);
});

document.getElementById('expansionBtn').addEventListener('click', () => {
  if (!state.started) return;
  state.screen = 'expansion';
  playSound('click');
  renderGame(state);
});

/* ---------- Global interaction ---------- */

function trapModalFocus(event) {
  const card = document.querySelector('.modal-card');
  if (!card) return;
  const focusable = [...card.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.disabled && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

document.addEventListener('keydown', (event) => {
  const modalRoot = document.getElementById('modalRoot');
  const modalOpen = modalRoot && !modalRoot.hidden;
  if (modalOpen) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    } else if (event.key === 'Tab') {
      trapModalFocus(event);
    }
    return;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'Escape' && state.started) {
    openMenu();
    return;
  }
  if (!/^[1-9]$/.test(event.key)) return;
  if (!state.started || state.screen !== 'story' || state.currentKey === 'ambush' || state.currentKey === 'ending') return;
  const buttons = [...document.querySelectorAll('#scene .choice-btn')];
  const target = buttons[Number(event.key) - 1];
  if (target) {
    event.preventDefault();
    target.click();
  }
});

document.addEventListener('pointerdown', initAudio, { once: true });

window.addEventListener('pagehide', () => {
  if (state.started) saveGame(state);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.started) saveGame(state);
});

applySettings();
setupInstallPrompt();
registerServiceWorker();
renderGame(state);
