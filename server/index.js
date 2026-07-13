import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import cors from "cors";
import express from "express";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const uploadDir = path.join(rootDir, "uploads");
const dbPath = path.join(dataDir, "vichola.sqlite");

mkdirSync(dataDir, { recursive: true });
mkdirSync(uploadDir, { recursive: true });

const db = new DatabaseSync(dbPath);
const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_request, file, callback) => {
      const safeExt = path.extname(file.originalname).toLowerCase() || ".jpg";
      callback(null, `${Date.now()}-${randomBytes(8).toString("hex")}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype));
  },
});

const cityCoordinates = {
  "Fresno, CA": [36.7378, -119.7871],
  "San Jose, CA": [37.3382, -121.8863],
  "Sacramento, CA": [38.5816, -121.4944],
  "Yuba City, CA": [39.1404, -121.6169],
  "New York, NY": [40.7128, -74.006],
  "Brampton, ON": [43.7315, -79.7624],
  "Vancouver, BC": [49.2827, -123.1207],
  "Surrey, BC": [49.1913, -122.849],
  "Calgary, AB": [51.0447, -114.0719],
  "London, UK": [51.5072, -0.1276],
  "Ludhiana, Punjab": [30.901, 75.8573],
  "Amritsar, Punjab": [31.634, 74.8723],
  "Jalandhar, Punjab": [31.326, 75.5762],
  "Patiala, Punjab": [30.3398, 76.3869],
};

const seededProfiles = [
  {
    email: "gurleen.demo@vichola.app",
    name: "Gurleen Kaur",
    gender: "Woman",
    age: 29,
    city: "Vancouver, BC",
    lat: 49.2827,
    lng: -123.1207,
    profession: "UX researcher",
    education: "Master's",
    about:
      "Punjabi at home, focused at work, and happiest around family dinners, kirtan mornings, and slow Sunday walks.",
    lookingFor:
      "A Sikh Punjabi partner who is emotionally steady, family respectful, and open to building in Canada or California.",
    practice: "Keshdhari",
    diet: "Vegetarian-friendly",
    familyPace: "Family-ready",
    relocation: "Open to relocate",
    languages: "Punjabi,English",
    interests: "Kirtan,Chaa walks,Design,Travel",
    minAge: 28,
    maxAge: 34,
    maxDistance: 5000,
    preferredCities: "Vancouver, BC;Surrey, BC;San Jose, CA;Fresno, CA",
    preferredPractice: "Any Sikh practice",
    preferredFamilyPace: "Balanced",
    avatarColor: "#16665b",
  },
  {
    email: "armaan.demo@vichola.app",
    name: "Armaan Singh",
    gender: "Man",
    age: 31,
    city: "Fresno, CA",
    lat: 36.7378,
    lng: -119.7871,
    profession: "Civil engineer",
    education: "Bachelor's",
    about:
      "Raised between pind stories and Central Valley life. Practical, warm, and serious about marriage without rushing trust.",
    lookingFor:
      "A partner who values Sikhi, Punjabi language, career respect, and close family ties.",
    practice: "Sehajdhari",
    diet: "No preference",
    familyPace: "Balanced",
    relocation: "Prefer nearby",
    languages: "Punjabi,English,Hindi",
    interests: "Kabaddi,Home cooking,Gurbani,Weekend trips",
    minAge: 26,
    maxAge: 32,
    maxDistance: 350,
    preferredCities: "Fresno, CA;Yuba City, CA;San Jose, CA;Sacramento, CA",
    preferredPractice: "Any Sikh practice",
    preferredFamilyPace: "Balanced",
    avatarColor: "#be5269",
  },
  {
    email: "mehar.demo@vichola.app",
    name: "Mehar Kaur",
    gender: "Woman",
    age: 28,
    city: "Brampton, ON",
    lat: 43.7315,
    lng: -79.7624,
    profession: "Physician assistant",
    education: "Master's",
    about:
      "Health focused, music loving, and close to siblings. I prefer real conversations before involving the whole family.",
    lookingFor:
      "Someone Sikh Punjabi, kind under pressure, and ready for a thoughtful relationship-first path.",
    practice: "Culturally Sikh",
    diet: "Vegetarian",
    familyPace: "Slow first",
    relocation: "Maybe later",
    languages: "Punjabi,English",
    interests: "Fitness,Live music,Langar,Books",
    minAge: 28,
    maxAge: 35,
    maxDistance: 900,
    preferredCities: "Brampton, ON;New York, NY;Vancouver, BC",
    preferredPractice: "Any Sikh practice",
    preferredFamilyPace: "Slow first",
    avatarColor: "#d48618",
  },
  {
    email: "jasraj.demo@vichola.app",
    name: "Jasraj Singh",
    gender: "Man",
    age: 30,
    city: "New York, NY",
    lat: 40.7128,
    lng: -74.006,
    profession: "Product manager",
    education: "Master's",
    about:
      "City life, Punjabi food, strong friendships, and clear communication. My family is supportive of a modern process.",
    lookingFor:
      "A Sikh Punjabi partner who wants commitment, shared financial clarity, and a balanced family introduction.",
    practice: "Keshdhari",
    diet: "No preference",
    familyPace: "Balanced",
    relocation: "Open to relocate",
    languages: "Punjabi,English,Spanish",
    interests: "Startups,Dhabas,Bhangra,Finance",
    minAge: 27,
    maxAge: 33,
    maxDistance: 1200,
    preferredCities: "New York, NY;Brampton, ON;London, UK",
    preferredPractice: "Any Sikh practice",
    preferredFamilyPace: "Balanced",
    avatarColor: "#6d7d3f",
  },
  {
    email: "simran.demo@vichola.app",
    name: "Simran Kaur",
    gender: "Woman",
    age: 27,
    city: "Yuba City, CA",
    lat: 39.1404,
    lng: -121.6169,
    profession: "Teacher",
    education: "Bachelor's",
    about:
      "Grounded, joyful, and deeply connected to Punjabi language. I love gurdwara seva and family game nights.",
    lookingFor:
      "A Sikh Punjabi partner who respects teaching, wants kids someday, and feels at home in sangat.",
    practice: "Amritdhari",
    diet: "Vegetarian",
    familyPace: "Family-ready",
    relocation: "Prefer nearby",
    languages: "Punjabi,English",
    interests: "Seva,Teaching,Family nights,Poetry",
    minAge: 28,
    maxAge: 34,
    maxDistance: 260,
    preferredCities: "Yuba City, CA;Sacramento, CA;Fresno, CA;San Jose, CA",
    preferredPractice: "Keshdhari or Amritdhari",
    preferredFamilyPace: "Family-ready",
    avatarColor: "#0d403a",
  },
  {
    email: "harnoor.demo@vichola.app",
    name: "Harnoor Singh",
    gender: "Man",
    age: 33,
    city: "London, UK",
    lat: 51.5072,
    lng: -0.1276,
    profession: "Data scientist",
    education: "PhD",
    about:
      "Analytical at work, soft at home. I care about Sikhi, curiosity, Punjabi music, and building a peaceful household.",
    lookingFor:
      "A Sikh Punjabi partner who enjoys thoughtful conversation and can imagine a global family life.",
    practice: "Sehajdhari",
    diet: "Vegetarian-friendly",
    familyPace: "Slow first",
    relocation: "Open to relocate",
    languages: "Punjabi,English",
    interests: "AI,Classical music,Travel,Gurbani",
    minAge: 28,
    maxAge: 34,
    maxDistance: 6000,
    preferredCities: "London, UK;Vancouver, BC;New York, NY;Brampton, ON",
    preferredPractice: "Any Sikh practice",
    preferredFamilyPace: "Slow first",
    avatarColor: "#9a5c00",
  },
];

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    is_seed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    age INTEGER NOT NULL DEFAULT 28,
    city TEXT NOT NULL DEFAULT '',
    lat REAL,
    lng REAL,
    profession TEXT NOT NULL DEFAULT '',
    education TEXT NOT NULL DEFAULT '',
    about TEXT NOT NULL DEFAULT '',
    looking_for TEXT NOT NULL DEFAULT '',
    religion TEXT NOT NULL DEFAULT 'Sikh',
    community TEXT NOT NULL DEFAULT 'Punjabi',
    practice TEXT NOT NULL DEFAULT 'Any Sikh practice',
    diet TEXT NOT NULL DEFAULT 'No preference',
    family_pace TEXT NOT NULL DEFAULT 'Balanced',
    relocation TEXT NOT NULL DEFAULT 'Maybe later',
    languages TEXT NOT NULL DEFAULT 'Punjabi,English',
    interests TEXT NOT NULL DEFAULT '',
    min_age INTEGER NOT NULL DEFAULT 24,
    max_age INTEGER NOT NULL DEFAULT 38,
    max_distance INTEGER NOT NULL DEFAULT 250,
    preferred_cities TEXT NOT NULL DEFAULT '',
    preferred_gender TEXT NOT NULL DEFAULT 'Opposite gender',
    preferred_practice TEXT NOT NULL DEFAULT 'Any Sikh practice',
    preferred_family_pace TEXT NOT NULL DEFAULT 'Balanced',
    avatar_color TEXT NOT NULL DEFAULT '#16665b',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_user_id, to_user_id)
  );
`);

ensureColumn("profiles", "preferred_gender", "TEXT NOT NULL DEFAULT 'Opposite gender'");
seedDatabase();

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, database: dbPath });
});

