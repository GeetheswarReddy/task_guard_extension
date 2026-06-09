// Hybrid relevance classifier — no model download, runs instantly in the browser.
// Combines four signals (weights in parentheses):
//   1. Topic Jaccard overlap (0.50)            — intent and domain mapped to topic
//                                                 categories via keyword lists.
//   2. Term-frequency cosine similarity (0.25) — normalized TF vectors over stemmed
//                                                 tokens (no IDF — not classical TF-IDF).
//   3. Direct domain-token hit (0.15)          — stemmed prefix/equality match between
//                                                 domain tokens and intent tokens.
//   4. Known-domain bonus (0.10)               — domain in the curated lookup table
//                                                 AND shares at least one topic.
// Raw 0–1 weighted sum is squashed by a logistic sigmoid for calibration, then
// scaled to an integer 0–100. Inputs: intent title + task description + popup
// category. Output: a single 0–100 relevance score.

// ── Stopwords ─────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'from','about','how','what','when','where','why','which','who','is','are',
    'was','were','be','been','being','have','has','had','do','does','did','will',
    'would','could','should','may','might','i','my','me','we','our','you','your',
    'it','its','this','that','these','those','am','up','get','make','need','want',
    'use','using','help','some','just','also','very','more','then','than','so',
    'can','now','new','one','all','any','if','as','not','no','into','over',
]);

// ── Abbreviation expansion ────────────────────────────────────────────────────
// Run before tokenization so short abbreviations (≤2 chars) aren't filtered out.
// Keys are space-padded so only whole words are replaced.
const ABBR = {
    ' ml ':    ' machine learning ',
    ' ai ':    ' artificial intelligence ',
    ' js ':    ' javascript ',
    ' ts ':    ' typescript ',
    ' db ':    ' database ',
    ' os ':    ' operating system ',
    ' dsa ':   ' data structures algorithms ',
    ' ds ':    ' data structures ',
    ' oop ':   ' programming ',
    ' nlp ':   ' natural language processing ',
    ' cv ':    ' computer vision ',
    ' ui ':    ' design ',
    ' ux ':    ' design ',
    ' sql ':   ' sql ',
    ' api ':   ' api ',
    ' css ':   ' css ',
    ' html ':  ' html ',
    ' aws ':   ' cloud ',
    ' gcp ':   ' cloud ',
    ' ci ':    ' deployment ',
    ' cd ':    ' deployment ',
};

function expandAbbreviations(text) {
    let t = ' ' + text.toLowerCase() + ' ';
    for (const [abbr, expansion] of Object.entries(ABBR)) {
        t = t.split(abbr).join(expansion);
    }
    return t.trim();
}

// ── Stemmer ───────────────────────────────────────────────────────────────────
// Simple suffix stripping so "algorithms"/"algorithm", "debugging"/"debug",
// "studying"/"study" all map to the same key in TF vectors.
function stem(t) {
    if (t.length > 7 && t.endsWith('tion'))  return t.slice(0, -4);
    if (t.length > 6 && t.endsWith('ing'))   return t.slice(0, -3);
    if (t.length > 5 && t.endsWith('ed'))    return t.slice(0, -2);
    if (t.length > 5 && t.endsWith('er'))    return t.slice(0, -2);
    if (t.length > 5 && t.endsWith('ly'))    return t.slice(0, -2);
    if (t.length > 4 && t.endsWith('s'))     return t.slice(0, -1);
    return t;
}

