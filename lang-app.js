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
    currentLevel: null,
    currentAnimal: 'cat',
    demoCount: 0,
    activeDemos: [],
    lastDemoIndex: -1,
};

// ═══════════ DOM References ═══════════
const dom = {
    get loginError() { return document.getElementById('loginError'); },
    get userAvatar() { return document.getElementById('userAvatar'); },
    get userName() { return document.getElementById('userName'); },
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
    get topLangStamps() { return document.getElementById('topLangStamps'); },
    get animalStamps() { return document.getElementById('animalStamps'); },
};

// ═══════════ Utilities ═══════════
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function getAutoLevel(lang) {
    // Default level for all languages
    return 'elementary';
}

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════ Phrase Engine ═══════════
function buildActiveDemos() {
    const { currentLang } = state;
    let phrases = [];

    if (currentLang === 'korean') {
        phrases = LEVEL_DEMO.korean?.elementary || DEMO.korean || [];
    } else if (currentLang === 'french') {
        const a1 = LEVEL_DEMO.french?.beginner || [];
        const a2 = LEVEL_DEMO.french?.elementary || [];
        const b1 = LEVEL_DEMO.french?.intermediate || [];
        // Weight harder content more heavily for spaced repetition effect
        phrases = [...a1, ...a2, ...a2, ...b1, ...b1, ...b1];
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
    state.lastDemoIndex = idx;

    const phrase = activeDemos[idx];
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
        setAnimalImage(keyword);
    }, 200);

    state.demoCount++;
    dom.phrasesLearned.textContent = state.demoCount;
    dom.progressFill.style.width = Math.min((state.demoCount / activeDemos.length) * 100, 100) + '%';
}

// ═══════════ Animal Image Service ═══════════
async function fetchAnimalUrl(animal, keyword) {
    const apis = {
        dog: async () => {
            const r = await fetch('https://dog.ceo/api/breeds/image/random');
            const j = await r.json();
            return j.message;
        },
        fox: async () => {
            const r = await fetch('https://randomfox.ca/floof/');
            const j = await r.json();
            return j.image;
        },
        cat: (kw) => `https://cataas.com/cat/says/${encodeURIComponent(kw || 'Bonjour')}?size=200&color=white&fontSize=22`,
    };

    if (animal !== 'cat' && apis[animal]) {
        try { return await apis[animal](); }
        catch { /* fall through to cat */ }
    }
    return apis.cat(keyword);
}

async function setAnimalImage(keyword) {
    const img = dom.catImage;
    img.style.opacity = '0';
    const url = await fetchAnimalUrl(state.currentAnimal, keyword);
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

        let useFemale;
        if (!hasMale) useFemale = true;
        else if (!hasFemale) useFemale = false;
        else useFemale = Math.random() < config.femaleBias;

        const voices = useFemale ? pool.female : pool.male;
        lastGender = useFemale ? 'f' : 'm';

        // Pick from top 3 (neural-sorted)
        const topN = Math.min(voices.length, 3);
        return voices[Math.floor(Math.random() * topN)];
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

// ═══════════ Firestore Service ═══════════
const UserService = {
    async loadProfile() {
        const doc = await db.collection('users').doc(state.currentUser.uid).get();
        if (doc.exists) {
            state.userProfile = doc.data();
        } else {
            state.userProfile = {
                displayName: state.currentUser.displayName,
                email: state.currentUser.email,
                photoURL: state.currentUser.photoURL,
                selectedLanguage: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection('users').doc(state.currentUser.uid).set(state.userProfile);
        }
        renderTopLangStamps();
        renderAnimalStamps();
    },

    async saveProfile() {
        await db.collection('users').doc(state.currentUser.uid).update({
            ...state.userProfile,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
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

function renderAnimalStamps() {
    const wrap = dom.animalStamps;
    wrap.innerHTML = Object.entries(ANIMALS).map(([key, animal]) => `
        <button class="stamp-btn${key === state.currentAnimal ? ' active' : ''}" data-animal="${key}">
            <span class="stamp-icon">${animal.icon}</span>
            <span class="stamp-text">${animal.label}</span>
        </button>
    `).join('');

    wrap.querySelectorAll('.stamp-btn').forEach(btn =>
        btn.addEventListener('click', () => selectAnimal(btn.dataset.animal))
    );
}

function selectAnimal(animal) {
    state.currentAnimal = animal;
    renderAnimalStamps();

    const phrase = state.activeDemos[state.lastDemoIndex];
    const keyword = phrase?.kw ? randomFrom(phrase.kw) : LANGS[state.currentLang]?.hi;
    setAnimalImage(keyword);
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
    state.userProfile.selectedLanguage = lang;
    state.currentLevel = getAutoLevel(lang);
    await UserService.saveProfile();
    renderTopLangStamps();
    showMainContent();
}

// ═══════════ Main Content ═══════════
function showMainContent() {
    dom.langPicker.style.display = 'none';
    dom.mainContent.style.display = 'flex';

    const lang = LANGS[state.currentLang];
    dom.mainSubtitle.textContent = state.currentLang === 'french'
        ? 'Une carte postale de Paris, chaque jour'
        : `Learn ${lang.name} with adorable animals!`;
    dom.motivationText.textContent = `${lang.hi} Keep learning ${lang.name}! 💪`;

    // Set level badge
    if (state.currentLang === 'korean') {
        dom.levelBadge.textContent = '🌿 Elementary';
    } else if (state.currentLang === 'french') {
        dom.levelBadge.textContent = '📚 A1–B1 (B1 weighted)';
    } else if (state.currentLevel) {
        const level = LEVELS[state.currentLevel];
        dom.levelBadge.textContent = `${level.emoji} ${level.name}`;
    }

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
        dom.demoPhrase.textContent = lang.hi;
        dom.demoMeaning.textContent = `Start learning ${lang.name}!`;
        setAnimalImage(lang.hi);
    }
}

// ═══════════ Authentication ═══════════
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    try {
        dom.loginError.textContent = '';
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch (e) {
        dom.loginError.textContent = e.message;
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(async (user) => {
    if (user) {
        state.currentUser = user;
        showScreen('loadingScreen');
        try {
            await UserService.loadProfile();
            dom.userAvatar.src = user.photoURL || '';
            dom.userName.textContent = user.displayName || user.email;
            showScreen('mainApp');

            if (state.userProfile.selectedLanguage) {
                state.currentLang = state.userProfile.selectedLanguage;
                renderTopLangStamps();
                state.currentLevel = getAutoLevel(state.currentLang);
                showMainContent();
            } else {
                showLangPicker();
            }
        } catch (e) {
            console.error('Auth error:', e);
            showScreen('loginScreen');
        }
    } else {
        state.currentUser = null;
        state.userProfile = null;
        showScreen('loginScreen');
    }
});

// ═══════════ Event Listeners ═══════════
dom.refreshBtn.addEventListener('click', nextDemo);
dom.speakBtn.addEventListener('click', () => TTS.speak());