app.get("/api/options", (_request, response) => {
  response.json({
    cities: Object.keys(cityCoordinates),
    genders: ["Woman", "Man"],
    practices: [
      "Any Sikh practice",
      "Amritdhari",
      "Keshdhari",
      "Sehajdhari",
      "Culturally Sikh",
      "Keshdhari or Amritdhari",
    ],
    diets: ["No preference", "Vegetarian", "Vegetarian-friendly", "Egg okay", "Non-vegetarian"],
    familyPaces: ["Slow first", "Balanced", "Family-ready"],
    relocations: ["Prefer nearby", "Maybe later", "Open to relocate"],
    languages: ["Punjabi", "English", "Hindi", "Spanish"],
  });
});

app.post("/api/auth/signup", (request, response) => {
  const body = request.body ?? {};
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const gender = String(body.gender ?? "").trim();
  const city = String(body.city ?? "").trim();
  const agreement = Boolean(body.sikhPunjabiAgreement);

  if (!email || !password || !name || !gender || !city) {
    return response.status(400).json({ error: "Name, email, password, gender, and city are required." });
  }

  if (password.length < 8) {
    return response.status(400).json({ error: "Password must be at least 8 characters." });
  }

  if (!agreement) {
    return response.status(400).json({ error: "Vichola is currently for Sikh Punjabi matchmaking only." });
  }

  const coords = coordinatesForCity(city);

  try {
    const userInsert = db
      .prepare("INSERT INTO users (email, password_hash, is_seed) VALUES (?, ?, 0)")
      .run(email, hashPassword(password));

    const userId = Number(userInsert.lastInsertRowid);
    db.prepare(
      `INSERT INTO profiles (
        user_id, name, gender, city, lat, lng, religion, community, languages, avatar_color
      ) VALUES (?, ?, ?, ?, ?, ?, 'Sikh', 'Punjabi', 'Punjabi,English', ?)`
    ).run(userId, name, gender, city, coords.lat, coords.lng, randomAvatarColor());

    const token = createSession(userId);
    response.status(201).json({ token, user: loadUser(userId) });
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      return response.status(409).json({ error: "An account with this email already exists." });
    }
    console.error(error);
    response.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", (request, response) => {
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const password = String(request.body?.password ?? "");
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND is_seed = 0").get(email);

  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return response.status(401).json({ error: "Invalid email or password." });
  }

  const token = createSession(user.id);
  response.json({ token, user: loadUser(user.id) });
});

