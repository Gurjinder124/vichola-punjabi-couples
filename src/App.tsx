import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Coffee,
  Compass,
  Edit3,
  Heart,
  HeartHandshake,
  Home,
  ImagePlus,
  Languages,
  Loader2,
  LocateFixed,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import heroImage from "./generated/heroImage";

type ApiPhoto = {
  id: number;
  url: string;
  created_at: string;
};

type Profile = {
  userId: number;
  name: string;
  gender: string;
  age: number;
  city: string;
  lat: number | null;
  lng: number | null;
  profession: string;
  education: string;
  about: string;
  lookingFor: string;
  religion: string;
  community: string;
  practice: string;
  diet: string;
  familyPace: string;
  relocation: string;
  languages: string[];
  interests: string[];
  minAge: number;
  maxAge: number;
  maxDistance: number;
  preferredCities: string[];
  preferredGender: string;
  preferredPractice: string;
  preferredFamilyPace: string;
  avatarColor: string;
};

type User = {
  id: number;
  email: string;
  created_at: string;
  profile: Profile;
  photos: ApiPhoto[];
};

type MatchProfile = Profile & {
  id: number;
  photos: ApiPhoto[];
  score: number;
  breakdown: { label: string; points: number }[];
  distanceMiles: number;
  prompt: string;
  nextStep: string;
};

type Options = {
  cities: string[];
  genders: string[];
  practices: string[];
  diets: string[];
  familyPaces: string[];
  relocations: string[];
  languages: string[];
};

type AuthMode = "login" | "signup";
type AppView = "discover" | "profile" | "photos" | "requirements" | "account";

const apiBase = "";

const defaultOptions: Options = {
  cities: [],
  genders: ["Woman", "Man"],
  practices: ["Any Sikh practice"],
  diets: ["No preference"],
  familyPaces: ["Balanced"],
  relocations: ["Maybe later"],
  languages: ["Punjabi", "English"],
};

const viewItems: { key: AppView; label: string; icon: LucideIcon }[] = [
  { key: "discover", label: "Matches", icon: HeartHandshake },
  { key: "profile", label: "Profile", icon: CircleUserRound },
  { key: "photos", label: "Photos", icon: Camera },
  { key: "requirements", label: "Needs", icon: SlidersHorizontal },
  { key: "account", label: "Account", icon: ShieldCheck },
];

const fallbackToken = localStorage.getItem("vichola_token") ?? "";