// ── Topic keyword lists ────────────────────────────────────────────────────────
const TOPIC_KEYWORDS = {
    coding: [
        'code','coding','program','programming','develop','development','software',
        'javascript','python','java','typescript','react','angular','vue','node',
        'css','html','sql','rust','golang','cpp','kotlin','swift','php',
        'nextjs','svelte','astro','remix','django','fastapi','flask','express','spring',
        'bug','debug','error','exception','algorithm','function','api',
        'git','commit','push','pull','repo','repository','deploy','deployment',
        'build','test','testing','lint','compile','runtime','framework','library',
        'jest','vitest','pytest','mocha','chai','cypress','playwright','unittest',
        'backend','frontend','fullstack','devops','docker','kubernetes','cloud',
        'aws','gcp','azure','terraform','ansible','nginx','redis','postgres','mongodb',
        'flutter','android','ios','expo','mobile',
    ],
    studying: [
        'study','studying','exam','quiz','lecture','revision','revise','homework',
        'assignment','learn','learning','understand','chapter','notes','class',
        'course','subject','topic','prepare','preparation','preparing','semester',
        'midterm','final','test','grade','score','tutor','textbook','syllabus',
        'concept','formula','definition','proof','theorem','problem','exercise',
        'operating','system','network','database','algorithm','data structure',
        'physics','chemistry','biology','math','calculus','statistics','history',
        'economics','law','medicine','engineering','science',
    ],
    writing: [
        'write','writing','essay','report','draft','article','document','blog',
        'compose','edit','editing','content','thesis','dissertation','paper',
        'manuscript','paragraph','sentence','grammar','proofread','outline',
        'abstract','introduction','conclusion','citation','reference','format',
    ],
    research: [
        'research','survey','analysis','literature','academic','reference',
        'cite','citation','paper','journal','publication','investigate',
        'hypothesis','experiment','methodology','findings','data','results',
        'review','systematic','meta','empirical','quantitative','qualitative',
    ],
    design: [
        'design','wireframe','prototype','mockup','figma','sketch',
        'graphic','visual','layout','logo','brand','typography','color','palette',
        'illustration','icon','animation','motion','creative','adobe','photoshop',
        'illustrator','indesign','canva','dribbble','behance',
    ],
    data: [
        'data','dataset','machine learning','artificial intelligence',
        'neural','model','training','feature','classification','regression',
        'clustering','pandas','numpy','tensorflow','pytorch','keras','scikit',
        'analytics','visualization','tableau','powerbi','notebook','jupyter',
        'colab','transformers','llm','embedding','vector','fine-tune',
        'statistics','probability','distribution','matrix',
    ],
    work: [
        'work','working','job','task','project','meeting','email','report',
        'deadline','client','team','manager','presentation','proposal','office',
        'sprint','ticket','jira','slack','productivity','professional',
    ],
    reading: [
        'read','reading','book','article','blog','novel','fiction','nonfiction',
        'chapter','page','author','literature','library','ebook','pdf',
    ],
    social: [
        'social','chat','message','post','share','connect','friend','follow',
        'comment','like','tweet','instagram','tiktok','reddit','forum',
    ],
    entertainment: [
        'watch','movie','film','music','game','gaming','video','stream','series',
        'episode','playlist','podcast','sport','relax','fun','play','anime',
    ],
    shopping: [
        'buy','purchase','order','shop','shopping','product','price','deal',
        'amazon','delivery','cart','checkout','discount','offer',
    ],
};

// ── Popup category → classifier topic name ────────────────────────────────────
const CATEGORY_TO_TOPIC = {
    studying:    'studying',
    coding:      'coding',
    writing:     'writing',
    research:    'research',
    work:        'work',
    design:      'design',
    reading:     'reading',
    // 'other' intentionally omitted — let text inference handle it
};