app.post("/api/auth/demo", (_request, response) => {
  const email = "demo@vichola.app";
  let user = db.prepare("SELECT * FROM users WHERE email = ? AND is_seed = 0").get(email);

  if (!user) {
    const userInsert = db
      .prepare("INSERT INTO users (email, password_hash, is_seed) VALUES (?, ?, 0)")
      .run(email, hashPassword("VicholaDemo123"));
    const userId = Number(userInsert.lastInsertRowid);
    const coords = coordinatesForCity("San Jose, CA");

    db.prepare(
      `INSERT INTO profiles (
        user_id, name, gender, age, city, lat, lng, profession, education, about, looking_for,
        religion, community, practice, diet, family_pace, relocation, languages, interests,
        min_age, max_age, max_distance, preferred_cities, preferred_practice, preferred_family_pace, avatar_color
      ) VALUES (?, 'Navdeep Singh', 'Man', 30, 'San Jose, CA', ?, ?, 'Software engineer', 'Bachelor''s',
        'Sikh Punjabi, family oriented, and serious about building a peaceful marriage with shared values.',
        'Looking for a Sikh Punjabi partner who values Punjabi language, family respect, and honest communication.',
        'Sikh', 'Punjabi', 'Sehajdhari', 'Vegetarian-friendly', 'Balanced', 'Open to relocate',
        'Punjabi,English', 'Gurbani,Startups,Chaa walks,Bhangra', 25, 33, 1200,
        'San Jose, CA;Fresno, CA;Yuba City, CA;Vancouver, BC', 'Any Sikh practice', 'Balanced', '#16665b')`
    ).run(userId, coords.lat, coords.lng);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  }

  const token = createSession(user.id);
  response.json({ token, user: loadUser(user.id) });
});