function App() {
  const [token, setToken] = useState(fallbackToken);
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [options, setOptions] = useState<Options>(defaultOptions);
  const [activeView, setActiveView] = useState<AppView>("discover");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [matchFilters, setMatchFilters] = useState({
    maxDistance: 1200,
    city: "Any city",
    familyPace: "Any pace",
    practice: "Any practice",
  });

  useEffect(() => {
    loadOptions().then(setOptions).catch(() => setOptions(defaultOptions));
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setMatches([]);
      setLoading(false);
      return;
    }

    localStorage.setItem("vichola_token", token);
    refreshMe(token);
  }, [token]);

  useEffect(() => {
    if (token && user) {
      refreshMatches();
    }
  }, [token, user?.profile.userId, matchFilters.maxDistance, matchFilters.city, matchFilters.familyPace, matchFilters.practice]);

  const selectedMatch = useMemo(() => {
    return matches.find((match) => match.id === selectedMatchId) ?? matches[0] ?? null;
  }, [matches, selectedMatchId]);

  useEffect(() => {
    if (selectedMatch && selectedMatchId === null) {
      setSelectedMatchId(selectedMatch.id);
    }
  }, [selectedMatch, selectedMatchId]);

  const refreshMe = async (authToken = token) => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ user: User }>("/api/me", { token: authToken });
      setUser(data.user);
      setMatchFilters((current) => ({
        ...current,
        maxDistance: data.user.profile.maxDistance || current.maxDistance,
      }));
    } catch (requestError) {
      localStorage.removeItem("vichola_token");
      setToken("");
      setError(messageFromError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const refreshMatches = async () => {
    if (!token) {
      return;
    }

    const params = new URLSearchParams({
      maxDistance: String(matchFilters.maxDistance),
      city: matchFilters.city,
      familyPace: matchFilters.familyPace,
      practice: matchFilters.practice,
    });

    const data = await api<{ matches: MatchProfile[] }>(`/api/matches?${params.toString()}`, { token });
    setMatches(data.matches);
    if (data.matches.length > 0 && !data.matches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(data.matches[0].id);
    }
  };

  const handleAuth = (nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    setActiveView("discover");
  };

  const handleLogout = async () => {
    if (token) {
      await api("/api/auth/logout", { method: "POST", token }).catch(() => null);
    }
    localStorage.removeItem("vichola_token");
    setToken("");
    setUser(null);
    setMatches([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }

    setStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await api<{ user: User }>("/api/me/location", {
            method: "POST",
            token,
            body: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          setUser(data.user);
          setStatus("Location saved for better nearby matches.");
        } catch (requestError) {
          setError(messageFromError(requestError));
        }
      },
      () => {
        setError("Location permission was not granted.");
        setStatus("");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!token || !user) {
    return (
      <AuthScreen
        loading={loading}
        error={error}
        options={options}
        onAuthenticated={handleAuth}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onChange={setActiveView} user={user} onLogout={handleLogout} />

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">Sikh Punjabi matchmaking</p>
            <h1>{headlineFor(activeView)}</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" title="Use current location" onClick={useCurrentLocation}>
              <LocateFixed size={19} />
            </button>
            <button type="button" className="icon-button" title="Notifications">
              <Bell size={19} />
            </button>
            <button type="button" className="primary-action" onClick={() => setActiveView("profile")}>
              <Edit3 size={18} />
              Manage profile
            </button>
          </div>
        </header>

        {(status || error) && (
          <div className={error ? "toast error" : "toast"}>
            {error || status}
          </div>
        )}

        <section className="stat-band" aria-label="Account summary">
          <Stat icon={BadgeCheck} label="Profile" value={`${profileStrength(user.profile, user.photos)}%`} detail="ready" />
          <Stat icon={MapPin} label="Distance" value={`${matchFilters.maxDistance} mi`} detail="active radius" />
          <Stat icon={Heart} label="Matches" value={String(matches.length)} detail="database results" />
          <Stat icon={ShieldCheck} label="Community" value="Sikh" detail="Punjabi only" />
        </section>

        {activeView === "discover" && (
          <DiscoverView
            options={options}
            filters={matchFilters}
            setFilters={setMatchFilters}
            matches={matches}
            selectedMatch={selectedMatch}
            onSelect={setSelectedMatchId}
            token={token}
            setStatus={setStatus}
            setError={setError}
          />
        )}

        {activeView === "profile" && (
          <ProfileView
            user={user}
            options={options}
            token={token}
            setUser={setUser}
            setStatus={setStatus}
            setError={setError}
          />
        )}

        {activeView === "photos" && (
          <PhotosView
            user={user}
            token={token}
            setUser={setUser}
            setStatus={setStatus}
            setError={setError}
          />
        )}

        {activeView === "requirements" && (
          <RequirementsView
            user={user}
            options={options}
            token={token}
            setUser={setUser}
            setStatus={setStatus}
            setError={setError}
          />
        )}

        {activeView === "account" && (
          <AccountView user={user} onLogout={handleLogout} useCurrentLocation={useCurrentLocation} />
        )}
      </main>

      <MobileNav activeView={activeView} onChange={setActiveView} />
    </div>
  );
}

function AuthScreen({
  loading,
  error,
  options,
  onAuthenticated,
}: {
  loading: boolean;
  error: string;
  options: Options;
  onAuthenticated: (token: string, user: User) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    gender: "Man",
    city: "San Jose, CA",
    sikhPunjabiAgreement: true,
  });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setLocalError("");

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const data = await api<{ token: string; user: User }>(endpoint, {
        method: "POST",
        body: mode === "signup" ? form : { email: form.email, password: form.password },
      });
      onAuthenticated(data.token, data.user);
    } catch (requestError) {
      setLocalError(messageFromError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setBusy(true);
    setLocalError("");
    try {
      const data = await api<{ token: string; user: User }>("/api/auth/demo", { method: "POST" });
      onAuthenticated(data.token, data.user);
    } catch (requestError) {
      setLocalError(messageFromError(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-visual" aria-label="Vichola">
        <img src={heroImage} alt="" />
        <div className="auth-brand">
          <div className="brand-mark">V</div>
          <div>
            <p>Vichola</p>
            <span>Sikh Punjabi rishta app</span>
          </div>
        </div>
        <div className="auth-badges">
          <span>
            <ShieldCheck size={16} />
            Verified profiles
          </span>
          <span>
            <Compass size={16} />
            Location match
          </span>
          <span>
            <UsersRound size={16} />
            Family ready
          </span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Only Sikh Punjabi matches</p>
          <h1>{mode === "signup" ? "Create your Vichola account" : "Welcome back"}</h1>

          <div className="segmented-control" role="tablist" aria-label="Authentication">
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
              <UserRoundPlus size={17} />
              Signup
            </button>
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              <Lock size={17} />
              Login
            </button>
          </div>

          {(localError || error) && <div className="form-error">{localError || error}</div>}

          <form onSubmit={submit} className="auth-form">
            {mode === "signup" && (
              <>
                <TextInput label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
                <div className="form-grid two">
                  <SelectInput
                    label="Gender"
                    value={form.gender}
                    options={options.genders}
                    onChange={(gender) => setForm({ ...form, gender })}
                  />
                  <SelectInput
                    label="City"
                    value={form.city}
                    options={options.cities.length ? options.cities : ["San Jose, CA"]}
                    onChange={(city) => setForm({ ...form, city })}
                  />
                </div>
              </>
            )}

            <TextInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
            />
            <TextInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
            />

            {mode === "signup" && (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.sikhPunjabiAgreement}
                  onChange={(event) => setForm({ ...form, sikhPunjabiAgreement: event.target.checked })}
                />
                <span>I am joining for Sikh Punjabi matchmaking.</span>
              </label>
            )}

            <button type="submit" className="primary-action wide" disabled={busy || loading}>
              {busy && <Loader2 size={17} className="spin" />}
              {mode === "signup" ? "Create account" : "Login"}
            </button>
          </form>

          <button type="button" className="ghost-action wide" onClick={demo} disabled={busy}>
            <Sparkles size={17} />
            Demo account
          </button>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activeView,
  onChange,
  user,
  onLogout,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
  user: User;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark">V</div>
        <div>
          <p>Vichola</p>
          <span>Punjabi rishta desk</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Primary">
        {viewItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={activeView === item.key ? "active" : ""}
              onClick={() => onChange(item.key)}
              title={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="profile-mini">
        <Avatar profile={user.profile} photo={user.photos[0]} />
        <div>
          <strong>{user.profile.name || "Your profile"}</strong>
          <span>{user.profile.city || "Set city"}</span>
        </div>
      </div>

      <button type="button" className="ghost-action" onClick={onLogout}>
        <LogOut size={17} />
        Logout
      </button>
    </aside>
  );
}

function MobileNav({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile primary">
      {viewItems.slice(0, 5).map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            className={activeView === item.key ? "active" : ""}
            onClick={() => onChange(item.key)}
            title={item.label}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function DiscoverView({
  options,
  filters,
  setFilters,
  matches,
  selectedMatch,
  onSelect,
  token,
  setStatus,
  setError,
}: {
  options: Options;
  filters: { maxDistance: number; city: string; familyPace: string; practice: string };
  setFilters: (filters: { maxDistance: number; city: string; familyPace: string; practice: string }) => void;
  matches: MatchProfile[];
  selectedMatch: MatchProfile | null;
  onSelect: (id: number) => void;
  token: string;
  setStatus: (status: string) => void;
  setError: (error: string) => void;
}) {
  const sendInterest = async (toUserId: number) => {
    setError("");
    try {
      await api("/api/interests", { method: "POST", token, body: { toUserId } });
      setStatus("Interest sent. Keep it respectful and warm.");
    } catch (requestError) {
      setError(messageFromError(requestError));
    }
  };

  return (
    <section className="discover-grid">
      <aside className="filter-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Find better</p>
            <h2>Match filters</h2>
          </div>
          <Search size={19} />
        </div>

        <label className="range-control">
          <span>
            <MapPin size={17} />
            Distance radius
          </span>
          <strong>{filters.maxDistance} mi</strong>
          <input
            type="range"
            min="25"
            max="8000"
            step="25"
            value={filters.maxDistance}
            onChange={(event) => setFilters({ ...filters, maxDistance: Number(event.target.value) })}
          />
        </label>

        <SelectInput
          label="City"
          value={filters.city}
          options={["Any city", ...options.cities]}
          onChange={(city) => setFilters({ ...filters, city })}
        />
        <SelectInput
          label="Family pace"
          value={filters.familyPace}
          options={["Any pace", ...options.familyPaces]}
          onChange={(familyPace) => setFilters({ ...filters, familyPace })}
        />
        <SelectInput
          label="Sikh practice"
          value={filters.practice}
          options={["Any practice", ...options.practices.filter((item) => item !== "Any Sikh practice")]}
          onChange={(practice) => setFilters({ ...filters, practice })}
        />

        <div className="trust-list">
          <TrustItem icon={ShieldCheck} text="Sikh Punjabi profiles only" />
          <TrustItem icon={Languages} text="Punjabi language weighted" />
          <TrustItem icon={Home} text="Family pace included" />
        </div>
      </aside>

      <section className="match-column">
        <div className="panel-title">
          <div>
            <p className="eyebrow">{matches.length} results</p>
            <h2>Best matches</h2>
          </div>
          <HeartHandshake size={20} />
        </div>

        <div className="match-list">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              className={selectedMatch?.id === match.id ? "match-card active" : "match-card"}
              onClick={() => onSelect(match.id)}
            >
              <Avatar profile={match} photo={match.photos[0]} />
              <div className="match-summary">
                <div>
                  <h3>{match.name}</h3>
                  <p>
                    {match.age} · {match.profession || "Profile updating"}
                  </p>
                </div>
                <span>
                  <MapPin size={14} />
                  {match.city} · {match.distanceMiles} mi
                </span>
                <div className="chip-row">
                  {[match.practice, match.familyPace, match.languages[0]].filter(Boolean).slice(0, 3).map((chip) => (
                    <small key={chip}>{chip}</small>
                  ))}
                </div>
              </div>
              <div className="score-badge">
                <strong>{match.score}</strong>
                <span>fit</span>
              </div>
            </button>
          ))}

          {matches.length === 0 && (
            <div className="empty-state">
              <HeartHandshake size={28} />
              <h3>No matches under these filters</h3>
              <p>Increase the distance radius or choose any city.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="detail-panel">
        {selectedMatch ? (
          <>
            <div className="profile-hero">
              <Avatar profile={selectedMatch} photo={selectedMatch.photos[0]} large />
              <div>
                <p className="eyebrow">Selected rishta</p>
                <h2>{selectedMatch.name}</h2>
                <span>{selectedMatch.city}</span>
              </div>
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(var(--teal) 0 ${selectedMatch.score}%, #e8efeb ${selectedMatch.score}% 100%)`,
                }}
              >
                <strong>{selectedMatch.score}</strong>
                <span>%</span>
              </div>
            </div>

            <div className="quick-actions">
              <button type="button" className="primary-action" onClick={() => sendInterest(selectedMatch.id)}>
                <Heart size={17} />
                Interest
              </button>
              <button type="button" className="ghost-action">
                <MessageCircle size={17} />
                Chat
              </button>
              <button type="button" className="ghost-action">
                <Phone size={17} />
                Vichola call
              </button>
            </div>

            <section className="detail-section">
              <h3>About</h3>
              <p>{selectedMatch.about || "Bio coming soon."}</p>
            </section>

            <section className="detail-section">
              <h3>Looking for</h3>
              <p>{selectedMatch.lookingFor || "Requirements coming soon."}</p>
            </section>

            <section className="detail-section">
              <h3>Chaa opener</h3>
              <div className="prompt-box">
                <Coffee size={18} />
                <p>{selectedMatch.prompt}</p>
              </div>
            </section>

            <section className="detail-section">
              <h3>Score breakdown</h3>
              <div className="breakdown-list">
                {selectedMatch.breakdown.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>+{item.points}</strong>
                  </div>
                ))}
              </div>
            </section>

            <button type="button" className="wide-link">
              {selectedMatch.nextStep}
              <ChevronRight size={18} />
            </button>
          </>
        ) : (
          <div className="empty-state">
            <HeartHandshake size={28} />
            <h3>Build your match list</h3>
            <p>Complete your profile and requirements to start matching.</p>
          </div>
        )}
      </aside>
    </section>
  );
}

function ProfileView({
  user,
  options,
  token,
  setUser,
  setStatus,
  setError,
}: {
  user: User;
  options: Options;
  token: string;
  setUser: (user: User) => void;
  setStatus: (status: string) => void;
  setError: (error: string) => void;
}) {
  const [form, setForm] = useState(profileToForm(user.profile));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profileToForm(user.profile));
  }, [user.profile.userId]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = await api<{ user: User }>("/api/me/profile", {
        method: "PUT",
        token,
        body: form,
      });
      setUser(data.user);
      setStatus("Profile saved.");
    } catch (requestError) {
      setError(messageFromError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-view" onSubmit={save}>
      <div className="panel-title">
        <div>
          <p className="eyebrow">Public profile</p>
          <h2>Your biodata</h2>
        </div>
        <CircleUserRound size={21} />
      </div>

      <div className="form-grid two">
        <TextInput label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <SelectInput label="Gender" value={form.gender} options={options.genders} onChange={(gender) => setForm({ ...form, gender })} />
        <TextInput label="Age" type="number" value={String(form.age)} onChange={(age) => setForm({ ...form, age: Number(age) })} />
        <SelectInput label="City" value={form.city} options={options.cities} onChange={(city) => setForm({ ...form, city })} />
        <TextInput label="Profession" value={form.profession} onChange={(profession) => setForm({ ...form, profession })} />
        <TextInput label="Education" value={form.education} onChange={(education) => setForm({ ...form, education })} />
        <SelectInput label="Sikh practice" value={form.practice} options={options.practices} onChange={(practice) => setForm({ ...form, practice })} />
        <SelectInput label="Diet" value={form.diet} options={options.diets} onChange={(diet) => setForm({ ...form, diet })} />
        <SelectInput label="Family pace" value={form.familyPace} options={options.familyPaces} onChange={(familyPace) => setForm({ ...form, familyPace })} />
        <SelectInput label="Relocation" value={form.relocation} options={options.relocations} onChange={(relocation) => setForm({ ...form, relocation })} />
      </div>

      <TextInput label="Languages" value={form.languages} onChange={(languages) => setForm({ ...form, languages })} />
      <TextInput label="Interests" value={form.interests} onChange={(interests) => setForm({ ...form, interests })} />
      <TextArea label="Bio" value={form.about} onChange={(about) => setForm({ ...form, about })} />
      <TextArea label="Marriage expectations" value={form.lookingFor} onChange={(lookingFor) => setForm({ ...form, lookingFor })} />

      <button type="submit" className="primary-action wide" disabled={saving}>
        {saving && <Loader2 size={17} className="spin" />}
        Save profile
      </button>
    </form>
  );
}

function PhotosView({
  user,
  token,
  setUser,
  setStatus,
  setError,
}: {
  user: User;
  token: string;
  setUser: (user: User) => void;
  setStatus: (status: string) => void;
  setError: (error: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("photo", file);

    try {
      const data = await api<{ photos: ApiPhoto[] }>("/api/me/photos", {
        method: "POST",
        token,
        formData: body,
      });
      setUser({ ...user, photos: data.photos });
      setStatus("Photo uploaded.");
    } catch (requestError) {
      setError(messageFromError(requestError));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (id: number) => {
    try {
      const data = await api<{ photos: ApiPhoto[] }>(`/api/me/photos/${id}`, { method: "DELETE", token });
      setUser({ ...user, photos: data.photos });
      setStatus("Photo removed.");
    } catch (requestError) {
      setError(messageFromError(requestError));
    }
  };

  return (
    <section className="form-view">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Photo gallery</p>
          <h2>Profile pictures</h2>
        </div>
        <ImagePlus size={21} />
      </div>

      <label className="upload-zone">
        <input type="file" accept="image/*" onChange={(event) => uploadPhoto(event.target.files?.[0] ?? null)} />
        {uploading ? <Loader2 size={24} className="spin" /> : <Upload size={24} />}
        <span>Upload picture</span>
      </label>

      <div className="photo-grid">
        {user.photos.map((photo) => (
          <article key={photo.id} className="photo-card">
            <img src={photo.url} alt="" />
            <button type="button" className="icon-button danger" title="Delete photo" onClick={() => removePhoto(photo.id)}>
              <Trash2 size={18} />
            </button>
          </article>
        ))}
        {user.photos.length === 0 && (
          <div className="empty-state">
            <Camera size={28} />
            <h3>No photos yet</h3>
            <p>Add clear, recent pictures for better matches.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function RequirementsView({
  user,
  options,
  token,
  setUser,
  setStatus,
  setError,
}: {
  user: User;
  options: Options;
  token: string;
  setUser: (user: User) => void;
  setStatus: (status: string) => void;
  setError: (error: string) => void;
}) {
  const [form, setForm] = useState(profileToForm(user.profile));
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = await api<{ user: User }>("/api/me/profile", {
        method: "PUT",
        token,
        body: form,
      });
      setUser(data.user);
      setStatus("Requirements saved.");
    } catch (requestError) {
      setError(messageFromError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-view" onSubmit={save}>
      <div className="panel-title">
        <div>
          <p className="eyebrow">Partner requirements</p>
          <h2>Match settings</h2>
        </div>
        <SlidersHorizontal size={21} />
      </div>

      <div className="form-grid three">
        <TextInput label="Min age" type="number" value={String(form.minAge)} onChange={(minAge) => setForm({ ...form, minAge: Number(minAge) })} />
        <TextInput label="Max age" type="number" value={String(form.maxAge)} onChange={(maxAge) => setForm({ ...form, maxAge: Number(maxAge) })} />
        <TextInput label="Max distance" type="number" value={String(form.maxDistance)} onChange={(maxDistance) => setForm({ ...form, maxDistance: Number(maxDistance) })} />
      </div>

      <TextInput label="Preferred cities" value={form.preferredCities} onChange={(preferredCities) => setForm({ ...form, preferredCities })} />

      <div className="form-grid two">
        <SelectInput
          label="Preferred gender"
          value={form.preferredGender}
          options={["Opposite gender", "Woman", "Man", "Any gender"]}
          onChange={(preferredGender) => setForm({ ...form, preferredGender })}
        />
        <SelectInput
          label="Preferred Sikh practice"
          value={form.preferredPractice}
          options={options.practices}
          onChange={(preferredPractice) => setForm({ ...form, preferredPractice })}
        />
        <SelectInput
          label="Preferred family pace"
          value={form.preferredFamilyPace}
          options={options.familyPaces}
          onChange={(preferredFamilyPace) => setForm({ ...form, preferredFamilyPace })}
        />
      </div>

      <div className="value-note">
        <ShieldCheck size={18} />
        <p>Vichola does not ask for caste. Matching focuses on Sikh Punjabi values, family readiness, location, and lifestyle fit.</p>
      </div>

      <button type="submit" className="primary-action wide" disabled={saving}>
        {saving && <Loader2 size={17} className="spin" />}
        Save requirements
      </button>
    </form>
  );
}

function AccountView({
  user,
  onLogout,
  useCurrentLocation,
}: {
  user: User;
  onLogout: () => void;
  useCurrentLocation: () => void;
}) {
  return (
    <section className="account-grid">
      <article className="account-card">
        <Avatar profile={user.profile} photo={user.photos[0]} large />
        <div>
          <p className="eyebrow">Signed in</p>
          <h2>{user.email}</h2>
          <span>{user.profile.name}</span>
        </div>
      </article>

      <article className="settings-card">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Account</p>
            <h2>Controls</h2>
          </div>
          <Lock size={21} />
        </div>
        <button type="button" className="ghost-action wide" onClick={useCurrentLocation}>
          <LocateFixed size={17} />
          Update location
        </button>
        <button type="button" className="ghost-action wide" onClick={onLogout}>
          <LogOut size={17} />
          Logout
        </button>
      </article>

      <article className="settings-card">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Safety</p>
            <h2>Profile guardrails</h2>
          </div>
          <ShieldCheck size={21} />
        </div>
        <div className="trust-list compact">
          <TrustItem icon={Check} text="Sikh Punjabi community focus" />
          <TrustItem icon={Lock} text="Local session tokens" />
          <TrustItem icon={BadgeCheck} text="Profile completeness scoring" />
        </div>
      </article>
    </section>
  );
}

function Stat({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function Avatar({ profile, photo, large = false }: { profile: Profile; photo?: ApiPhoto; large?: boolean }) {
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className={large ? "avatar large" : "avatar"} style={{ background: profile.avatarColor }}>
      {photo ? <img src={photo.url} alt="" /> : <span>{initials || "V"}</span>}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrustItem({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="trust-item">
      <Icon size={17} />
      <span>{text}</span>
    </div>
  );
}

async function loadOptions() {
  return api<Options>("/api/options");
}

async function api<T = unknown>(
  path: string,
  config: {
    method?: string;
    token?: string;
    body?: unknown;
    formData?: FormData;
  } = {}
): Promise<T> {
  if (import.meta.env.PROD) {
    return localApi<T>(path, config);
  }

  const headers = new Headers();
  if (config.token) {
    headers.set("Authorization", `Bearer ${config.token}`);
  }
  if (!config.formData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBase}${path}`, {
    method: config.method ?? "GET",
    headers,
    body: config.formData ?? (config.body ? JSON.stringify(config.body) : undefined),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed.");
  }

  return data as T;
}

type ApiConfig = {
  method?: string;
  token?: string;
  body?: unknown;
  formData?: FormData;
};

type LocalUser = User & {
  password?: string;
};

const localOptions: Options = {
  cities: [
    "Fresno, CA",
    "San Jose, CA",
    "Sacramento, CA",
    "Yuba City, CA",
    "New York, NY",
    "Brampton, ON",
    "Vancouver, BC",
    "Surrey, BC",
    "Calgary, AB",
    "London, UK",
    "Ludhiana, Punjab",
    "Amritsar, Punjab",
    "Jalandhar, Punjab",
    "Patiala, Punjab",
  ],
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
};

const localCityCoordinates: Record<string, [number, number]> = {
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

const localMatchProfiles: Profile[] = [
  makeLocalProfile({
    userId: 201,
    name: "Gurleen Kaur",
    gender: "Woman",
    age: 29,
    city: "Vancouver, BC",
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
    interests: ["Kirtan", "Chaa walks", "Design", "Travel"],
    avatarColor: "#0f766e",
  }),
  makeLocalProfile({
    userId: 202,
    name: "Mehar Kaur",
    gender: "Woman",
    age: 28,
    city: "Brampton, ON",
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
    interests: ["Fitness", "Live music", "Langar", "Books"],
    avatarColor: "#d9436f",
  }),
  makeLocalProfile({
    userId: 203,
    name: "Simran Kaur",
    gender: "Woman",
    age: 27,
    city: "Yuba City, CA",
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
    interests: ["Seva", "Teaching", "Family nights", "Poetry"],
    avatarColor: "#2d6cdf",
  }),
];

async function localApi<T = unknown>(path: string, config: ApiConfig = {}): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  if (path === "/api/options") {
    return localOptions as T;
  }

  if (path === "/api/auth/demo") {
    const users = getLocalUsers();
    let demoUser = users.find((user) => user.email === "demo@vichola.app");
    if (!demoUser) {
      demoUser = makeLocalUser({
        id: 101,
        email: "demo@vichola.app",
        profile: makeLocalProfile({
          userId: 101,
          name: "Navdeep Singh",
          gender: "Man",
          age: 30,
          city: "San Jose, CA",
          profession: "Software engineer",
          education: "Bachelor's",
          about:
            "Sikh Punjabi, family oriented, and serious about building a peaceful marriage with shared values.",
          lookingFor:
            "Looking for a Sikh Punjabi partner who values Punjabi language, family respect, and honest communication.",
          practice: "Sehajdhari",
          diet: "Vegetarian-friendly",
          familyPace: "Balanced",
          relocation: "Open to relocate",
          interests: ["Gurbani", "Startups", "Chaa walks", "Bhangra"],
          avatarColor: "#0f766e",
        }),
      });
      saveLocalUsers([...users, demoUser]);
    }
    return { token: localToken(demoUser.id), user: publicLocalUser(demoUser) } as T;
  }

  if (path === "/api/auth/signup") {
    const body = config.body as Partial<{
      name: string;
      email: string;
      password: string;
      gender: string;
      city: string;
      sikhPunjabiAgreement: boolean;
    }>;
    if (!body.name || !body.email || !body.password || !body.gender || !body.city) {
      throw new Error("Name, email, password, gender, and city are required.");
    }
    if (!body.sikhPunjabiAgreement) {
      throw new Error("Vichola is currently for Sikh Punjabi matchmaking only.");
    }
    const users = getLocalUsers();
    const email = body.email.toLowerCase();
    if (users.some((user) => user.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const user = makeLocalUser({
      id: Date.now(),
      email,
      password: body.password,
      profile: makeLocalProfile({
        userId: Date.now(),
        name: body.name,
        gender: body.gender,
        city: body.city,
      }),
    });
    user.profile.userId = user.id;
    saveLocalUsers([...users, user]);
    return { token: localToken(user.id), user: publicLocalUser(user) } as T;
  }

  if (path === "/api/auth/login") {
    const body = config.body as Partial<{ email: string; password: string }>;
    const user = getLocalUsers().find(
      (candidate) => candidate.email === body.email?.toLowerCase() && candidate.password === body.password
    );
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    return { token: localToken(user.id), user: publicLocalUser(user) } as T;
  }

  if (path === "/api/auth/logout") {
    return { ok: true } as T;
  }

  const user = getLocalUserFromToken(config.token);
  if (!user) {
    throw new Error("Login required.");
  }

  if (path === "/api/me") {
    return { user: publicLocalUser(user) } as T;
  }

  if (path === "/api/me/profile") {
    const nextProfile = normalizeLocalProfile(config.body as Partial<ReturnType<typeof profileToForm>>, user.profile);
    return { user: updateLocalUser(user.id, { ...user, profile: nextProfile }) } as T;
  }

  if (path === "/api/me/location") {
    const body = config.body as Partial<{ lat: number; lng: number }>;
    const nextUser = updateLocalUser(user.id, {
      ...user,
      profile: {
        ...user.profile,
        lat: Number(body.lat),
        lng: Number(body.lng),
      },
    });
    return { user: nextUser } as T;
  }

  if (path === "/api/me/photos") {
    const file = config.formData?.get("photo");
    if (!(file instanceof File)) {
      throw new Error("A photo file is required.");
    }
    const url = await readFileAsDataUrl(file);
    const nextPhotos = [{ id: Date.now(), url, created_at: new Date().toISOString() }, ...user.photos];
    return { photos: updateLocalUser(user.id, { ...user, photos: nextPhotos }).photos } as T;
  }

  if (path.startsWith("/api/me/photos/")) {
    const photoId = Number(path.split("/").pop());
    const nextPhotos = user.photos.filter((photo) => photo.id !== photoId);
    return { photos: updateLocalUser(user.id, { ...user, photos: nextPhotos }).photos } as T;
  }

  if (path.startsWith("/api/matches")) {
    const url = new URL(path, window.location.origin);
    const maxDistance = Number(url.searchParams.get("maxDistance") ?? user.profile.maxDistance);
    const city = url.searchParams.get("city") ?? "Any city";
    const familyPace = url.searchParams.get("familyPace") ?? "Any pace";
    const practice = url.searchParams.get("practice") ?? "Any practice";
    const matches = localMatchProfiles
      .filter((profile) => localGenderCompatible(user.profile, profile))
      .map((profile) => localMatch(user.profile, profile))
      .filter((match) => match.distanceMiles <= maxDistance)
      .filter((match) => city === "Any city" || match.city === city)
      .filter((match) => familyPace === "Any pace" || match.familyPace === familyPace)
      .filter((match) => practice === "Any practice" || match.practice === practice)
      .sort((first, second) => second.score - first.score);
    return { matches } as T;
  }

  if (path === "/api/interests") {
    return { ok: true, interests: [] } as T;
  }

  throw new Error("This hosted demo action is not available yet.");
}

function makeLocalUser(input: { id: number; email: string; password?: string; profile: Profile }): LocalUser {
  return {
    id: input.id,
    email: input.email,
    password: input.password,
    created_at: new Date().toISOString(),
    profile: input.profile,
    photos: [],
  };
}

function makeLocalProfile(input: Partial<Profile> & Pick<Profile, "userId" | "name" | "gender" | "city">): Profile {
  const coords = localCityCoordinates[input.city] ?? [null, null];
  return {
    userId: input.userId,
    name: input.name,
    gender: input.gender,
    age: input.age ?? 28,
    city: input.city,
    lat: input.lat ?? coords[0],
    lng: input.lng ?? coords[1],
    profession: input.profession ?? "",
    education: input.education ?? "",
    about: input.about ?? "",
    lookingFor: input.lookingFor ?? "",
    religion: "Sikh",
    community: "Punjabi",
    practice: input.practice ?? "Any Sikh practice",
    diet: input.diet ?? "No preference",
    familyPace: input.familyPace ?? "Balanced",
    relocation: input.relocation ?? "Maybe later",
    languages: input.languages ?? ["Punjabi", "English"],
    interests: input.interests ?? [],
    minAge: input.minAge ?? 24,
    maxAge: input.maxAge ?? 38,
    maxDistance: input.maxDistance ?? 8000,
    preferredCities: input.preferredCities ?? ["San Jose, CA", "Fresno, CA", "Vancouver, BC"],
    preferredGender: input.preferredGender ?? "Opposite gender",
    preferredPractice: input.preferredPractice ?? "Any Sikh practice",
    preferredFamilyPace: input.preferredFamilyPace ?? "Balanced",
    avatarColor: input.avatarColor ?? "#0f766e",
  };
}

function getLocalUsers(): LocalUser[] {
  return JSON.parse(localStorage.getItem("vichola_local_users") ?? "[]") as LocalUser[];
}

function saveLocalUsers(users: LocalUser[]) {
  localStorage.setItem("vichola_local_users", JSON.stringify(users));
}

function localToken(userId: number) {
  return `local-${userId}`;
}

function getLocalUserFromToken(token = "") {
  const userId = Number(token.replace("local-", ""));
  return getLocalUsers().find((user) => user.id === userId);
}

function publicLocalUser(user: LocalUser): User {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

function updateLocalUser(userId: number, nextUser: LocalUser): User {
  const users = getLocalUsers();
  const updated = users.map((user) => (user.id === userId ? nextUser : user));
  saveLocalUsers(updated);
  return publicLocalUser(nextUser);
}

function normalizeLocalProfile(input: Partial<ReturnType<typeof profileToForm>>, current: Profile): Profile {
  const coords = localCityCoordinates[input.city ?? current.city] ?? [current.lat, current.lng];
  return {
    ...current,
    name: String(input.name ?? current.name),
    gender: String(input.gender ?? current.gender),
    age: Number(input.age ?? current.age),
    city: String(input.city ?? current.city),
    lat: coords[0],
    lng: coords[1],
    profession: String(input.profession ?? current.profession),
    education: String(input.education ?? current.education),
    about: String(input.about ?? current.about),
    lookingFor: String(input.lookingFor ?? current.lookingFor),
    practice: String(input.practice ?? current.practice),
    diet: String(input.diet ?? current.diet),
    familyPace: String(input.familyPace ?? current.familyPace),
    relocation: String(input.relocation ?? current.relocation),
    languages: splitLocalList(input.languages ?? current.languages.join(", ")),
    interests: splitLocalList(input.interests ?? current.interests.join(", ")),
    minAge: Number(input.minAge ?? current.minAge),
    maxAge: Number(input.maxAge ?? current.maxAge),
    maxDistance: Number(input.maxDistance ?? current.maxDistance),
    preferredCities: splitLocalList(input.preferredCities ?? current.preferredCities.join("; "), ";"),
    preferredGender: String(input.preferredGender ?? current.preferredGender),
    preferredPractice: String(input.preferredPractice ?? current.preferredPractice),
    preferredFamilyPace: String(input.preferredFamilyPace ?? current.preferredFamilyPace),
  };
}

function splitLocalList(value: string, separator = ",") {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function localMatch(me: Profile, profile: Profile): MatchProfile {
  const distanceMiles = localDistance(me.lat, me.lng, profile.lat, profile.lng);
  const closeEnough = distanceMiles <= me.maxDistance;
  const ageFit = profile.age >= me.minAge && profile.age <= me.maxAge;
  const paceFit = me.preferredFamilyPace === "Balanced" || me.preferredFamilyPace === profile.familyPace;
  const practiceFit =
    me.preferredPractice === "Any Sikh practice" ||
    me.preferredPractice === profile.practice ||
    (me.preferredPractice === "Keshdhari or Amritdhari" && ["Keshdhari", "Amritdhari"].includes(profile.practice));
  const score = Math.min(
    96,
    50 + (closeEnough ? 16 : 7) + (ageFit ? 12 : 4) + (paceFit ? 10 : 4) + (practiceFit ? 12 : 5)
  );
  return {
    ...profile,
    id: profile.userId,
    photos: [],
    score,
    distanceMiles,
    breakdown: [
      { label: "Nearby enough", points: closeEnough ? 16 : 7 },
      { label: "Age range", points: ageFit ? 12 : 4 },
      { label: "Family pace", points: paceFit ? 10 : 4 },
      { label: "Sikh practice fit", points: practiceFit ? 12 : 5 },
    ],
    prompt: `You mentioned ${profile.interests[0] ?? "Punjabi family values"}. What made that important to you?`,
    nextStep: score >= 86 ? "Family chaa call" : "Private chat",
  };
}

function localGenderCompatible(me: Profile, profile: Profile) {
  if (me.preferredGender === "Any gender") {
    return true;
  }
  if (me.preferredGender !== "Opposite gender") {
    return profile.gender === me.preferredGender;
  }
  return me.gender === "Man" ? profile.gender === "Woman" : profile.gender === "Man";
}

function localDistance(latA: number | null, lngA: number | null, latB: number | null, lngB: number | null) {
  if ([latA, lngA, latB, lngB].some((value) => typeof value !== "number")) {
    return 9999;
  }
  const radius = 3958.8;
  const dLat = localRadians((latB as number) - (latA as number));
  const dLng = localRadians((lngB as number) - (lngA as number));
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(localRadians(latA as number)) *
      Math.cos(localRadians(latB as number)) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function localRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read photo."));
    reader.readAsDataURL(file);
  });
}

function profileToForm(profile: Profile) {
  return {
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    city: profile.city,
    profession: profile.profession,
    education: profile.education,
    about: profile.about,
    lookingFor: profile.lookingFor,
    practice: profile.practice,
    diet: profile.diet,
    familyPace: profile.familyPace,
    relocation: profile.relocation,
    languages: profile.languages.join(", "),
    interests: profile.interests.join(", "),
    minAge: profile.minAge,
    maxAge: profile.maxAge,
    maxDistance: profile.maxDistance,
    preferredCities: profile.preferredCities.join("; "),
    preferredGender: profile.preferredGender,
    preferredPractice: profile.preferredPractice,
    preferredFamilyPace: profile.preferredFamilyPace,
  };
}

function profileStrength(profile: Profile, photos: ApiPhoto[]) {
  const fields = [
    profile.name,
    profile.age,
    profile.city,
    profile.profession,
    profile.education,
    profile.about,
    profile.lookingFor,
    profile.practice,
    profile.languages.length,
    profile.interests.length,
    photos.length,
  ];
  const complete = fields.filter(Boolean).length;
  return Math.round((complete / fields.length) * 100);
}

function headlineFor(view: AppView) {
  const labels: Record<AppView, string> = {
    discover: "Find a serious match",
    profile: "Manage your profile",
    photos: "Upload your pictures",
    requirements: "Set your requirements",
    account: "Manage account",
  };
  return labels[view];
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default App;
