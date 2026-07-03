/**
 * Le Chat Parisien — Application Logic
 * Clean, modular architecture for the language learning app.
 */

// ═══════════ Firebase Setup ═══════════
const firebaseConfig = {
    apiKey: "AIzaSyBhEuX8lcxlkDwbm-J90Unq2JuAMi73u8s",
    authDomain: "cat-language-1ecd4.firebaseapp.com",
    projectId: "cat-language-1ecd4",
    storageBucket: "cat-language-1ecd4.firebasestorage.app",
    messagingSenderId: "539587205119",
    appId: "1:539587205119:web:a6e9f463c519829194f9ca",
    measurementId: "G-E6G2J3RECG",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ═══════════ Application State ═══════════
const state = {
    currentUser: null,
    userProfile: null,
    currentLang: null,
    currentLevel: 'beginner',
    demoCount: 0,
    activeDemos: [],
    lastDemoIndex: -1,
};

// ═══════════ DOM References ═══════════
const dom = {
    get loginError() { return document.getElementById('loginError'); },
    get userAvatar() { return document.getElementById('userAvatar'); },
    get userName() { return document.getElementById('userName'); },
    get topLoginBtn() { return document.getElementById('topLoginBtn'); },
    get logoutBtn() { return document.getElementById('logoutBtn'); },
    get langueLabel() { return document.getElementById('langueLabel'); },
    get levelLabel() { return document.getElementById('levelLabel'); },
    get langPicker() { return document.getElementById('langPicker'); },
    get langGrid() { return document.getElementById('langGrid'); },
    get mainContent() { return document.getElementById('mainContent'); },
    get mainTitle() { return document.getElementById('mainTitle'); },
    get mainSubtitle() { return document.getElementById('mainSubtitle'); },
    get catImage() { return document.getElementById('catImage'); },
    get demoPhrase() { return document.getElementById('demoPhrase'); },
    get demoMeaning() { return document.getElementById('demoMeaning'); },
    get speakBtn() { return document.getElementById('speakBtn'); },
    get refreshBtn() { return document.getElementById('refreshBtn'); },
    get progressFill() { return document.getElementById('progressFill'); },
    get phrasesLearned() { return document.getElementById('phrasesLearned'); },
    get levelBadge() { return document.getElementById('levelBadge'); },
    get motivationText() { return document.getElementById('motivationText'); },
    get postmark() { return document.getElementById('postmark'); },
    get catCaption() { return document.getElementById('catCaption'); },
    get topLangStamps() { return document.getElementById('topLangStamps'); },
    get levelStamps() { return document.getElementById('levelStamps'); },
    get lessonTopTab() { return document.getElementById('lessonTopTab'); },
    get lessonTopTitle() { return document.getElementById('lessonTopTitle'); },
    get lessonTopBody() { return document.getElementById('lessonTopBody'); },
    get lessonBottomTab() { return document.getElementById('lessonBottomTab'); },
    get lessonBottomTitle() { return document.getElementById('lessonBottomTitle'); },
    get lessonExamples() { return document.getElementById('lessonExamples'); },
};

// ═══════════ Utilities ═══════════
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Native UI labels for the selected language (falls back to French).
function currentUI() {
    return (THEMES[state.currentLang] || THEMES.french).ui;
}

// ═══════════ Local Preferences (works without an account) ═══════════
// Persists the language + level choice so the site honors the last selection
// on the next visit, whether or not the visitor is signed in.
const LocalPrefs = {
    KEY: 'lcp_prefs',
    read() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
        catch { return {}; }
    },
    write(patch) {
        const next = { ...this.read(), ...patch };
        try { localStorage.setItem(this.KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
    },
};

// Skill levels available for selection
const SKILL_LEVELS = {
    beginner:     { icon: '🌱', label: 'Beginner' },
    intermediate: { icon: '🌳', label: 'Intermediate' },
    advanced:     { icon: '🏔️', label: 'Advanced' },
};

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════ Phrase Engine ═══════════
function buildActiveDemos() {
    const { currentLang, currentLevel } = state;
    let phrases = [];

    if (currentLang === 'french') {
        const a1 = LEVEL_DEMO.french?.beginner || [];
        const a2 = LEVEL_DEMO.french?.elementary || [];
        const b1 = LEVEL_DEMO.french?.intermediate || [];

        if (currentLevel === 'beginner') {
            phrases = a1;
        } else if (currentLevel === 'intermediate') {
            // B1-weighted mix (original DELF B1 prep behavior)
            phrases = [...a1, ...a2, ...a2, ...b1, ...b1, ...b1];
        } else {
            // Advanced: B1 content only
            phrases = b1;
        }
    } else if (currentLang === 'korean') {
        const kr = LEVEL_DEMO.korean || {};
        if (currentLevel === 'beginner') {
            phrases = kr.beginner || [];
        } else if (currentLevel === 'intermediate') {
            phrases = [...(kr.beginner || []), ...(kr.elementary || []), ...(kr.intermediate || [])];
        } else {
            phrases = [...(kr.upper || []), ...(kr.advanced || [])];
        }
    } else if (LEVEL_DEMO[currentLang]) {
        // Generic multi-level languages (hebrew)
        const d = LEVEL_DEMO[currentLang];
        if (currentLevel === 'beginner') {
            phrases = [...(d.beginner || []), ...(d.elementary || [])];
        } else if (currentLevel === 'intermediate') {
            phrases = [...(d.elementary || []), ...(d.intermediate || [])];
        } else {
            phrases = [...(d.upper || []), ...(d.advanced || [])];
        }
    } else {
        phrases = DEMO[currentLang] || [];
    }

    state.activeDemos = phrases;
    state.lastDemoIndex = -1;
}

function nextDemo() {
    const { activeDemos } = state;
    if (!activeDemos.length) return;

    // Pick a random phrase, avoiding immediate repetition
    let idx;
    if (activeDemos.length === 1) {
        idx = 0;
    } else {
        do { idx = Math.floor(Math.random() * activeDemos.length); }
        while (idx === state.lastDemoIndex);
    }
    displayPhrase(idx, true);
}

function displayPhrase(idx, countIt) {
    const { activeDemos } = state;
    const phrase = activeDemos[idx];
    if (!phrase) return;
    state.lastDemoIndex = idx;

    const phraseEl = dom.demoPhrase;
    const meaningEl = dom.demoMeaning;

    // Fade transition
    phraseEl.style.opacity = '0';
    meaningEl.style.opacity = '0';

    setTimeout(() => {
        phraseEl.textContent = phrase.p;
        meaningEl.textContent = phrase.m;
        phraseEl.style.opacity = '1';
        meaningEl.style.opacity = '1';
        const keyword = phrase.kw ? randomFrom(phrase.kw) : LANGS[state.currentLang].hi;
        setCatImage(keyword);
        renderLesson(idx);
    }, 200);

    if (countIt) {
        state.demoCount++;
        dom.phrasesLearned.textContent = state.demoCount;
        dom.progressFill.style.width = Math.min((state.demoCount / activeDemos.length) * 100, 100) + '%';
    }
}

// ═══════════ Lesson Carnet (right column) ═══════════
// Find the most relevant grammar/vocab lesson for a phrase. Lessons are
// ordered specific → general, so the first pattern match wins.
function findLesson(phrase, lang) {
    const lessons = (typeof LESSONS !== 'undefined' && LESSONS[lang]) || null;
    if (!lessons || !phrase) return null;
    const text = phrase.p || '';
    for (const lesson of lessons) {
        if (lesson.match.some(re => re.test(text))) return lesson;
    }
    return null;
}

function renderLesson(currentIdx) {
    const { activeDemos, currentLang } = state;
    const phrase = activeDemos[currentIdx];
    if (!phrase) return;

    const isRtl = !!LANGS[currentLang]?.rtl;
    const lesson = findLesson(phrase, currentLang);

    if (lesson) {
        renderLessonFromData(lesson, isRtl);
    } else {
        renderLessonFallback(phrase, currentIdx, isRtl);
    }
}

// A curated grammar/vocab lesson matched to the current phrase.
function renderLessonFromData(lesson, isRtl) {
    const ui = currentUI();
    dom.lessonTopTab.textContent = ui.carnet;
    dom.lessonTopTitle.textContent = lesson.focus;

    const vocab = (lesson.vocab || []).map(v => `
        <div class="vocab-item">
            <span class="vocab-term"${isRtl ? ' dir="rtl"' : ''}>${escapeHtml(v.t)}</span>
            <span class="vocab-gloss">${escapeHtml(v.g)}</span>
        </div>
    `).join('');

    dom.lessonTopBody.innerHTML = `
        <p class="lesson-note">${mdBold(lesson.note)}</p>
        ${vocab ? `<div class="vocab-list">${vocab}</div>` : ''}
    `;

    dom.lessonBottomTab.textContent = ui.pratique;
    dom.lessonBottomTitle.textContent = ui.howTo;
    renderExampleList(lesson.examples || [], isRtl);
}

// No curated lesson: spotlight the phrase words + show related bank phrases.
function renderLessonFallback(phrase, currentIdx, isRtl) {
    const { activeDemos } = state;
    const ui = currentUI();

    dom.lessonTopTab.textContent = ui.carnet;
    dom.lessonTopTitle.textContent = ui.spotlight;

    const tokens = tokenizePhrase(phrase.p);
    const chips = tokens.map(t => `<span class="spotlight-word">${escapeHtml(t)}</span>`).join('');
    dom.lessonTopBody.innerHTML = `
        <div class="spotlight-words"${isRtl ? ' dir="rtl"' : ''}>${chips}</div>
        <p class="spotlight-translation">${escapeHtml(phrase.m)}</p>
    `;

    dom.lessonBottomTab.textContent = ui.encore;
    dom.lessonBottomTitle.textContent = ui.related;

    const others = activeDemos.map((p, i) => ({ p, i })).filter(o => o.i !== currentIdx);
    shuffle(others);
    renderExampleList(others.slice(0, 3).map(o => o.p), isRtl);
}

function renderExampleList(examples, isRtl) {
    const list = dom.lessonExamples;
    if (!list) return;
    if (!examples.length) {
        list.innerHTML = `<p class="spotlight-empty">${escapeHtml(currentUI().comingSoon)}</p>`;
        return;
    }
    list.innerHTML = examples.map(o => `
        <div class="example-item">
            <div class="example-target"${isRtl ? ' dir="rtl"' : ''}>${escapeHtml(o.p)}</div>
            <div class="example-meaning">${escapeHtml(o.m)}</div>
        </div>
    `).join('');
}

// Split a phrase into display tokens. Space-delimited languages split on
// whitespace; scriptio-continua languages (Chinese/Japanese) show the whole
// phrase as a single unit since word boundaries aren't marked by spaces.
function tokenizePhrase(text) {
    if (!text) return [];
    const spaced = text.trim().split(/\s+/).filter(Boolean);
    return spaced.length > 1 ? spaced : [text.trim()];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Minimal **bold** / *italic* rendering for lesson notes (input pre-escaped).
function mdBold(str) {
    return escapeHtml(str)
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<i>$1</i>');
}

// ═══════════ Cat Image Service ═══════════
async function fetchCatUrl(keyword) {
    return `https://cataas.com/cat/says/${encodeURIComponent(keyword || 'Bonjour')}?size=200&color=white&fontSize=22`;
}

async function setCatImage(keyword) {
    const img = dom.catImage;
    img.style.opacity = '0';
    const url = await fetchCatUrl(keyword);
    img.onload = () => { img.style.opacity = '1'; };
    img.src = url;
}

// ═══════════ Text-to-Speech Engine ═══════════
const TTS = (() => {
    const VOICE_CONFIG = {
        french: {
            lang: 'fr-FR',
            female: [
                'Denise Online', 'Eloise Online', 'Vivienne Online',
                'Denise', 'Eloise', 'Vivienne',
                'Amélie', 'Céline', 'Marie', 'Aurélie', 'Léa',
                'Google français',
                'Julie', 'Caroline', 'Hortense',
            ],
            male: [
                'Henri Online', 'Alain Online', 'Claude Online',
                'Henri', 'Alain', 'Claude', 'Fabrice', 'Théo',
                'Thomas', 'Jacques', 'Nicolas',
                'Paul',
            ],
            femaleBias: 0.5,
        },
        korean: {
            lang: 'ko-KR',
            female: [
                'SunHi Online', 'JiMin Online',
                'SunHi', 'JiMin', 'Yuna', 'Sora',
                'Google 한국어',
                'Heami',
            ],
            male: [
                'InJoon Online', 'BongJin Online',
                'InJoon', 'BongJin',
            ],
            femaleBias: 0.5,
        },
        hebrew: {
            lang: 'he-IL',
            female: [
                'Hila Online', 'Hila',
                'Carmit',
                'Google עברית',
            ],
            male: [
                'Avri Online', 'Avri',
            ],
            femaleBias: 0.5,
        },
    };

    let cachedVoices = [];
    let voiceCache = {};
    let lastGender = null;

    function loadVoices() {
        cachedVoices = speechSynthesis.getVoices();
        voiceCache = {};
    }

    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    function isNeural(voice) {
        const n = voice.name.toLowerCase();
        return n.includes('online') || n.includes('natural') || n.includes('neural');
    }

    function buildPool(langKey) {
        if (voiceCache[langKey]) return voiceCache[langKey];
        if (!cachedVoices.length) cachedVoices = speechSynthesis.getVoices();

        const config = VOICE_CONFIG[langKey];
        if (!config) return { female: [], male: [] };

        const langPrefix = config.lang.split('-')[0];
        const langVoices = cachedVoices.filter(v => v.lang.startsWith(langPrefix));

        function findByPrefs(prefs) {
            const found = [];
            const seen = new Set();
            for (const name of prefs) {
                const v = langVoices.find(v =>
                    v.name.toLowerCase().includes(name.toLowerCase()) && !seen.has(v.name)
                );
                if (v) { found.push(v); seen.add(v.name); }
            }
            return found;
        }

        let female = findByPrefs(config.female);
        let male = findByPrefs(config.male);

        // Fallback: split available voices by name heuristic
        if (!female.length && !male.length) {
            const malePattern = /henri|alain|claude|paul|fabrice|théo|thomas|jacques|nicolas|injoon|bongjin|male|homme/i;
            male = langVoices.filter(v => malePattern.test(v.name));
            female = langVoices.filter(v => !malePattern.test(v.name));
            if (!female.length) female = langVoices;
        }

        // Sort neural voices first
        const sortNeural = (a, b) => (isNeural(b) ? 1 : 0) - (isNeural(a) ? 1 : 0);
        female.sort(sortNeural);
        male.sort(sortNeural);

        voiceCache[langKey] = { female, male };
        return voiceCache[langKey];
    }

    function pickVoice(langKey) {
        const pool = buildPool(langKey);
        const config = VOICE_CONFIG[langKey];
        if (!config) return null;

        const hasFemale = pool.female.length > 0;
        const hasMale = pool.male.length > 0;
        if (!hasFemale && !hasMale) return null;

        // Alternate gender on each press so the deck naturally mixes men and
        // women; fall back to whichever pool has voices when only one exists.
        let useFemale;
        if (!hasMale) useFemale = true;
        else if (!hasFemale) useFemale = false;
        else useFemale = (lastGender !== 'f');

        const voices = useFemale ? pool.female : pool.male;
        lastGender = useFemale ? 'f' : 'm';

        // Strongly prefer natural/neural voices — only use a robotic local
        // voice if the browser exposes no neural voice for this gender.
        const neural = voices.filter(isNeural);
        const preferred = neural.length ? neural : voices;
        return preferred[Math.floor(Math.random() * preferred.length)];
    }

    function speak() {
        const text = dom.demoPhrase.textContent;
        if (!text || !state.currentLang) return;

        speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        const voice = pickVoice(state.currentLang);
        const config = VOICE_CONFIG[state.currentLang];

        if (voice) utter.voice = voice;
        utter.lang = config?.lang || 'en-US';

        // Tune for natural adult voice
        if (voice && isNeural(voice)) {
            utter.rate = 0.92 + Math.random() * 0.06;
            utter.pitch = 0.95;
        } else {
            utter.rate = 0.84 + Math.random() * 0.06;
            utter.pitch = lastGender === 'f' ? 0.92 : 0.85;
        }

        const btn = dom.speakBtn;
        btn.classList.add('speaking');
        btn.textContent = lastGender === 'f' ? '👩' : '👨';

        const resetBtn = () => { btn.classList.remove('speaking'); btn.textContent = '🔊'; };
        utter.onend = resetBtn;
        utter.onerror = resetBtn;

        speechSynthesis.speak(utter);
    }

    return { speak };
})();

// ═══════════ Confetti Effect ═══════════
function spawnConfetti() {
    const emojis = ['🎉', '🐱', '💝', '⭐', '🌟'];
    const el = document.createElement('div');
    el.textContent = randomFrom(emojis);
    Object.assign(el.style, {
        position: 'fixed',
        left: Math.random() * 100 + '%',
        top: '-10px',
        fontSize: '20px',
        pointerEvents: 'none',
        zIndex: '1000',
    });
    document.body.appendChild(el);

    el.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 100}px) rotate(360deg)`, opacity: 0 },
    ], {
        duration: 3000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }).addEventListener('finish', () => el.remove());
}

// ═══════════ Firestore Service (only used when signed in) ═══════════
const UserService = {
    async loadProfile() {
        const ref = db.collection('users').doc(state.currentUser.uid);
        const doc = await ref.get();
        if (doc.exists) {
            state.userProfile = doc.data();
        } else {
            state.userProfile = {
                displayName: state.currentUser.displayName,
                email: state.currentUser.email,
                photoURL: state.currentUser.photoURL,
                selectedLanguage: null,
                selectedLevel: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(state.userProfile);
        }
    },

    async saveProfile() {
        if (!state.currentUser) return;
        await db.collection('users').doc(state.currentUser.uid).set({
            selectedLanguage: state.currentLang,
            selectedLevel: state.currentLevel,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    },
};

// ═══════════ UI Rendering ═══════════
function renderTopLangStamps() {
    const wrap = dom.topLangStamps;
    wrap.innerHTML = Object.entries(LANGS).map(([key, lang]) => `
        <button class="stamp-btn${key === state.currentLang ? ' active' : ''}" data-lang="${key}">
            <span class="stamp-icon">${lang.flag}</span>
            <span class="stamp-text">${lang.name}</span>
        </button>
    `).join('');

    wrap.querySelectorAll('.stamp-btn').forEach(btn =>
        btn.addEventListener('click', () => selectLanguage(btn.dataset.lang))
    );
}

function renderLevelStamps() {
    const wrap = dom.levelStamps;
    if (!wrap) return;
    wrap.innerHTML = Object.entries(SKILL_LEVELS).map(([key, level]) => `
        <button class="stamp-btn${key === state.currentLevel ? ' active' : ''}" data-level="${key}">
            <span class="stamp-icon">${level.icon}</span>
            <span class="stamp-text">${level.label}</span>
        </button>
    `).join('');

    wrap.querySelectorAll('.stamp-btn').forEach(btn =>
        btn.addEventListener('click', () => selectLevel(btn.dataset.level))
    );
}

function selectLevel(level) {
    state.currentLevel = level;
    renderLevelStamps();
    updateLevelBadge();
    initDemo();
    persistSelection();
}

function updateLevelBadge() {
    const lvl = SKILL_LEVELS[state.currentLevel];
    dom.levelBadge.textContent = `${lvl.icon} ${lvl.label}`;
}

// ═══════════ Language Selection ═══════════
function showLangPicker() {
    dom.langPicker.style.display = 'block';
    dom.mainContent.style.display = 'none';

    dom.langGrid.innerHTML = Object.entries(LANGS).map(([key, lang]) => `
        <div class="lang-card" data-lang="${key}">
            <div class="lang-card-flag">${lang.flag}</div>
            <div class="lang-card-name">${lang.name}</div>
            <div class="lang-card-native">${lang.native}</div>
        </div>
    `).join('');

    dom.langGrid.querySelectorAll('.lang-card').forEach(card =>
        card.addEventListener('click', () => selectLanguage(card.dataset.lang))
    );
}

async function selectLanguage(lang) {
    state.currentLang = lang;
    renderTopLangStamps();
    showMainContent();
    persistSelection();
}

// Remember the language + level, locally always and to the account if signed in.
function persistSelection() {
    LocalPrefs.write({ lang: state.currentLang, level: state.currentLevel });
    if (state.currentUser) UserService.saveProfile().catch(e => console.error('Save failed:', e));
}

// ═══════════ Main Content ═══════════
function showMainContent() {
    dom.langPicker.style.display = 'none';
    dom.mainContent.style.display = 'flex';

    const lang = LANGS[state.currentLang];
    const theme = THEMES[state.currentLang] || THEMES.french;

    // Right-to-left languages (e.g. Hebrew) render the target phrase RTL for a native feel.
    const isRtl = !!lang.rtl;
    dom.demoPhrase.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    dom.mainContent.classList.toggle('rtl-lang', isRtl);

    // Re-skin the whole postcard for the selected language.
    Object.values(THEMES).forEach(t => dom.mainContent.classList.remove(t.cls));
    dom.mainContent.classList.add(theme.cls);

    dom.mainTitle.textContent = theme.title;
    dom.mainTitle.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    dom.mainSubtitle.textContent = theme.subtitle;
    dom.mainSubtitle.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    dom.postmark.innerHTML = theme.postmark.map(escapeHtml).join('<br/>');
    dom.catCaption.textContent = theme.caption;
    dom.refreshBtn.textContent = theme.refresh;
    dom.motivationText.textContent = theme.motivation;
    dom.motivationText.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    // Localize the shared chrome (top-bar labels + stats) to the selected language.
    if (dom.langueLabel) dom.langueLabel.textContent = theme.ui.langue;
    if (dom.levelLabel) dom.levelLabel.textContent = theme.ui.level;
    const seenLabel = document.getElementById('seenLabel');
    if (seenLabel) seenLabel.textContent = theme.ui.seen;

    renderLevelStamps();
    updateLevelBadge();
    initDemo();
}

function initDemo() {
    state.demoCount = 0;
    dom.phrasesLearned.textContent = '0';
    dom.progressFill.style.width = '0%';
    buildActiveDemos();

    if (state.activeDemos.length) {
        nextDemo();
    } else {
        const lang = LANGS[state.currentLang];
        const ui = currentUI();
        dom.demoPhrase.textContent = lang.hi;
        dom.demoMeaning.textContent = ui.start;
        setCatImage(lang.hi);
        dom.lessonTopTab.textContent = ui.carnet;
        dom.lessonTopTitle.textContent = ui.spotlight;
        dom.lessonTopBody.innerHTML = `<div class="spotlight-words"><span class="spotlight-word">${escapeHtml(lang.hi)}</span></div>`;
        dom.lessonBottomTab.textContent = ui.encore;
        dom.lessonBottomTitle.textContent = ui.related;
        dom.lessonExamples.innerHTML = `<p class="spotlight-empty">${escapeHtml(ui.comingSoon)}</p>`;
    }
}

// ═══════════ Authentication (optional) ═══════════
// The app is fully usable without an account. Signing in simply syncs the
// language/level choice to Firestore so it follows the user across devices.
async function signIn() {
    try {
        dom.loginError.textContent = '';
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch (e) {
        dom.loginError.textContent = e.message;
        console.error('Sign-in failed:', e);
    }
}

function updateAuthUI() {
    const user = state.currentUser;
    dom.logoutBtn.style.display = user ? '' : 'none';
    dom.topLoginBtn.style.display = user ? 'none' : '';
    if (user) {
        const hasPhoto = !!user.photoURL;
        dom.userAvatar.style.display = hasPhoto ? '' : 'none';
        dom.userAvatar.src = user.photoURL || '';
        dom.userName.textContent = user.displayName || user.email || '';
    } else {
        dom.userAvatar.style.display = 'none';
        dom.userAvatar.src = '';
        dom.userName.textContent = '';
    }
}

dom.topLoginBtn.addEventListener('click', signIn);
const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) googleLoginBtn.addEventListener('click', signIn);
dom.logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(async (user) => {
    state.currentUser = user || null;
    updateAuthUI();
    if (!user) return;

    try {
        await UserService.loadProfile();
        const savedLang = state.userProfile.selectedLanguage;
        const savedLevel = state.userProfile.selectedLevel;

        if (!state.currentLang && savedLang && LANGS[savedLang]) {
            // Visitor hadn't chosen yet this session — restore their account choice.
            state.currentLang = savedLang;
            if (savedLevel && SKILL_LEVELS[savedLevel]) state.currentLevel = savedLevel;
            LocalPrefs.write({ lang: state.currentLang, level: state.currentLevel });
            renderTopLangStamps();
            showMainContent();
        } else if (state.currentLang) {
            // Push the local choice up to the account.
            UserService.saveProfile().catch(e => console.error('Save failed:', e));
        }
    } catch (e) {
        console.error('Profile load failed:', e);
    }
});

// ═══════════ Boot ═══════════
// Show content immediately, honoring the last saved language/level from
// localStorage — no login required.
function boot() {
    const prefs = LocalPrefs.read();
    if (prefs.lang && LANGS[prefs.lang]) state.currentLang = prefs.lang;
    if (prefs.level && SKILL_LEVELS[prefs.level]) state.currentLevel = prefs.level;

    updateAuthUI();
    renderTopLangStamps();
    renderLevelStamps();
    showScreen('mainApp');

    if (state.currentLang) showMainContent();
    else showLangPicker();
}

// ═══════════ Event Listeners ═══════════
dom.refreshBtn.addEventListener('click', nextDemo);
dom.speakBtn.addEventListener('click', () => TTS.speak());

boot();