app.post("/api/auth/logout", requireAuth, (request, response) => {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(request.token);
  response.json({ ok: true });
});

app.get("/api/me", requireAuth, (request, response) => {
  response.json({ user: loadUser(request.user.id) });
});

app.put("/api/me/profile", requireAuth, (request, response) => {
  const existing = loadProfile(request.user.id);
  const incoming = normalizeProfileInput(request.body ?? {}, existing);
  const coords = coordinatesForCity(incoming.city, incoming.lat, incoming.lng);

  db.prepare(
    `UPDATE profiles SET
      name = ?,
      gender = ?,
      age = ?,
      city = ?,
      lat = ?,
      lng = ?,
      profession = ?,
      education = ?,
      about = ?,
      looking_for = ?,
      practice = ?,
      diet = ?,
      family_pace = ?,
      relocation = ?,
      languages = ?,
      interests = ?,
      min_age = ?,
      max_age = ?,
      max_distance = ?,
      preferred_cities = ?,
      preferred_gender = ?,
      preferred_practice = ?,
      preferred_family_pace = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?`
  ).run(
    incoming.name,
    incoming.gender,
    incoming.age,
    incoming.city,
    coords.lat,
    coords.lng,
    incoming.profession,
    incoming.education,
    incoming.about,
    incoming.lookingFor,
    incoming.practice,
    incoming.diet,
    incoming.familyPace,
    incoming.relocation,
    incoming.languages,
    incoming.interests,
    incoming.minAge,
    incoming.maxAge,
    incoming.maxDistance,
    incoming.preferredCities,
    incoming.preferredGender,
    incoming.preferredPractice,
    incoming.preferredFamilyPace,
    request.user.id
  );

  response.json({ user: loadUser(request.user.id) });
});

app.post("/api/me/location", requireAuth, (request, response) => {
  const lat = Number(request.body?.lat);
  const lng = Number(request.body?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return response.status(400).json({ error: "Valid latitude and longitude are required." });
  }

  db.prepare("UPDATE profiles SET lat = ?, lng = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(
    lat,
    lng,
    request.user.id
  );
  response.json({ user: loadUser(request.user.id) });
});

app.post("/api/me/photos", requireAuth, upload.single("photo"), (request, response) => {
  if (!request.file) {
    return response.status(400).json({ error: "A photo file is required." });
  }

  const url = `/uploads/${request.file.filename}`;
  db.prepare("INSERT INTO photos (user_id, url) VALUES (?, ?)").run(request.user.id, url);
  response.status(201).json({ photos: loadPhotos(request.user.id) });
});