// ── Known domain → topic mapping ──────────────────────────────────────────────
const DOMAIN_TOPIC_MAP = {
    // Coding
    'github.com':              ['coding'],
    'gitlab.com':              ['coding'],
    'bitbucket.org':           ['coding'],
    'stackoverflow.com':       ['coding'],
    'codepen.io':              ['coding'],
    'replit.com':              ['coding'],
    'leetcode.com':            ['coding','studying'],
    'hackerrank.com':          ['coding','studying'],
    'codeforces.com':          ['coding','studying'],
    'npmjs.com':               ['coding'],
    'pypi.org':                ['coding'],
    'developer.mozilla.org':   ['coding'],
    'developers.google.com':   ['coding'],
    'w3schools.com':           ['coding','studying'],
    'geeksforgeeks.org':       ['coding','studying'],
    'tutorialspoint.com':      ['coding','studying'],
    'javatpoint.com':          ['coding','studying'],
    'cppreference.com':        ['coding'],
    'docs.python.org':         ['coding'],
    'docs.rs':                 ['coding'],
    'pkg.go.dev':              ['coding'],
    'hub.docker.com':          ['coding'],
    'vercel.com':              ['coding'],
    'netlify.com':             ['coding'],
    'circleci.com':            ['coding'],
    'github.io':               ['coding'],
    // Studying / learning
    'coursera.org':            ['studying'],
    'udemy.com':               ['studying'],
    'edx.org':                 ['studying'],
    'khanacademy.org':         ['studying'],
    'brilliant.org':           ['studying'],
    'udacity.com':             ['studying'],
    'pluralsight.com':         ['studying','coding'],
    'codecademy.com':          ['studying','coding'],
    'freecodecamp.org':        ['studying','coding'],
    'mit.edu':                 ['studying','research'],
    'nptel.ac.in':             ['studying'],
    'byjus.com':               ['studying'],
    'vedantu.com':             ['studying'],
    'unacademy.com':           ['studying'],
    // Research
    'wikipedia.org':           ['research','studying'],
    'scholar.google.com':      ['research'],
    'arxiv.org':               ['research'],
    'pubmed.ncbi.nlm.nih.gov': ['research'],
    'researchgate.net':        ['research'],
    'jstor.org':               ['research'],
    'ieee.org':                ['research','coding'],
    'acm.org':                 ['research','coding'],
    'springer.com':            ['research'],
    'sciencedirect.com':       ['research'],
    // Writing / docs
    'overleaf.com':            ['writing','research'],
    'grammarly.com':           ['writing'],
    'wordtune.com':            ['writing'],
    'notion.so':               ['writing','work'],
    'docs.google.com':         ['writing','work'],
    'office.com':              ['writing','work'],
    // Work / productivity
    'gmail.com':               ['work'],
    'outlook.com':             ['work'],
    'calendar.google.com':     ['work'],
    'trello.com':              ['work'],
    'asana.com':               ['work'],
    'linear.app':              ['work','coding'],
    'jira.atlassian.com':      ['work','coding'],
    'confluence.atlassian.com':['work'],
    'slack.com':               ['work'],
    // Design
    'figma.com':               ['design'],
    'canva.com':               ['design'],
    'dribbble.com':            ['design'],
    'behance.net':             ['design'],
    'adobe.com':               ['design'],
    // Data / ML
    'kaggle.com':              ['data','coding'],
    'huggingface.co':          ['data','coding'],
    'colab.research.google.com':['data','coding'],
    'wandb.ai':                ['data','coding'],
    'databricks.com':          ['data'],
    // Entertainment / social
    'youtube.com':             ['entertainment'],
    'netflix.com':             ['entertainment'],
    'twitch.tv':               ['entertainment'],
    'spotify.com':             ['entertainment'],
    'primevideo.com':          ['entertainment'],
    'hotstar.com':             ['entertainment'],
    'reddit.com':              ['social','entertainment'],
    'twitter.com':             ['social'],
    'x.com':                   ['social'],
    'facebook.com':            ['social','entertainment'],
    'instagram.com':           ['social','entertainment'],
    'tiktok.com':              ['social','entertainment'],
    'snapchat.com':            ['social','entertainment'],
    'whatsapp.com':            ['social'],
    'telegram.org':            ['social'],
    'discord.com':             ['social'],
    'linkedin.com':            ['social','work'],
    // Shopping
    'amazon.com':              ['shopping'],
    'amazon.in':               ['shopping'],
    'flipkart.com':            ['shopping'],
    'ebay.com':                ['shopping'],
    'myntra.com':              ['shopping'],
    'meesho.com':              ['shopping'],
    // News / reading
    'bbc.com':                 ['reading'],
    'cnn.com':                 ['reading'],
    'nytimes.com':             ['reading'],
    'theguardian.com':         ['reading'],
    'medium.com':              ['reading','writing'],
    'substack.com':            ['reading','writing'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function splitCompound(word) {
    return word
        .replace(/([a-z])([0-9])/g, '$1 $2')
        .replace(/([0-9])([a-z])/g, '$1 $2')
        .split(/\s+/)
        .filter(t => t.length > 2);
}

function domainTokens(domain) {
    const tlds = new Set(['com','org','net','io','co','in','edu','gov','uk','de','fr','au','jp']);
    return domain.split('.')
        .filter(p => p !== 'www' && !tlds.has(p))
        .flatMap(p => splitCompound(p))
        .map(t => t.toLowerCase());
}

// buildTF applies stemming so "algorithms" and "algorithm" share the same key
function buildTF(tokens) {
    const tf = {};
    tokens.forEach(t => {
        const key = stem(t);
        tf[key] = (tf[key] || 0) + 1;
    });
    const total = tokens.length || 1;
    Object.keys(tf).forEach(k => { tf[k] /= total; });
    return tf;
}

function cosine(a, b) {
    let dot = 0, magA = 0, magB = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => {
        const va = a[k] || 0, vb = b[k] || 0;
        dot += va * vb;
        magA += va * va;
        magB += vb * vb;
    });
    if (!magA || !magB) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ── Topic utilities ───────────────────────────────────────────────────────────

function lookupDomainTopics(domain) {
    for (const [d, topics] of Object.entries(DOMAIN_TOPIC_MAP)) {
        if (domain === d || domain.endsWith('.' + d)) return new Set(topics);
    }
    return null;
}

function inferTopicsFromTokens(tokens, topicMap) {
    const matched = new Set();
    const stemmed = tokens.map(stem);
    for (const [topic, keywords] of Object.entries(topicMap)) {
        for (const kw of keywords) {
            const kwStem = stem(kw);
            if (stemmed.some(t => t === kwStem || t.startsWith(kwStem) || kwStem.startsWith(t))) {
                matched.add(topic);
                break;
            }
        }
    }
    return matched;
}

// ── Sigmoid scaling ───────────────────────────────────────────────────────────
// raw 0 → ~12%,  raw 0.25 → ~50%,  raw 0.5 → ~82%,  raw 0.75 → ~96%
function sigmoid(x) {
    return 1 / (1 + Math.exp(-8 * (x - 0.25)));
}

// ── Main export ───────────────────────────────────────────────────────────────

// intentCategory: value from the popup category dropdown (e.g. "studying", "coding")
export function classifyRelevance(domain, intent, description = '', intentCategory = '') {
    if (!domain || !intent) return 0;

    // Expand abbreviations first so ML/OS/DSA etc. aren't silently filtered
    const fullText = expandAbbreviations([intent, description].filter(Boolean).join(' '));
    const intentTokens = tokenize(fullText);
    if (intentTokens.length === 0) return 0;

    const dTokens = domainTokens(domain);
    const knownTopics = lookupDomainTopics(domain);
    const domainTopics = knownTopics ?? inferTopicsFromTokens(dTokens, TOPIC_KEYWORDS);

    // Seed intent topics from the user's explicit category selection,
    // then augment with whatever text inference finds
    const intentTopics = inferTopicsFromTokens(intentTokens, TOPIC_KEYWORDS);
    const mappedTopic = CATEGORY_TO_TOPIC[intentCategory];
    if (mappedTopic) intentTopics.add(mappedTopic);

    // ── Score 1: Topic Jaccard overlap ───────────────────────────────────────
    const sharedTopics = [...intentTopics].filter(t => domainTopics.has(t));
    const union = new Set([...intentTopics, ...domainTopics]).size;
    const topicScore = union > 0 ? sharedTopics.length / union : 0;

    // ── Score 2: TF cosine (targeted) ────────────────────────────────────────
    // Compare intent tokens against keywords from shared topics only.
    // Stemming inside buildTF means surface form differences don't block matches.
    // No IDF term: keyword frequency across topics isn't modelled here.
    let cosineScore = 0;
    if (sharedTopics.length > 0) {
        const targetKeywords = sharedTopics.flatMap(t => TOPIC_KEYWORDS[t] || []);
        cosineScore = cosine(buildTF(intentTokens), buildTF(targetKeywords));
    }

    // ── Score 3: Direct domain token hit ─────────────────────────────────────
    const stemmedIntent = intentTokens.map(stem);
    const directHits = dTokens.filter(dt => {
        const dtStem = stem(dt);
        return stemmedIntent.some(it => it === dtStem || it.startsWith(dtStem) || dtStem.startsWith(it));
    }).length;
    const directScore = Math.min(directHits / Math.max(dTokens.length, 1), 1);

    // ── Known domain bonus ────────────────────────────────────────────────────
    const knownBonus = (knownTopics !== null && sharedTopics.length > 0) ? 0.1 : 0;

    // ── Weighted combination + sigmoid scaling ────────────────────────────────
    const raw = (topicScore * 0.50) + (cosineScore * 0.25) + (directScore * 0.15) + knownBonus;
    return Math.round(sigmoid(Math.min(raw, 1)) * 100);
}
