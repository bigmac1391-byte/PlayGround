const SAVE_KEY = 'thornbound-oath-save-v1';
const characters = {
  seraphine: { name: 'Seraphine Vale', age: 32, role: 'Moonlit oath-knight', icon: '✧', look: 'elven', color: '#67404c', hair: '#30232b', glow: '#c87c83', bio: 'An elven knight bound to an ancient moon-oath. Beneath her immaculate armor is a woman longing to choose her own fate—and someone who sees the person, not the legend.' },
  rowan: { name: 'Rowan Ashford', age: 29, role: 'Fox-spirit ranger', icon: '❧', look: 'ranger', color: '#3e5548', hair: '#372b25', glow: '#92a477', bio: 'A sharp-eyed ranger with a fox spirit’s ears and a trail of strange green lights in her wake. Dry-witted, quietly tender, and fiercely protective of the haunted wilds.' },
  mira: { name: 'Mira Thorne', age: 27, role: 'Siren songstress', icon: '♫', look: 'bard', color: '#654d64', hair: '#e8c879', glow: '#dca46f', bio: 'A half-elf songstress whose melodies can stir forgotten magic. Her stage smile dazzles a room; the softer one she saves for someone she trusts.' },
  brann: { name: 'Branna Coppervein', age: 41, role: 'Runesmith & dragonkin', icon: '⚒', look: 'dwarf', color: '#665239', hair: '#4c3027', glow: '#cf975a', bio: 'A sturdy dwarven runesmith with a streak of dragonfire in her blood. Branna builds clever wards, keeps her promises, and dreams of a workshop where everyone belongs.' }
};
const castOrder = Object.keys(characters);
const scenes = [
  { chapter:'I · THE LAST GREEN', title:'A Crown of Thorns', place:'THE THORNBOUND COURT', art:'court', character:null, quest:'A blight is spreading from the old forest. The kingdom needs a champion willing to cross its haunted border.', text:'The old oak doors swing wide. Beyond them, the court is all candlelight and wary faces. The queen has offered you a dangerous commission: find the heart of the blight before the last green lands fall. You are twenty-eight, unlanded, and free to refuse.', lead:'The silver thorn sigil on the table seems to pulse with a heartbeat.', choices:[
    {label:'Take the oath, but ask the queen to trust the people living on the border.',title:'A promise should serve the living.',body:'You accept the charge on the condition that local voices guide the mission.',effect:{renown:1, trust:1},note:'You took the Thornbound oath on your own terms.'},
    {label:'Ask for the truth about the last expedition.',title:'No more secrets buried with the dead.',body:'The queen hesitates, then orders the sealed archive opened.',effect:{wisdom:1},note:'You demanded the full truth before setting out.'},
    {label:'Accept in silence and study the sigil.',title:'Some answers are written in old magic.',body:'The silver thorn warms in your palm; a faint green light points north.',effect:{magic:1},note:'The old sigil answered your touch.'}
  ]},
  {chapter:'I · THE LAST GREEN',title:'The Knight at the Gate',place:'ASHENMERE KEEP',art:'keep',character:'seraphine',quest:'Win Seraphine’s confidence before the expedition leaves at dawn.',lead:'A scarlet cloak stirs in the cold wind. The knight’s salute is precise, but her eyes are searching.',text:'Seraphine Vale, an elven knight of thirty-two, has been assigned as your guide. She has served the crown for decades and has the look of someone who has read too many stirring speeches and buried too many people who believed them.',choices:[
    {label:'Ask what she wants from this mission, not what the crown ordered.',title:'You deserve a say in your own story.',body:'For a moment, the practiced knight disappears. Seraphine gives you a grateful, unguarded smile.',bond:{seraphine:2},note:'Seraphine appreciated being asked what she wanted.'},
    {label:'Offer to share the risk equally.',title:'No one walks into the dark alone.',body:'She studies you, then clasps your forearm in the old soldiers’ greeting.',bond:{seraphine:1},effect:{trust:1},note:'You and Seraphine agreed to watch each other’s backs.'},
    {label:'Keep it formal and review the route together.',title:'Competence is its own kind of courtesy.',body:'The tension eases as you mark the safest passages on the map.',effect:{wisdom:1},note:'You planned the expedition with Seraphine.'}
  ]},
  {chapter:'I · THE LAST GREEN',title:'A Ranger’s Warning',place:'THE NORTH ROAD',art:'forest',character:'rowan',quest:'Find a safe path through the wood—and learn why the animals are fleeing.',lead:'A raven lands on the signpost, then turns its head as if listening.',text:'Rowan Ashford, a fox-spirit ranger of twenty-nine, steps from the tree line. She has been following the blight for weeks, and she is not impressed by royal banners. Still, she offers to guide you through the old wood if you promise to listen.',choices:[
    {label:'Put away your weapon and ask what the forest is telling her.',title:'You know this place better than I do.',body:'Rowan’s shoulders loosen. She points out a trail of pale ash beneath the ferns.',bond:{rowan:2},note:'Rowan trusted you with what she had seen in the woods.'},
    {label:'Offer her a place at the head of the company.',title:'Lead us where you think we should go.',body:'A small, pleased smile flickers across her face before she turns to the trail.',bond:{rowan:1},effect:{trust:1},note:'Rowan joined you as the expedition’s guide.'},
    {label:'Ask her to prove the route is safe.',title:'Let’s check the signs together.',body:'She approves of the question and shows you how to read the disturbed moss.',effect:{wisdom:1},note:'You learned to read the forest trail from Rowan.'}
  ]},
  {chapter:'I · THE LAST GREEN',title:'The Song in the Lantern Room',place:'THE FOX & FIRKIN',art:'tavern',character:'mira',quest:'Mira knows the old songs. Persuade her to join the expedition.',lead:'A bright melody rises above the tavern chatter, then stops at exactly the wrong moment.',text:'Mira Thorne, a half-elf bard and royal envoy of twenty-seven, has been collecting fragments of a ballad about the thorn-heart. She catches you listening and invites you to sit. The smile she wears for the room is dazzling; the one she saves for you is a little more cautious.',choices:[
    {label:'Tell her you want to hear the unfinished song, whenever she is ready.',title:'No performance needed.',body:'Mira’s guard slips. She shares a quiet verse about a home that can never be commanded.',bond:{mira:2},note:'Mira shared a private verse with you.'},
    {label:'Invite her to join as a partner, not an instrument of the court.',title:'Your voice should be part of the decision.',body:'She raises her glass to that, and agrees to come along.',bond:{mira:1},effect:{trust:1},note:'Mira joined the journey as an equal.'},
    {label:'Ask for the history behind the ballad.',title:'Let’s start with the oldest verse.',body:'She explains the song’s lost refrain and the names it was written to protect.',effect:{wisdom:1},note:'Mira taught you the ballad’s history.'}
  ]},
  {chapter:'I · THE LAST GREEN',title:'The Forge Beneath the Hill',place:'COPPERVEIN WORKS',art:'forge',character:'brann',quest:'Repair the expedition’s ward-stone before the mountain pass.',lead:'Hammer-song echoes through a cavern lit by orange runes.',text:'Branna Coppervein, a forty-one-year-old dwarven runesmith, is coaxing a stubborn ward-stone back to life. She has already turned down the court’s offer of a title. She will help, she says, if this mission is about saving people and not decorating a throne room.',choices:[
    {label:'Ask what she needs—and listen to the answer.',title:'Your craft, your call.',body:'Branna nods, satisfied. She explains the rune lattice and asks you to hold the lantern.',bond:{brann:2},note:'Branna let you into her workshop and her plans.'},
    {label:'Promise the ward-stone will be used to protect the border villages.',title:'The people come before the crown.',body:'She tests the promise with a long look, then sets the stone into your hands.',bond:{brann:1},effect:{trust:1},note:'You promised Branna the ward-stone would protect the villages.'},
    {label:'Offer to carry the finished stone and spare her the climb.',title:'Let me take the heavy part.',body:'She laughs and says she can carry her own work, but lets you help with the tools.',effect:{trust:1},note:'You shared the work in Branna’s forge.'}
  ]},
  {chapter:'I · THE LAST GREEN',title:'The Roadside Supper',place:'CAMP UNDER THE PINES',art:'camp',character:'rowan',quest:'The company is wary of one another. A little kindness might change that.',lead:'For the first time, no one is in a hurry to fill the silence.',text:'The first night beyond the city passes under a canopy of pine. Branna has made a stew, Mira is tuning a travel-worn lute, and Seraphine has set her sword aside. Rowan watches you from across the fire, waiting to see what sort of leader you will be.',choices:[
    {label:'Ask Rowan to show you the constellations she uses to navigate.',title:'Teach me the stars you trust.',body:'She shifts over to make room. The names she gives the stars are older than the kingdom.',bond:{rowan:1},effect:{trust:1},note:'Rowan taught you her ranger’s constellations.'},
    {label:'Ask Mira to choose a song everyone can join.',title:'Tonight, no one sings alone.',body:'By the chorus, even Seraphine is humming under her breath.',bond:{mira:1},effect:{trust:1},note:'Mira brought the company together with a song.'},
    {label:'Offer to take first watch so the others can rest.',title:'I’ll keep the fire.',body:'Branna leaves you a warm cup; Seraphine quietly takes the second watch with you.',bond:{seraphine:1,brann:1},effect:{trust:1},note:'The company began to feel like a team.'}
  ]},
  {chapter:'I · THE LAST GREEN',title:'A Bridge of Living Roots',place:'THE WILD MARCH',art:'bridge',character:'seraphine',quest:'Cross the ravine before dusk without leaving anyone behind.',lead:'The living bridge shivers in the wind like a held breath.',text:'The roots across the ravine have begun to blacken. Seraphine scouts the far ledge while Rowan searches for a safer crossing. Far below, the river runs silver through the darkness.',choices:[
    {label:'Cross beside Seraphine, matching her pace instead of racing ahead.',title:'We cross together.',body:'Halfway across, she offers her hand. The moment is brief, but her fingers linger against yours.',bond:{seraphine:1},effect:{trust:1},note:'You crossed the living bridge beside Seraphine.'},
    {label:'Ask Rowan to guide the company over the strongest roots.',title:'Trust the ranger’s eye.',body:'Her calm instructions carry every member of the company safely across.',bond:{rowan:1},effect:{trust:1},note:'Rowan found a safe way across the ravine.'},
    {label:'Let Branna anchor a rune-line for everyone to hold.',title:'Build a path that can hold us all.',body:'Branna’s quick work turns a dangerous crossing into a sturdy passage.',bond:{brann:1},effect:{renown:1},note:'Branna’s rune-line brought everyone across safely.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'The Hollow Stag',place:'THE OLD FOREST',art:'forest',character:'rowan',quest:'Decide how to face the blight without harming the forest’s creatures.',lead:'A stag of pale bark watches from the mist, its antlers tangled with thorn-vines.',text:'The creature is not attacking. Rowan recognizes the marks as a warning: something has poisoned the spring at the forest’s heart. The company can hear the water moving beneath the roots, though no stream is visible.',choices:[
    {label:'Follow Rowan’s lead and approach slowly, palms open.',title:'We are guests in this forest.',body:'The stag lowers its head. A bead of clear water shines beneath one of its thorns.',bond:{rowan:1},effect:{trust:1},note:'You met the hollow stag without fear or force.'},
    {label:'Ask Seraphine to stand guard while you look for the spring.',title:'Protect the others while we learn.',body:'She takes position beside you, close enough that your shoulders brush.',bond:{seraphine:1},effect:{wisdom:1},note:'Seraphine kept watch while you searched for the source.'},
    {label:'Let Mira play the old ballad and see if it remembers.',title:'A song may reach where steel cannot.',body:'The stag listens. Mira finds the lost refrain, and its thorns loosen a little.',bond:{mira:1},effect:{magic:1},note:'Mira’s song soothed the hollow stag.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'The Shattered Shrine',place:'SHRINE OF THE FIRST WARDEN',art:'ruins',character:'mira',quest:'Decode the shrine’s warning before the blight reaches the villages.',lead:'Old carvings show a crowned figure laying their crown among the roots.',text:'The shrine is older than the kingdom. Its warning is clear: the blight grows wherever power is taken without consent. Mira recognizes the melody carved into the wall, while Branna spots a mechanism under the roots.',choices:[
    {label:'Invite Mira to sing the shrine’s melody in her own way.',title:'Let the song belong to you.',body:'The carved leaves glow as her voice finds the tune. She looks at you with open warmth.',bond:{mira:1},effect:{magic:1},note:'Mira awakened the shrine with the old melody.'},
    {label:'Ask Branna to study the mechanism before touching it.',title:'Understand the ward before we change it.',body:'She uncovers a seal meant to be opened by a freely given vow.',bond:{brann:1},effect:{wisdom:1},note:'Branna deciphered the shrine’s old ward.'},
    {label:'Share the warning with the whole company and decide together.',title:'No one should carry this alone.',body:'The company’s answers fit together: the spring can be healed, but only if the court releases its claim.',effect:{trust:2,renown:1},note:'The company agreed that the spring must be freed.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'A Quiet Hour',place:'THE WATCHER’S GLEN',art:'camp',character:'seraphine',quest:'Let trust grow—or take a quiet hour for yourself.',lead:'No alarms. No courtly duties. Only the hush of leaves after rain.',text:'The company makes camp in a sheltered glen. This is the first night since the journey began that no immediate danger presses close. You find Seraphine polishing her armor by the fire, though her attention seems to be somewhere far away.',choices:[
    {label:'Ask Seraphine what life she would choose if no oath decided for her.',title:'What would make you happy?',body:'She answers slowly: a home with a garden, and someone who sees the person beneath the armor.',bond:{seraphine:2},note:'Seraphine trusted you with a private dream.'},
    {label:'Invite Rowan to share the lookout and a thermos of spiced tea.',title:'Keep me company under the stars?',body:'She accepts. Her quiet jokes make the long watch feel unexpectedly easy.',bond:{rowan:1},effect:{trust:1},note:'You and Rowan shared a quiet watch.'},
    {label:'Spend the hour alone, writing down what you have learned.',title:'A little stillness helps me think.',body:'You set your thoughts in order and wake with a clearer sense of the path ahead.',effect:{wisdom:1},note:'You took a quiet hour to reflect.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'The Thorn’s Invitation',place:'THE MOONLIT POOL',art:'moonpool',character:'mira',quest:'Answer the magic without surrendering anyone’s freedom.',lead:'A ring of flowers opens on the dark water. The light feels like a question.',text:'At the forest’s center, the thorn-heart sends out a pulse of ancient magic. It shows each of you a vision of what you most desire, then asks for a vow. The old shrine’s warning rings in your mind: the blight feeds on any promise made under pressure.',choices:[
    {label:'Refuse the bargain and ask the heart what it needs to be free.',title:'No vow is true if it cannot be refused.',body:'The thorn-light steadies. The magic seems to recognize the difference between a promise and a chain.',effect:{magic:2,trust:1},note:'You refused the thorn-heart’s coercive bargain.'},
    {label:'Ask Branna to build a ward that can hold without binding.',title:'Protection without a cage.',body:'She sketches a new rune design, and the thorn-heart’s pulse softens.',bond:{brann:1},effect:{wisdom:1},note:'Branna devised a ward that protects without binding.'},
    {label:'Let Rowan guide you around the pool and search for another way.',title:'There is always another trail.',body:'She finds a path beneath the willow roots, away from the heart’s alluring call.',bond:{rowan:1},effect:{trust:1},note:'Rowan found a way around the thorn-heart’s lure.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'The Lantern Feast',place:'VILLAGE OF LARKSPUR',art:'village',character:'mira',quest:'Earn the villagers’ help before the royal patrol arrives.',lead:'Paper lanterns drift above the square like a handful of captured stars.',text:'The villagers have been living with the blight far longer than the court has acknowledged. They offer a feast, but they will not risk their homes for another royal promise. Mira knows how to win a room; Seraphine knows how to earn respect; Branna has already found the broken well.',choices:[
    {label:'Ask Mira to tell the villagers’ story, not the court’s.',title:'Tonight, their voices lead.',body:'The room falls quiet. By the last verse, the villagers are telling their own stories.',bond:{mira:1},effect:{trust:2},note:'The villagers joined the cause after Mira gave them the floor.'},
    {label:'Help Seraphine organize a fair watch rota for the village.',title:'We protect each other.',body:'Her plan gives every household a say, and the people begin to trust the knight.',bond:{seraphine:1},effect:{trust:1},note:'You and Seraphine helped organize the village watch.'},
    {label:'Work beside Branna to repair the well through the night.',title:'Let the work speak for us.',body:'By sunrise, clean water runs. Branna brushes dust from her cheek and beams at you.',bond:{brann:2},effect:{trust:1},note:'You and Branna repaired Larkspur’s well together.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'The Court’s Envoy',place:'THE BORDER WATCHTOWER',art:'keep',character:'seraphine',quest:'Convince the royal envoy to hear the border’s testimony.',lead:'A black-and-gold banner snaps in the wind above the watchtower.',text:'The queen’s envoy arrives with a troop of soldiers and an order to seize the thorn-heart. Seraphine recognizes the seal on the document: it is the same command that doomed the last expedition. She wants to confront the envoy, but the choice is yours.',choices:[
    {label:'Ask Seraphine to tell the truth in her own words.',title:'I will stand with you, not speak over you.',body:'She addresses the envoy without flinching. The soldiers listen; so does the envoy.',bond:{seraphine:2},effect:{renown:1},note:'Seraphine spoke publicly about the crown’s old betrayal.'},
    {label:'Present the villagers’ testimony and demand a hearing.',title:'The people who live here deserve to be heard.',body:'The envoy cannot ignore the written accounts and agrees to carry them back.',effect:{renown:2,trust:1},note:'You secured a hearing for the border villages.'},
    {label:'Offer the envoy a place at the table instead of an ultimatum.',title:'We can change the order together.',body:'She lowers her guard. A difficult conversation begins, but it is a conversation.',effect:{trust:2},note:'You opened negotiations with the royal envoy.'}
  ]},
  {chapter:'II · THE DEEPWOOD',title:'A Letter Never Sent',place:'THE BORDER WATCHTOWER',art:'camp',character:'brann',quest:'Choose whether to protect Seraphine’s privacy or ask her about the letter.',lead:'A page slips from the knight’s field journal, its ink blurred by rain.',text:'You catch only a line before Seraphine folds the page away: “I cannot spend another life pretending the crown is always right.” She looks embarrassed, not angry. There is a trust in the air that you could honor—or test.',choices:[
    {label:'Look away and let her decide whether to share it.',title:'Your words belong to you.',body:'She breathes out, relieved. Later, she tells you the letter was addressed to the queen.',bond:{seraphine:1},note:'You gave Seraphine room to choose what to share.'},
    {label:'Ask if she wants company, without asking to read it.',title:'You do not have to carry this alone.',body:'She accepts your hand. For a while, neither of you needs to speak.',bond:{seraphine:2},effect:{trust:1},note:'Seraphine let you sit beside her through a difficult moment.'},
    {label:'Suggest bringing the letter to the council together.',title:'The truth can be spoken in the open.',body:'She considers it, then tucks the page safely into her coat for another day.',effect:{renown:1},note:'You offered Seraphine a path to speak openly.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'The Queen’s Reckoning',place:'THE BORDER WATCHTOWER',art:'keep',character:'mira',quest:'Help the queen face the harm done by the old command.',lead:'The queen’s seal lies on the table between you, no longer a symbol of unquestioned authority.',text:'The envoy returns with the queen herself. She listens to the villagers, the company, and the survivors of the old expedition. She admits that she feared losing control more than she feared being wrong. Mira watches your face, asking without words how you want to proceed.',choices:[
    {label:'Ask the queen to surrender her claim to the thorn-heart publicly.',title:'Repair begins with an honest admission.',body:'The queen agrees to speak before the court and the border villages together.',effect:{renown:2,trust:1},note:'The queen agreed to relinquish the crown’s claim.'},
    {label:'Invite the villagers to set the terms for their own protection.',title:'Let those affected decide what justice means.',body:'The villagers name their needs: clean water, a voice in council, and no more forced vows.',bond:{mira:1},effect:{trust:2},note:'The border villages set their own terms.'},
    {label:'Give the queen time to listen before deciding her fate.',title:'Accountability can include a chance to change.',body:'She sits with the people she failed. No one rushes to forgive her.',effect:{wisdom:1,trust:1},note:'You made room for listening without demanding instant forgiveness.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'The Thorn Gate',place:'THE ROOTBOUND PASS',art:'ruins',character:'brann',quest:'Open the gate without repeating the old binding spell.',lead:'A wall of black briars parts around a doorway made from living wood.',text:'The last ward is designed to bind a champion to the forest forever. Branna finds a way to rewrite it, but the mechanism needs three freely offered strengths: a clear memory, a true name, and a promise that can be withdrawn.',choices:[
    {label:'Offer a memory of the first person who taught you kindness.',title:'I choose what I give—and I keep the right to take it back.',body:'The gate glows gold. Its thorns retreat without closing around your wrist.',effect:{magic:1,trust:2},note:'You opened the gate with a freely given memory.'},
    {label:'Ask the company to contribute only what each wishes to share.',title:'No one owes the gate a piece of themselves.',body:'Each companion offers a small, chosen token. The ward opens gently.',bond:{brann:1},effect:{trust:2},note:'The company opened the gate through freely chosen gifts.'},
    {label:'Use the old sigil and risk the magic alone.',title:'I will bear the danger, not ask it of them.',body:'The sigil flares. The gate opens, though your hands tremble afterward.',effect:{magic:2},note:'You used the old sigil to open the thorn gate.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'The Lantern Walk',place:'THE HEARTWOOD PATH',art:'moonpool',character:'rowan',quest:'Take a moment with someone who has become important to you.',lead:'Fireflies drift between the trees. The company gives you a little space.',text:'The path to the thorn-heart is quiet. Rowan catches up with you and asks what you hope to find beyond the mission. There is no clever answer ready, only the honesty of the night and the warmth of someone walking beside you.',choices:[
    {label:'Tell Rowan you hope there can be a life after the mission.',title:'Maybe we could find that life together.',body:'She smiles, a little shyly. “I’d like to see what we make of it.”',bond:{rowan:2},note:'You and Rowan spoke about a future beyond the mission.'},
    {label:'Ask Mira to walk with you and share the song she kept back.',title:'I want to hear the verse that is only yours.',body:'She sings softly, then asks what song you would choose for the road home.',bond:{mira:2},note:'Mira shared the private ending of her song.'},
    {label:'Walk with Branna and ask what she would build if time were no concern.',title:'Show me the thing you dream of making.',body:'She describes a workshop with open doors, built for anyone who wants to learn.',bond:{brann:2},note:'Branna told you about the future she hopes to build.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'A Choice Freely Made',place:'THE THORN-HEART SANCTUM',art:'moonpool',character:'seraphine',quest:'Choose romance, a private night together, or friendship—only if both of you want it.',lead:'The thorn-heart waits. So does the person whose hand you have been hoping to hold.',text:'The heartwood chamber is warm with green light. Before the final ritual, there is time for one honest conversation. You may tell a companion that your feelings have become more than friendship. Every romanceable companion is an adult; affection and intimacy are always mutual, and a no is accepted without penalty.',choices:[
    {label:'Tell Seraphine you love her, and ask if she wants to share the night with you.',title:'Only if you want this too.',body:'She answers with a kiss of her own choosing. The door closes on the two of you; the scene fades to the quiet warmth of morning.',romance:'seraphine',intimate:true,note:'You and Seraphine chose a private night together.'},
    {label:'Tell Rowan you want a life beyond the trail with her.',title:'Would you like to find our way together?',body:'She says yes, then kisses you beneath the lantern boughs. The rest of the night belongs only to the two of you.',romance:'rowan',intimate:true,note:'You and Rowan chose a private night together.'},
    {label:'Tell Mira you love the person behind the performance.',title:'May I stay when the music ends?',body:'She answers by taking your hand and leading you somewhere quiet. The story leaves you both to your chosen privacy.',romance:'mira',intimate:true,note:'You and Mira chose a private night together.'},
    {label:'Tell Branna you want to build a future beside her.',title:'I choose you, if you choose me.',body:'She asks once more if you are certain. When you say yes, she kisses you with a tenderness that surprises you both. Morning comes softly.',romance:'brann',intimate:true,note:'You and Branna chose a private night together.'},
    {label:'Share a gentle, romantic moment without going further.',title:'Let’s take this one step at a time.',body:'You share a kiss and agree to let the future unfold at its own pace.',romance:'any',intimate:false,note:'You shared a tender moment and chose to take things slowly.'},
    {label:'Keep the moment as friendship; the mission comes first.',title:'I am glad you are here with me.',body:'Your companion smiles, and your bond remains warm without changing its name.',note:'You chose friendship and kept your promise of trust.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'The Thorn-Heart Stirs',place:'THE THORN-HEART SANCTUM',art:'moonpool',character:'rowan',quest:'Protect one another as the blight makes its final stand.',lead:'The black thorns rise like a crown, then stop at the edge of your light.',text:'The heartwood is frightened, not evil. The centuries-old binding has taught it to defend itself by taking control. As the roots surge, your companions stand with you—not as servants, but as people who chose to be here.',choices:[
    {label:'Ask the company to hold the ward while you speak to the heart.',title:'We will listen before we strike.',body:'The roots hesitate. You have a moment to make a final choice.',effect:{trust:2,magic:1},note:'The company held the ward while you addressed the heart.'},
    {label:'Let Seraphine lead a defensive line while Mira sings.',title:'Protect the heart long enough for it to hear us.',body:'Steel and song move together. The thorn-crown lowers.',bond:{seraphine:1,mira:1},effect:{trust:1},note:'Seraphine and Mira created an opening without harming the heart.'},
    {label:'Trust Branna’s new ward and Rowan’s path through the roots.',title:'A way through, not a way to dominate.',body:'The rune settles around the chamber, and Rowan guides you to the heart’s core.',bond:{brann:1,rowan:1},effect:{wisdom:1},note:'Branna and Rowan found a safe path to the heart.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'The Council of Open Hands',place:'THE BORDER COUNCIL',art:'village',character:'mira',quest:'Agree on who gets a voice in the new covenant.',lead:'For once, the smallest table in the room belongs to the people who live at the edge.',text:'Before the final ritual, the queen asks the company to help write the new covenant. The villagers want their own elected keepers; the court wants a clear process; the forest wants its old paths left open. There is no perfect answer, only a chance to begin differently.',choices:[
    {label:'Give the villages the final say over their own lands.',title:'Self-rule is a beginning, not a reward.',body:'The queen signs the charter. Mira asks the villagers to choose their own representatives.',effect:{trust:2,renown:1},bond:{mira:1},note:'The villages secured the right to govern their lands.'},
    {label:'Create a rotating council with village, court, and forest voices.',title:'Share power—and keep sharing it.',body:'Branna sketches a practical rotation, while Rowan marks the protected paths.',effect:{trust:2,wisdom:1},bond:{brann:1,rowan:1},note:'You created a rotating council for the new covenant.'},
    {label:'Ask the queen to step aside until the villages choose their delegates.',title:'Trust is earned by making room.',body:'The queen agrees to serve only as an interim voice, not the final authority.',effect:{renown:2},bond:{seraphine:1},note:'The queen agreed to make room for village delegates.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'Before the Dawn',place:'THE HEARTWOOD PATH',art:'camp',character:null,quest:'Gather your courage before the final choice.',lead:'The eastern sky brightens, though the old forest keeps its own time.',text:'The company gathers one last time beneath the trees. Your choices have shaped this journey: the promises you kept, the people you listened to, and the affection you offered without demanding it in return. Whatever happens at the heart, no one here is merely a piece on a board.',choices:[
    {label:'Ask your chosen companion to stand beside you at the ritual.',title:'I want to face this with you.',body:'They take your hand, whether as beloved or dearest friend. The dawn finds you ready.',bond:{seraphine:1,rowan:1,mira:1,brann:1},effect:{trust:1},note:'You entered the final ritual surrounded by chosen family.'},
    {label:'Invite everyone to speak one hope for the future.',title:'Let every voice be heard once more.',body:'The hopes are humble and brave: open roads, clean water, a home, and room to choose.',effect:{trust:2,renown:1},note:'The company shared its hopes before the final oath.'},
    {label:'Take a quiet moment alone beneath the oldest tree.',title:'I know what I must do.',body:'The tree sheds a single silver leaf into your palm. You step into the light.',effect:{wisdom:1,magic:1},note:'You found a moment of quiet before the final oath.'}
  ]},
  {chapter:'III · THE CROWNLESS',title:'The Last Oath',place:'THE HEART OF THE OLD WOOD',art:'heart',character:null,quest:'Decide what the kingdom’s future will be.',lead:'The ancient magic waits for an answer that no crown can give on your behalf.',text:'The blight can end, but the old pact must change. The queen has offered to share power with the border villages. Your companions stand at your side. The thorn-heart asks only that the choice be made freely—and that those who live with it have a voice.',choices:[
    {label:'Release the heartwood and let the villages steward the forest.',title:'The land belongs to those who care for it.',body:'The thorn-crown dissolves into white blossoms. The forest begins to heal, free of royal command.',ending:'commons',effect:{trust:2,renown:2},note:'You freed the heartwood and entrusted its care to the villages.'},
    {label:'Create a shared covenant between the crown, villages, and forest.',title:'A promise made together can be remade together.',body:'The queen, the village elders, and the heartwood speak the new terms aloud. The blight recedes.',ending:'covenant',effect:{trust:1,renown:2},note:'You forged a shared covenant for the kingdom.'},
    {label:'Ask the heartwood to decide, then promise to honor its answer.',title:'Let the forest choose its own future.',body:'The ancient presence releases a gentle wave of green. It chooses balance, not a ruler.',ending:'wild',effect:{magic:2},note:'You let the forest choose its future.'}
  ]}
];

const defaultState = () => ({
  index: 0,
  bonds: { seraphine: 0, rowan: 0, mira: 0, brann: 0 },
  stats: { trust: 0, wisdom: 0, magic: 0, renown: 0 },
  journal: [],
  romance: null,
  intimate: false,
  ending: null,
  history: []
});
let state = defaultState();
const sceneRoot = document.getElementById('scene');
const toast = document.getElementById('toast');
let toastTimer;
let audioContext = null;
let soundNodes = [];

function restoreSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= scenes.length) return false;
    state = { ...defaultState(), ...saved, bonds: { ...defaultState().bonds, ...saved.bonds }, stats: { ...defaultState().stats, ...saved.stats } };
    return true;
  } catch (error) {
    console.warn('Could not restore save:', error);
    return false;
  }
}
function saveGame(notify = false) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (notify) showToast('Chronicle saved on this device.');
  } catch (error) {
    showToast('This browser could not save locally.');
  }
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}
function strongestCompanion(minBond = 0) {
  return castOrder.map(id => ({ id, bond: state.bonds[id] })).filter(item => item.bond >= minBond).sort((a,b) => b.bond - a.bond)[0]?.id || null;
}
function activeScene() { return scenes[state.index]; }
function render() {
  const scene = activeScene();
  const character = scene.character ? characters[scene.character] : null;
  const percentage = Math.round(((state.index + (state.ending ? 1 : 0)) / scenes.length) * 100);
  document.getElementById('chapterLabel').textContent = scene.chapter;
  document.getElementById('progressText').textContent = `${Math.min(state.index + 1, scenes.length)} / ${scenes.length}`;
  document.getElementById('progressBar').style.width = `${state.ending ? 100 : Math.max(5, percentage)}%`;
  document.getElementById('questText').textContent = scene.quest;
  document.getElementById('journalCount').textContent = state.journal.length;
  document.getElementById('journalList').innerHTML = state.journal.slice(-7).reverse().map(item => `<li>${escapeHTML(item)}</li>`).join('');
  document.getElementById('companions').innerHTML = castOrder.map(id => {
    const person = characters[id];
    const isActive = scene.character === id || state.romance === id;
    const favor = state.bonds[id];
    return `<div class="companion${isActive ? ' active' : ''}"><div class="companion-avatar" aria-hidden="true">${person.icon}</div><div><div class="companion-name">${person.name}</div><div class="companion-role">${person.role}</div><div class="favor-track" role="meter" aria-label="Favor with ${person.name}" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${favor}"><i style="--favor-fill:${favor * 10}%"></i></div></div><div class="favor-score">${favor}<span>FAVOR</span></div></div>`;
  }).join('');
  const figure = character ? `<div class="character-figure ${character.look}" style="--cloak:${character.color};--hair:${character.hair};--glow:${character.glow}"><i class="glow"></i><i class="cloak"></i><i class="torso"></i><i class="head"></i><i class="hair"></i></div>` : '';
  const artClass = character ? '' : ' art-no-character';
  const storyText = (scene.text || '').split(/(?<=[.!?])\s+/).filter(Boolean).map((part, i) => `<p${i === 0 ? ' class="lead"' : ''}>${escapeHTML(part)}</p>`).join('');
  const companionAside = character ? `<div><div class="aside-label">IN THIS SCENE</div><div class="aside-copy"><strong>${character.name}, ${character.age}</strong><br>${character.role}</div></div><div><div class="aside-label">ABOUT</div><div class="aside-copy">${character.bio}</div></div>` : `<div><div class="aside-label">YOUR COMPANY</div><div class="aside-copy">Four companions, each with their own hopes, boundaries, and reasons for being here.</div></div><div><div class="aside-label">YOUR PATH</div><div class="aside-copy">Trust ${state.stats.trust} · Insight ${state.stats.wisdom} · Renown ${state.stats.renown}</div></div>`;
  let choicesHTML = '';
  if (!state.ending) {
    choicesHTML = scene.choices.map((choice, index) => {
      const target = choice.romance === 'any' ? strongestCompanion(3) : choice.romance;
      const locked = choice.romance === 'any'
        ? !target
        : Boolean(choice.romance && state.bonds[choice.romance] < 3);
      const lockNote = locked ? 'Earn at least 3 favor with this companion to unlock this tender option.' : '';
      const targetNote = choice.romance === 'any' && target ? ` · With ${characters[target].name}, your closest bond` : '';
      return `<button type="button" class="choice" data-choice="${index}" ${locked ? 'disabled aria-disabled="true"' : ''}><span class="choice-label">${locked ? 'LOCKED · GROW CLOSER' : `CHOICE ${String(index + 1).padStart(2, '0')}`}</span><strong>${escapeHTML(choice.label)}</strong><small>${escapeHTML(choice.title)}${escapeHTML(targetNote)}${lockNote ? ` · ${lockNote}` : ''}</small></button>`;
    }).join('');
  }
  let endingHTML = '';
  if (state.ending) {
    const endingTitles = { commons:'The Free Greenwood', covenant:'The Shared Crown', wild:'The Forest Unbound' };
    const partner = state.romance ? characters[state.romance].name : null;
    const relationship = partner ? (state.intimate ? `You and ${partner} begin a life together, with the private tenderness of your chosen night kept between you.` : `You and ${partner} let affection grow at its own pace.`) : 'Your companions remain your chosen family, and friendship carries you into the years ahead.';
    endingHTML = `<div class="ending-panel"><h3>${endingTitles[state.ending] || 'A New Beginning'}</h3><p>${escapeHTML(relationship)} The border villages regain their voice, the blight recedes, and the old forest begins to heal. Your choices are remembered as the beginning of a kinder age.</p><button class="choice reset-choice" id="playAgain" type="button"><strong>Begin a new chronicle</strong><small>Start again with a fresh set of choices.</small></button></div>`;
  }
  sceneRoot.innerHTML = `<div class="scene-art${artClass}" style="--scene-bg:${scene.art === 'heart' ? 'linear-gradient(130deg,#283b2e,#121518 74%)' : scene.art === 'forge' ? 'linear-gradient(130deg,#493127,#171519 74%)' : scene.art === 'village' ? 'linear-gradient(130deg,#473532,#19171a 74%)' : ''}"><div class="scene-moon"></div><div class="scene-horizon"></div><div class="scene-fog"></div>${figure}<div class="scene-location">${escapeHTML(scene.place)}</div><div class="scene-copy-top"><div class="scene-eyebrow">${escapeHTML(scene.chapter)}</div><h1>${escapeHTML(scene.title)}</h1></div></div><div class="scene-content"><div class="narrative">${storyText}<div class="choices">${choicesHTML}</div>${endingHTML}</div><aside class="scene-aside">${companionAside}<div><div class="aside-label">THE CHRONICLE</div><div class="aside-copy">Chapter ${state.index + 1} of ${scenes.length}. Each choice is yours to make; there is no single correct path.</div></div><div class="bond-note"><span>Favor with ${character ? character.name.split(' ')[0] : 'the company'}</span><b>${character ? `${state.bonds[scene.character]} / 10 ♥` : '✦'}</b></div><div class="aside-quote">“A vow is only worth keeping when it can be freely made.”</div></aside></div>`;
  sceneRoot.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.choice))));
  const playAgain = document.getElementById('playAgain');
  if (playAgain) playAgain.addEventListener('click', restartGame);
  document.getElementById('saveBtn').textContent = localStorage.getItem(SAVE_KEY) ? 'Saved locally' : 'Save story';
}
function choose(choiceIndex) {
  const scene = activeScene();
  const choice = scene.choices[choiceIndex];
  if (!choice) return;
  const romanceTarget = choice.romance === 'any' ? strongestCompanion(3) : choice.romance;
  if (choice.romance === 'any' && !romanceTarget) return;
  if (choice.romance && choice.romance !== 'any' && state.bonds[choice.romance] < 3) return;
  if (choice.bond) Object.entries(choice.bond).forEach(([id, amount]) => { if (id in state.bonds) state.bonds[id] = Math.min(10, state.bonds[id] + amount); });
  if (choice.effect) Object.entries(choice.effect).forEach(([key, amount]) => { if (key in state.stats) state.stats[key] += amount; });
  if (romanceTarget) state.romance = romanceTarget;
  if (choice.intimate) state.intimate = true;
  if (choice.ending) state.ending = choice.ending;
  state.journal.push(choice.note || choice.title || choice.label);
  state.history.push({ scene: state.index, choice: choiceIndex });
  if (!state.ending && state.index < scenes.length - 1) state.index += 1;
  saveGame();
  render();
  showToast(choice.note || 'Your choice has been recorded.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function restartGame() {
  if (!window.confirm('Start a new chronicle? Your current story will be replaced.')) return;
  state = defaultState();
  saveGame();
  render();
  showToast('A new chronicle begins.');
}
function openCodex() {
  document.getElementById('codexContent').innerHTML = castOrder.map(id => {
    const person = characters[id];
    return `<article class="codex-person"><h3>${person.name}</h3><span>AGE ${person.age} · ${person.role.toUpperCase()}</span><p>${person.bio}</p></article>`;
  }).join('');
  document.getElementById('codexDialog').showModal();
}
function toggleSound(button) {
  if (soundNodes.length) {
    soundNodes.forEach(node => { try { node.stop(); } catch {} });
    soundNodes = [];
    button.innerHTML = '♫ <span>Sound off</span>';
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) { showToast('Ambient sound is not supported in this browser.'); return; }
  audioContext ||= new AudioContextClass();
  audioContext.resume();
  [110, 164.81].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.value = index ? 0.006 : 0.009;
    oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start();
    soundNodes.push(oscillator);
  });
  button.innerHTML = '♫ <span>Sound on</span>';
}
document.getElementById('saveBtn').addEventListener('click', () => saveGame(true));
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('codexBtn').addEventListener('click', openCodex);
document.getElementById('closeCodex').addEventListener('click', () => document.getElementById('codexDialog').close());
document.getElementById('soundBtn').addEventListener('click', event => toggleSound(event.currentTarget));
document.getElementById('codexDialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
restoreSave();
render();