app.delete("/api/me/photos/:id", requireAuth, (request, response) => {
  db.prepare("DELETE FROM photos WHERE id = ? AND user_id = ?").run(Number(request.params.id), request.user.id);
  response.json({ photos: loadPhotos(request.user.id) });
});

app.get("/api/matches", requireAuth, (request, response) => {
  const me = loadProfile(request.user.id);
  const filters = {
    maxDistance: Number(request.query.maxDistance ?? me.maxDistance),
    city: String(request.query.city ?? ""),
    familyPace: String(request.query.familyPace ?? ""),
    practice: String(request.query.practice ?? ""),
  };

  const allProfiles = db
    .prepare(
      `SELECT users.id, users.is_seed, profiles.*
       FROM users
       JOIN profiles ON profiles.user_id = users.id
       WHERE users.id != ? AND profiles.religion = 'Sikh' AND profiles.community = 'Punjabi'`
    )
    .all(request.user.id);

  const matches = allProfiles
    .filter((profile) => genderCompatible(me, profile))
    .map((profile) => formatMatch(me, profile))
    .filter((match) => {
      const insideDistance =
        !Number.isFinite(filters.maxDistance) || match.distanceMiles <= filters.maxDistance;
      const cityMatch = !filters.city || filters.city === "Any city" || match.city === filters.city;
      const paceMatch =
        !filters.familyPace || filters.familyPace === "Any pace" || match.familyPace === filters.familyPace;
      const practiceMatch =
        !filters.practice || filters.practice === "Any practice" || match.practice === filters.practice;

      return insideDistance && cityMatch && paceMatch && practiceMatch;
    })
    .sort((first, second) => second.score - first.score);

  response.json({ matches });
});

app.post("/api/interests", requireAuth, (request, response) => {
  const toUserId = Number(request.body?.toUserId);

  if (!Number.isInteger(toUserId) || toUserId === request.user.id) {
    return response.status(400).json({ error: "Valid match id is required." });
  }

  db.prepare(
    `INSERT INTO interests (from_user_id, to_user_id, status)
     VALUES (?, ?, 'sent')
     ON CONFLICT(from_user_id, to_user_id) DO UPDATE SET status = 'sent'`
  ).run(request.user.id, toUserId);

  response.status(201).json({ ok: true });
});

app.get("/api/interests", requireAuth, (request, response) => {
  const interests = db
    .prepare(
      `SELECT interests.*, profiles.name, profiles.city
       FROM interests
       JOIN profiles ON profiles.user_id = interests.to_user_id
       WHERE interests.from_user_id = ?
       ORDER BY interests.created_at DESC`
    )
    .all(request.user.id);

  response.json({ interests });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Something went wrong." });
});

app.listen(port, () => {
  console.log(`Vichola API running at http://127.0.0.1:${port}`);
});

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function requireAuth(request, response, next) {
  const header = String(request.headers.authorization ?? "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = token
    ? db
        .prepare("SELECT sessions.token, users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token = ?")
        .get(token)
    : null;

  if (!session) {
    return response.status(401).json({ error: "Login required." });
  }

  request.user = session;
  request.token = token;
  next();
}

function seedDatabase() {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM users WHERE is_seed = 1").get();

  if (existing.count >= seededProfiles.length) {
    return;
  }

  for (const profile of seededProfiles) {
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(profile.email);
    if (existingUser) {
      continue;
    }

    const userInsert = db
      .prepare("INSERT INTO users (email, password_hash, is_seed) VALUES (?, NULL, 1)")
      .run(profile.email);
    const userId = Number(userInsert.lastInsertRowid);

    db.prepare(
      `INSERT INTO profiles (
        user_id, name, gender, age, city, lat, lng, profession, education, about, looking_for,
        religion, community, practice, diet, family_pace, relocation, languages, interests,
        min_age, max_age, max_distance, preferred_cities, preferred_practice, preferred_family_pace, avatar_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sikh', 'Punjabi', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      profile.name,
      profile.gender,
      profile.age,
      profile.city,
      profile.lat,
      profile.lng,
      profile.profession,
      profile.education,
      profile.about,
      profile.lookingFor,
      profile.practice,
      profile.diet,
      profile.familyPace,
      profile.relocation,
      profile.languages,
      profile.interests,
      profile.minAge,
      profile.maxAge,
      profile.maxDistance,
      profile.preferredCities,
      profile.preferredPractice,
      profile.preferredFamilyPace,
      profile.avatarColor
    );
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  return token;
}

function loadUser(userId) {
  const user = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(userId);
  return {
    ...user,
    profile: toProfile(loadProfile(userId)),
    photos: loadPhotos(userId),
  };
}

function loadProfile(userId) {
  return db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId);
}

function loadPhotos(userId) {
  return db.prepare("SELECT id, url, created_at FROM photos WHERE user_id = ? ORDER BY created_at DESC").all(userId);
}

function normalizeProfileInput(input, existing) {
  return {
    name: text(input.name, existing.name),
    gender: text(input.gender, existing.gender),
    age: clampInt(input.age, existing.age, 18, 80),
    city: text(input.city, existing.city),
    lat: nullableNumber(input.lat, existing.lat),
    lng: nullableNumber(input.lng, existing.lng),
    profession: text(input.profession, existing.profession),
    education: text(input.education, existing.education),
    about: text(input.about, existing.about),
    lookingFor: text(input.lookingFor, existing.looking_for),
    practice: text(input.practice, existing.practice),
    diet: text(input.diet, existing.diet),
    familyPace: text(input.familyPace, existing.family_pace),
    relocation: text(input.relocation, existing.relocation),
    languages: listText(input.languages, existing.languages),
    interests: listText(input.interests, existing.interests),
    minAge: clampInt(input.minAge, existing.min_age, 18, 80),
    maxAge: clampInt(input.maxAge, existing.max_age, 18, 80),
    maxDistance: clampInt(input.maxDistance, existing.max_distance, 10, 8000),
    preferredCities: listText(input.preferredCities, existing.preferred_cities, ";"),
    preferredGender: text(input.preferredGender, existing.preferred_gender),
    preferredPractice: text(input.preferredPractice, existing.preferred_practice),
    preferredFamilyPace: text(input.preferredFamilyPace, existing.preferred_family_pace),
  };
}

function toProfile(row) {
  return {
    userId: row.user_id,
    name: row.name,
    gender: row.gender,
    age: row.age,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    profession: row.profession,
    education: row.education,
    about: row.about,
    lookingFor: row.looking_for,
    religion: row.religion,
    community: row.community,
    practice: row.practice,
    diet: row.diet,
    familyPace: row.family_pace,
    relocation: row.relocation,
    languages: splitList(row.languages),
    interests: splitList(row.interests),
    minAge: row.min_age,
    maxAge: row.max_age,
    maxDistance: row.max_distance,
    preferredCities: splitList(row.preferred_cities, ";"),
    preferredGender: row.preferred_gender,
    preferredPractice: row.preferred_practice,
    preferredFamilyPace: row.preferred_family_pace,
    avatarColor: row.avatar_color,
  };
}

function formatMatch(me, candidate) {
  const score = scoreMatch(me, candidate);
  const distanceMiles = distanceBetween(me.lat, me.lng, candidate.lat, candidate.lng);
  const candidateProfile = toProfile(candidate);
  const photos = loadPhotos(candidate.user_id);
  return {
    id: candidate.user_id,
    ...candidateProfile,
    photos,
    score: score.total,
    breakdown: score.breakdown,
    distanceMiles,
    prompt: chaaPrompt(candidateProfile),
    nextStep: score.total >= 86 ? "Family chaa call" : score.total >= 74 ? "Private chat" : "Values check",
  };
}

function scoreMatch(me, candidate) {
  const breakdown = [];
  let score = 26;

  const inMyAgeRange = candidate.age >= me.min_age && candidate.age <= me.max_age;
  const inTheirAgeRange = me.age >= candidate.min_age && me.age <= candidate.max_age;
  add("Age range", inMyAgeRange && inTheirAgeRange ? 14 : inMyAgeRange ? 8 : 2);

  const distanceMiles = distanceBetween(me.lat, me.lng, candidate.lat, candidate.lng);
  if (distanceMiles <= Math.min(me.max_distance, candidate.max_distance)) {
    add("Nearby enough", 18);
  } else if (me.relocation === "Open to relocate" || candidate.relocation === "Open to relocate") {
    add("Relocation flexibility", 9);
  } else {
    add("Distance gap", 2);
  }

  const languageOverlap = overlap(splitList(me.languages), splitList(candidate.languages));
  add("Punjabi language comfort", languageOverlap.includes("Punjabi") ? 11 : languageOverlap.length > 0 ? 6 : 1);

  const practiceCompatible =
    practiceAllows(me.preferred_practice, candidate.practice) &&
    practiceAllows(candidate.preferred_practice, me.practice);
  add("Sikh practice fit", practiceCompatible ? 14 : 4);

  const paceCompatible =
    me.preferred_family_pace === "Balanced" ||
    candidate.preferred_family_pace === "Balanced" ||
    me.preferred_family_pace === candidate.family_pace ||
    candidate.preferred_family_pace === me.family_pace;
  add("Family pace", paceCompatible ? 12 : 4);

  const interestOverlap = overlap(splitList(me.interests), splitList(candidate.interests));
  add("Shared interests", Math.min(8, interestOverlap.length * 3));

  return {
    total: Math.max(40, Math.min(96, score)),
    breakdown,
  };

  function add(label, points) {
    score += points;
    breakdown.push({ label, points });
  }
}

function practiceAllows(preferredPractice, actualPractice) {
  return (
    preferredPractice === "Any Sikh practice" ||
    preferredPractice === actualPractice ||
    (preferredPractice === "Keshdhari or Amritdhari" &&
      ["Keshdhari", "Amritdhari"].includes(actualPractice))
  );
}

function genderCompatible(me, candidate) {
  return genderAllows(me.preferred_gender, me.gender, candidate.gender) && genderAllows(candidate.preferred_gender, candidate.gender, me.gender);
}

function genderAllows(preferredGender, ownGender, candidateGender) {
  if (preferredGender === "Any gender") {
    return true;
  }
  if (preferredGender && preferredGender !== "Opposite gender") {
    return preferredGender === candidateGender;
  }
  if (ownGender === "Man") {
    return candidateGender === "Woman";
  }
  if (ownGender === "Woman") {
    return candidateGender === "Man";
  }
  return true;
}

function chaaPrompt(profile) {
  const interest = profile.interests[0] ?? "Punjabi family traditions";
  return `You mentioned ${interest}. What made that part of your life important?`;
}

function distanceBetween(latA, lngA, latB, lngB) {
  if (![latA, lngA, latB, lngB].every(Number.isFinite)) {
    return 9999;
  }

  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function coordinatesForCity(city, fallbackLat, fallbackLng) {
  const coords = cityCoordinates[city];
  if (coords) {
    return { lat: coords[0], lng: coords[1] };
  }

  return {
    lat: Number.isFinite(Number(fallbackLat)) ? Number(fallbackLat) : null,
    lng: Number.isFinite(Number(fallbackLng)) ? Number(fallbackLng) : null,
  };
}

function splitList(value, separator = ",") {
  return String(value ?? "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function overlap(first, second) {
  const normalizedSecond = new Set(second.map((item) => item.toLowerCase()));
  return first.filter((item) => normalizedSecond.has(item.toLowerCase()));
}

function text(value, fallback = "") {
  const normalized = String(value ?? fallback ?? "").trim();
  return normalized;
}

function listText(value, fallback = "", separator = ",") {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(separator);
  }
  return text(value, fallback);
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function nullableNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function randomAvatarColor() {
  const colors = ["#16665b", "#be5269", "#d48618", "#6d7d3f", "#0d403a"];
  return colors[Math.floor(Math.random() * colors.length)];
}
