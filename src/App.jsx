import { useState, useEffect, useCallback } from "react";

// ── Storage helpers ──────────────────────────────────────────────
const KEYS = {
  users: "rr_users",
  bahan: "rr_bahan",
  stok: "rr_stok",
  produksi: "rr_produksi",
  waste: "rr_waste",
  belanja: "rr_belanja",
  resep: "rr_resep",
  currentUser: "rr_currentUser",
};

async function load(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

async function save(key, val) {
  try {
    await window.storage.set(key, JSON.stringify(val), true);
  } catch (e) {
    console.error("Save error", e);
  }
}

// ── Seed data ────────────────────────────────────────────────────
const SEED_BAHAN = [
  { id: "b1", nama: "Ayam (kg)", satuan: "kg", minStok: 5 },
  { id: "b2", nama: "Bawang merah (kg)", satuan: "kg", minStok: 2 },
  { id: "b3", nama: "Bawang putih (kg)", satuan: "kg", minStok: 1 },
  { id: "b4", nama: "Santan (liter)", satuan: "liter", minStok: 3 },
  { id: "b5", nama: "Kemiri (kg)", satuan: "kg", minStok: 0.5 },
  { id: "b6", nama: "Lengkuas (kg)", satuan: "kg", minStok: 0.3 },
  { id: "b7", nama: "Serai (batang)", satuan: "batang", minStok: 10 },
  { id: "b8", nama: "Daun salam (lembar)", satuan: "lembar", minStok: 20 },
  { id: "b9", nama: "Garam (kg)", satuan: "kg", minStok: 1 },
  { id: "b10", nama: "Gula merah (kg)", satuan: "kg", minStok: 0.5 },
];

const SEED_STOK = {
  b1: 8, b2: 3, b3: 0.5, b4: 5, b5: 0.8,
  b6: 0.2, b7: 15, b8: 30, b9: 2, b10: 0.3,
};

const SEED_RESEP = [
  {
    id: "r1", nama: "Rendang Ayam", porsi: 10,
    bahan: [
      { bahanId: "b1", jumlah: 2 },
      { bahanId: "b2", jumlah: 0.3 },
      { bahanId: "b3", jumlah: 0.1 },
      { bahanId: "b4", jumlah: 1 },
      { bahanId: "b5", jumlah: 0.05 },
    ],
    catatan: "Masak api kecil 3-4 jam hingga kering."
  },
  {
    id: "r2", nama: "Opor Ayam", porsi: 10,
    bahan: [
      { bahanId: "b1", jumlah: 1.5 },
      { bahanId: "b2", jumlah: 0.2 },
      { bahanId: "b4", jumlah: 1.5 },
      { bahanId: "b7", jumlah: 3 },
      { bahanId: "b8", jumlah: 5 },
    ],
    catatan: "Santan jangan sampai pecah, api sedang."
  },
];

// ── Design tokens ─────────────────────────────────────────────────
const C = {
  bg: "#F7F3ED",
  card: "#FFFFFF",
  nav: "#2C1810",
  navText: "#F7F3ED",
  primary: "#8B4513",
  primaryLight: "#A0522D",
  accent: "#C4821A",
  accentLight: "#F5C842",
  green: "#2D6A4F",
  greenLight: "#E8F5E9",
  red: "#C0392B",
  redLight: "#FDEDEB",
  border: "#E2D5C3",
  muted: "#9E8B76",
  text: "#2C1810",
};

// ── Tiny UI helpers ───────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{
    background: color === "red" ? C.redLight : color === "green" ? C.greenLight : "#FEF9EC",
    color: color === "red" ? C.red : color === "green" ? C.green : C.accent,
    border: `1px solid ${color === "red" ? "#F5B7B1" : color === "green" ? "#A9DFBF" : "#F9E79F"}`,
    borderRadius: 999, fontSize: 11, fontWeight: 700,
    padding: "2px 8px", display: "inline-block",
  }}>{children}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.card, borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: 16, marginBottom: 12, ...style
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }) => {
  const styles = {
    primary: { background: C.primary, color: "#fff" },
    secondary: { background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}` },
    danger: { background: C.red, color: "#fff" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], borderRadius: 8, padding: "9px 16px",
      fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      border: styles[variant].border || "none", opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, style = {} }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: `1.5px solid ${C.border}`, fontSize: 14,
        background: C.bg, color: C.text, boxSizing: "border-box", ...style
      }}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "9px 12px", borderRadius: 8,
      border: `1.5px solid ${C.border}`, fontSize: 14,
      background: C.bg, color: C.text,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: `1.5px solid ${C.border}`, fontSize: 14,
        background: C.bg, color: C.text, boxSizing: "border-box", resize: "vertical"
      }}
    />
  </div>
);

const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// ══════════════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const PRESETS = ["Kevin", "Staff 1", "Staff 2"];
  return (
    <div style={{
      minHeight: "100vh", background: C.nav,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍛</div>
        <div style={{ color: C.accentLight, fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>RAYA RASA</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Manajemen Dapur & Produksi</div>
      </div>
      <div style={{ background: C.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.text }}>Siapa yang masuk?</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setName(p)} style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: `1.5px solid ${name === p ? C.primary : C.border}`,
              background: name === p ? C.primary : "transparent",
              color: name === p ? "#fff" : C.text, fontWeight: 600,
            }}>{p}</button>
          ))}
        </div>
        <Input label="Atau ketik nama" value={name} onChange={setName} placeholder="Nama kamu..." />
        <Btn onClick={() => name.trim() && onLogin(name.trim())} style={{ width: "100%" }} disabled={!name.trim()}>
          Masuk ke Dapur
        </Btn>
      </div>
    </div>
  );
}

function HomeScreen({ user, stok, bahan, produksi, waste, belanja, setTab }) {
  const stokRendah = bahan.filter(b => (stok[b.id] ?? 0) < b.minStok);
  const todayProduksi = produksi.filter(p => p.tanggal === today());
  const todayWaste = waste.filter(w => w.tanggal === today());
  const todayBelanja = belanja.filter(b => b.tanggal === today());

  const missions = [
    { label: "Input produksi hari ini", done: todayProduksi.length > 0, tab: "produksi" },
    { label: "Update stok harian", done: Object.keys(stok).length > 0, tab: "stok" },
    { label: "Cek bahan masuk & nota", done: todayBelanja.length > 0, tab: "belanja" },
  ];
  const doneMissions = missions.filter(m => m.done).length;

  return (
    <div>
      <div style={{ background: C.nav, padding: "20px 16px 24px", marginBottom: -12 }}>
        <div style={{ color: C.accentLight, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Selamat datang</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 2 }}>{user} 👋</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{fmtDate(today())}</div>
      </div>

      <div style={{ padding: "16px 12px" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Misi harian — {doneMissions}/{missions.length}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{Math.round(doneMissions / missions.length * 100)}%</div>
          </div>
          <div style={{ height: 4, background: C.border, borderRadius: 99, marginBottom: 14 }}>
            <div style={{ height: "100%", background: C.accent, borderRadius: 99, width: `${doneMissions / missions.length * 100}%`, transition: "width 0.4s" }} />
          </div>
          {missions.map((m, i) => (
            <div key={i} onClick={() => setTab(m.tab)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none",
              cursor: "pointer",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${m.done ? C.green : C.border}`,
                background: m.done ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {m.done && <span style={{ color: "#fff", fontSize: 11 }}>v</span>}
              </div>
              <span style={{ fontSize: 13, color: m.done ? C.muted : C.text, textDecoration: m.done ? "line-through" : "none", flex: 1 }}>{m.label}</span>
              <span style={{ color: C.muted, fontSize: 14 }}>›</span>
            </div>
          ))}
        </Card>

        {stokRendah.length > 0 && (
          <div onClick={() => setTab("stok")} style={{
            background: C.redLight, border: `1px solid #F5B7B1`, borderRadius: 12,
            padding: "12px 16px", marginBottom: 12, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: C.red, fontWeight: 700, fontSize: 13 }}>
              {stokRendah.length} bahan stok rendah — perlu segera dibeli
            </span>
            <span style={{ color: C.red, fontSize: 13 }}>Lihat →</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { icon: "📦", label: "Update Stok", tab: "stok", color: "#EBF5FB" },
            { icon: "🍳", label: "Input Produksi", tab: "produksi", color: "#EAFAF1" },
            { icon: "🛒", label: "Nota Belanja", tab: "belanja", color: "#FEF9EC" },
            { icon: "🗑️", label: "Catat Waste", tab: "waste", color: "#FDEDEB" },
          ].map(a => (
            <div key={a.tab} onClick={() => setTab(a.tab)} style={{
              background: a.color, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: "16px 12px", textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{a.label}</div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Ringkasan Hari Ini</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Produksi", val: todayProduksi.length, unit: "item" },
              { label: "Waste", val: todayWaste.length, unit: "catat" },
              { label: "Belanja", val: todayBelanja.reduce((s, b) => s + (b.total || 0), 0), unit: "total", isCurrency: true },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "10px 4px", background: C.bg, borderRadius: 10 }}>
                <div style={{ fontSize: s.isCurrency ? 11 : 18, fontWeight: 800, color: C.primary }}>
                  {s.isCurrency ? `Rp${(s.val / 1000).toFixed(0)}rb` : s.val}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StokScreen({ bahan, setBahan, stok, setStok, user }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newBahan, setNewBahan] = useState({ nama: "", satuan: "kg", minStok: 1 });

  const filtered = bahan.filter(b => b.nama.toLowerCase().includes(search.toLowerCase()));

  const updateStok = async (id, val) => {
    const newStok = { ...stok, [id]: parseFloat(val) || 0 };
    setStok(newStok);
    setEditId(null);
  };

  const addBahan = async () => {
    if (!newBahan.nama.trim()) return;
    const id = "b" + Date.now();
    const updated = [...bahan, { id, ...newBahan }];
    setBahan(updated);
    setNewBahan({ nama: "", satuan: "kg", minStok: 1 });
    setShowAdd(false);
  };

  return (
    <div style={{ padding: "12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📦 Stok Bahan</h2>
        <Btn onClick={() => setShowAdd(!showAdd)} variant="secondary" style={{ fontSize: 12, padding: "6px 12px" }}>+ Tambah</Btn>
      </div>

      {showAdd && (
        <Card style={{ background: "#FEF9EC", border: `1px solid ${C.accentLight}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Bahan Baru</div>
          <Input label="Nama bahan" value={newBahan.nama} onChange={v => setNewBahan({ ...newBahan, nama: v })} placeholder="cth: Kunyit (kg)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Satuan" value={newBahan.satuan} onChange={v => setNewBahan({ ...newBahan, satuan: v })} />
            <Input label="Stok minimum" type="number" value={newBahan.minStok} onChange={v => setNewBahan({ ...newBahan, minStok: parseFloat(v) })} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={addBahan}>Simpan</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Batal</Btn>
          </div>
        </Card>
      )}

      <Input placeholder="Cari bahan..." value={search} onChange={setSearch} />

      <div style={{ marginBottom: 8 }}>
        <Badge color="red">{bahan.filter(b => (stok[b.id] ?? 0) < b.minStok).length} stok rendah</Badge>
        {" "}
        <Badge color="green">{bahan.filter(b => (stok[b.id] ?? 0) >= b.minStok).length} aman</Badge>
      </div>

      {filtered.map(b => {
        const s = stok[b.id] ?? 0;
        const rendah = s < b.minStok;
        return (
          <div key={b.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", background: C.card, borderRadius: 10,
            border: `1px solid ${rendah ? "#F5B7B1" : C.border}`, marginBottom: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{b.nama}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Min: {b.minStok} {b.satuan}</div>
            </div>
            {editId === b.id ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                  style={{ width: 60, padding: "5px 8px", borderRadius: 6, border: `1.5px solid ${C.accent}`, fontSize: 13 }}
                  autoFocus onKeyDown={e => e.key === "Enter" && updateStok(b.id, editVal)}
                />
                <span style={{ fontSize: 11, color: C.muted }}>{b.satuan}</span>
                <Btn onClick={() => updateStok(b.id, editVal)} style={{ padding: "5px 10px", fontSize: 12 }}>OK</Btn>
                <Btn variant="ghost" onClick={() => setEditId(null)} style={{ padding: "5px 10px", fontSize: 12 }}>X</Btn>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div onClick={() => { setEditId(b.id); setEditVal(s); }} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: rendah ? C.red : C.green }}>{s}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{b.satuan}</div>
                </div>
                <Badge color={rendah ? "red" : "green"}>{rendah ? "!" : "OK"}</Badge>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProduksiScreen({ produksi, setProduksi, bahan, resep, user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resepId: "", namaCustom: "", jumlahPorsi: "", catatan: "", waktu: nowTime() });
  const [filter, setFilter] = useState("today");

  const filtered = produksi.filter(p => filter === "today" ? p.tanggal === today() : true).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const submit = async () => {
    if (!form.namaCustom && !form.resepId) return;
    const resepObj = resep.find(r => r.id === form.resepId);
    const entry = {
      id: "p" + Date.now(), tanggal: today(), waktu: form.waktu,
      nama: form.namaCustom || resepObj?.nama || "",
      jumlahPorsi: parseFloat(form.jumlahPorsi) || 0,
      catatan: form.catatan, user,
    };
    const updated = [entry, ...produksi];
    setProduksi(updated);
    setForm({ resepId: "", namaCustom: "", jumlahPorsi: "", catatan: "", waktu: nowTime() });
    setShowForm(false);
  };

  return (
    <div style={{ padding: "12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🍳 Produksi</h2>
        <Btn onClick={() => setShowForm(!showForm)} style={{ fontSize: 12, padding: "6px 12px" }}>+ Input</Btn>
      </div>

      {showForm && (
        <Card style={{ background: "#EAFAF1", border: `1px solid #A9DFBF` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Input Produksi</div>
          <Select label="Dari resep (opsional)" value={form.resepId}
            onChange={v => setForm({ ...form, resepId: v, namaCustom: v ? "" : form.namaCustom })}
            options={[{ value: "", label: "Pilih resep..." }, ...resep.map(r => ({ value: r.id, label: r.nama }))]}
          />
          {!form.resepId && (
            <Input label="Nama masakan" value={form.namaCustom} onChange={v => setForm({ ...form, namaCustom: v })} placeholder="cth: Nasi Uduk Special" />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Jumlah porsi" type="number" value={form.jumlahPorsi} onChange={v => setForm({ ...form, jumlahPorsi: v })} />
            <Input label="Waktu" value={form.waktu} onChange={v => setForm({ ...form, waktu: v })} />
          </div>
          <Textarea label="Catatan" value={form.catatan} onChange={v => setForm({ ...form, catatan: v })} placeholder="Catatan tambahan..." />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={submit}>Simpan</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Batal</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["today", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${filter === f ? C.primary : C.border}`,
            background: filter === f ? C.primary : "transparent",
            color: filter === f ? "#fff" : C.text, cursor: "pointer",
          }}>{f === "today" ? "Hari Ini" : "Semua"}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>
          Belum ada produksi {filter === "today" ? "hari ini" : ""}.<br />Tap + Input untuk mulai catat.
        </div>
      )}

      {filtered.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.nama}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fmtDate(p.tanggal)} · {p.waktu} · oleh {p.user}</div>
              {p.catatan && <div style={{ fontSize: 12, color: C.text, marginTop: 6, fontStyle: "italic" }}>{p.catatan}</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: C.primary }}>{p.jumlahPorsi}</div>
              <div style={{ fontSize: 10, color: C.muted }}>porsi</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WasteScreen({ waste, setWaste, bahan, user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bahanId: "", jumlah: "", alasan: "Gosong", catatan: "" });

  const submit = async () => {
    if (!form.bahanId || !form.jumlah) return;
    const b = bahan.find(x => x.id === form.bahanId);
    const entry = {
      id: "w" + Date.now(), tanggal: today(), waktu: nowTime(),
      bahanId: form.bahanId, namaBahan: b?.nama || "", satuan: b?.satuan || "",
      jumlah: parseFloat(form.jumlah), alasan: form.alasan,
      catatan: form.catatan, user,
    };
    const updated = [entry, ...waste];
    setWaste(updated);
    setForm({ bahanId: "", jumlah: "", alasan: "Gosong", catatan: "" });
    setShowForm(false);
  };

  const todayWaste = waste.filter(w => w.tanggal === today());
  const oldWaste = waste.filter(w => w.tanggal !== today()).slice(0, 20);

  return (
    <div style={{ padding: "12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🗑️ Waste</h2>
        <Btn onClick={() => setShowForm(!showForm)} style={{ fontSize: 12, padding: "6px 12px" }}>+ Catat</Btn>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
        Untuk waste mendadak (jatuh, gosong). Busuk/expired dicatat saat closing stok.
      </div>

      {showForm && (
        <Card style={{ background: C.redLight, border: `1px solid #F5B7B1` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Catat Waste</div>
          <Select label="Bahan" value={form.bahanId} onChange={v => setForm({ ...form, bahanId: v })}
            options={[{ value: "", label: "Pilih bahan..." }, ...bahan.map(b => ({ value: b.id, label: b.nama }))]}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Jumlah" type="number" value={form.jumlah} onChange={v => setForm({ ...form, jumlah: v })} />
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>SATUAN</div>
              <div style={{ fontSize: 14, color: C.muted, padding: "9px 0" }}>
                {bahan.find(b => b.id === form.bahanId)?.satuan || "-"}
              </div>
            </div>
          </div>
          <Select label="Alasan" value={form.alasan} onChange={v => setForm({ ...form, alasan: v })}
            options={["Gosong", "Jatuh/Tumpah", "Expired", "Salah ukur", "Lainnya"].map(a => ({ value: a, label: a }))}
          />
          <Textarea label="Catatan" value={form.catatan} onChange={v => setForm({ ...form, catatan: v })} placeholder="Detail tambahan..." />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="danger" onClick={submit}>Simpan Waste</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Batal</Btn>
          </div>
        </Card>
      )}

      {todayWaste.length > 0 && (
        <div style={{ fontWeight: 700, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Hari Ini</div>
      )}
      {todayWaste.map(w => (
        <Card key={w.id} style={{ borderLeft: `3px solid ${C.red}` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{w.namaBahan}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{w.alasan} · {w.waktu} · {w.user}</div>
              {w.catatan && <div style={{ fontSize: 12, fontStyle: "italic", marginTop: 4 }}>{w.catatan}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, color: C.red, fontSize: 16 }}>{w.jumlah}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{w.satuan}</div>
            </div>
          </div>
        </Card>
      ))}

      {oldWaste.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 12 }}>Riwayat</div>
          {oldWaste.map(w => (
            <Card key={w.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{w.namaBahan}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{fmtDate(w.tanggal)} · {w.alasan} · {w.user}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: C.red }}>{w.jumlah} {w.satuan}</div>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {waste.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Tidak ada waste tercatat. Bagus!</div>
      )}
    </div>
  );
}

function BelanjaScreen({ belanja, setBelanja, user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier: "", items: [{ nama: "", jumlah: "", satuan: "", harga: "" }], catatan: "" });

  const addItem = () => setForm({ ...form, items: [...form.items, { nama: "", jumlah: "", satuan: "", harga: "" }] });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const total = form.items.reduce((s, it) => s + ((parseFloat(it.jumlah) || 0) * (parseFloat(it.harga) || 0)), 0);

  const submit = async () => {
    const validItems = form.items.filter(it => it.nama.trim());
    if (validItems.length === 0) return;
    const entry = {
      id: "bl" + Date.now(), tanggal: today(), waktu: nowTime(),
      supplier: form.supplier, items: validItems,
      total: validItems.reduce((s, it) => s + ((parseFloat(it.jumlah) || 0) * (parseFloat(it.harga) || 0)), 0),
      catatan: form.catatan, user,
    };
    const updated = [entry, ...belanja];
    setBelanja(updated);
    setForm({ supplier: "", items: [{ nama: "", jumlah: "", satuan: "", harga: "" }], catatan: "" });
    setShowForm(false);
  };

  const fmtRp = (n) => "Rp" + Number(n).toLocaleString("id-ID");

  return (
    <div style={{ padding: "12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🛒 Nota Belanja</h2>
        <Btn onClick={() => setShowForm(!showForm)} style={{ fontSize: 12, padding: "6px 12px" }}>+ Input</Btn>
      </div>

      {showForm && (
        <Card style={{ background: "#FEF9EC", border: `1px solid ${C.accentLight}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Nota Belanja Baru</div>
          <Input label="Supplier / Toko" value={form.supplier} onChange={v => setForm({ ...form, supplier: v })} placeholder="cth: Pasar Senen, Supplier X" />
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Item Belanja</div>
          {form.items.map((it, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 8, padding: "10px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Item {i + 1}</span>
                {form.items.length > 1 && (
                  <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14 }}>Hapus</button>
                )}
              </div>
              <Input value={it.nama} onChange={v => updateItem(i, "nama", v)} placeholder="Nama bahan" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <Input value={it.jumlah} onChange={v => updateItem(i, "jumlah", v)} placeholder="Qty" type="number" />
                <Input value={it.satuan} onChange={v => updateItem(i, "satuan", v)} placeholder="Satuan" />
                <Input value={it.harga} onChange={v => updateItem(i, "harga", v)} placeholder="Harga" type="number" />
              </div>
              {it.jumlah && it.harga && (
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, textAlign: "right" }}>
                  = {fmtRp((parseFloat(it.jumlah) || 0) * (parseFloat(it.harga) || 0))}
                </div>
              )}
            </div>
          ))}
          <Btn variant="ghost" onClick={addItem} style={{ width: "100%", marginBottom: 12, fontSize: 12 }}>+ Tambah Item</Btn>
          <div style={{ background: C.primary, color: "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 12, textAlign: "right" }}>
            <span style={{ fontSize: 12 }}>Total: </span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{fmtRp(total)}</span>
          </div>
          <Textarea label="Catatan" value={form.catatan} onChange={v => setForm({ ...form, catatan: v })} placeholder="Catatan tambahan..." />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={submit}>Simpan Nota</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Batal</Btn>
          </div>
        </Card>
      )}

      {belanja.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Belum ada nota belanja.</div>
      )}

      {belanja.map(b => (
        <Card key={b.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{b.supplier || "Tanpa supplier"}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{fmtDate(b.tanggal)} · {b.waktu} · {b.user}</div>
            </div>
            <div style={{ fontWeight: 800, color: C.primary, fontSize: 15 }}>{fmtRp(b.total)}</div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
            {b.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: C.text }}>
                <span>{it.nama} ({it.jumlah} {it.satuan})</span>
                <span style={{ color: C.muted }}>{it.harga ? fmtRp((parseFloat(it.jumlah) || 0) * (parseFloat(it.harga) || 0)) : ""}</span>
              </div>
            ))}
          </div>
          {b.catatan && <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontStyle: "italic" }}>{b.catatan}</div>}
        </Card>
      ))}
    </div>
  );
}

function LaporanScreen({ produksi, waste, belanja, bahan, stok }) {
  const [range, setRange] = useState(7);

  const since = new Date();
  since.setDate(since.getDate() - range);
  const sinceStr = since.toISOString().split("T")[0];

  const pInRange = produksi.filter(p => p.tanggal >= sinceStr);
  const wInRange = waste.filter(w => w.tanggal >= sinceStr);
  const bInRange = belanja.filter(b => b.tanggal >= sinceStr);

  const totalPorsi = pInRange.reduce((s, p) => s + (p.jumlahPorsi || 0), 0);
  const totalBelanja = bInRange.reduce((s, b) => s + (b.total || 0), 0);
  const stokRendah = bahan.filter(b => (stok[b.id] ?? 0) < b.minStok);

  const fmtRp = (n) => "Rp" + Number(n).toLocaleString("id-ID");

  const byNama = {};
  pInRange.forEach(p => { byNama[p.nama] = (byNama[p.nama] || 0) + (p.jumlahPorsi || 0); });

  const byAlasan = {};
  wInRange.forEach(w => { byAlasan[w.alasan] = (byAlasan[w.alasan] || 0) + 1; });

  return (
    <div style={{ padding: "12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📊 Laporan</h2>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setRange(d)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${range === d ? C.primary : C.border}`,
            background: range === d ? C.primary : "transparent",
            color: range === d ? "#fff" : C.text, cursor: "pointer",
          }}>{d} hari</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Total Porsi Diproduksi", val: totalPorsi, unit: "porsi", color: C.green },
          { label: "Total Pengeluaran", val: fmtRp(totalBelanja), unit: `${bInRange.length} nota`, color: C.primary },
          { label: "Waste Tercatat", val: wInRange.length, unit: "kejadian", color: C.red },
          { label: "Stok Rendah", val: stokRendah.length, unit: "bahan", color: stokRendah.length > 0 ? C.red : C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 12px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {Object.keys(byNama).length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Produksi Terbanyak</div>
          {Object.entries(byNama).sort((a, b) => b[1] - a[1]).map(([nama, porsi]) => (
            <div key={nama} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
              <span>{nama}</span>
              <span style={{ fontWeight: 700, color: C.primary }}>{porsi} porsi</span>
            </div>
          ))}
        </Card>
      )}

      {Object.keys(byAlasan).length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Waste per Alasan</div>
          {Object.entries(byAlasan).map(([alasan, n]) => (
            <div key={alasan} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
              <span>{alasan}</span>
              <Badge color="red">{n}x</Badge>
            </div>
          ))}
        </Card>
      )}

      {stokRendah.length > 0 && (
        <Card style={{ borderLeft: `3px solid ${C.red}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: C.red }}>Stok Perlu Dibeli</div>
          {stokRendah.map(b => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
              <span>{b.nama}</span>
              <span style={{ color: C.red, fontWeight: 600 }}>Ada: {stok[b.id] ?? 0} / min {b.minStok} {b.satuan}</span>
            </div>
          ))}
        </Card>
      )}

      {pInRange.length === 0 && wInRange.length === 0 && bInRange.length === 0 && (
        <div style={{ textBox: "center", padding: 40, color: C.muted, fontSize: 13 }}>
          Belum ada data untuk {range} hari terakhir.
        </div>
      )}
    </div>
  );
}

function ResepScreen({ resep, setResep, bahan }) {
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ nama: "", porsi: 1, catatan: "", bahan: [{ bahanId: "", jumlah: "" }] });

  const addBahanResep = () => setForm({ ...form, bahan: [...form.bahan, { bahanId: "", jumlah: "" }] });
  const updateBahanResep = (i, field, val) => {
    const b = [...form.bahan];
    b[i] = { ...b[i], [field]: val };
    setForm({ ...form, bahan: b });
  };
  const removeBahanResep = (i) => setForm({ ...form, bahan: form.bahan.filter((_, idx) => idx !== i) });

  const submit = async () => {
    if (!form.nama.trim()) return;
    const entry = {
      id: "r" + Date.now(), nama: form.nama, porsi: parseFloat(form.porsi) || 1,
      catatan: form.catatan,
      bahan: form.bahan.filter(b => b.bahanId && b.jumlah).map(b => ({ bahanId: b.bahanId, jumlah: parseFloat(b.jumlah) })),
    };
    const updated = [...resep, entry];
    setResep(updated);
    setForm({ nama: "", porsi: 1, catatan: "", bahan: [{ bahanId: "", jumlah: "" }] });
    setShowForm(false);
  };

  const deleteResep = async (id) => {
    const updated = resep.filter(r => r.id !== id);
    setResep(updated);
    setDetail(null);
  };

  if (detail) {
    return (
      <div style={{ padding: "12px 12px" }}>
        <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12, padding: 0 }}>Kembali</button>
        <Card>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 4 }}>{detail.nama}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Untuk {detail.porsi} porsi</div>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Bahan-bahan</div>
          {detail.bahan.map((b, i) => {
            const bahanObj = bahan.find(x => x.id === b.bahanId);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
                <span>{bahanObj?.nama || b.bahanId}</span>
                <span style={{ fontWeight: 600, color: C.primary }}>{b.jumlah} {bahanObj?.satuan || ""}</span>
              </div>
            );
          })}
          {detail.catatan && (
            <div style={{ marginTop: 16, padding: 12, background: C.bg, borderRadius: 8, fontSize: 13, color: C.text, fontStyle: "italic" }}>
              {detail.catatan}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Btn variant="danger" onClick={() => deleteResep(detail.id)} style={{ fontSize: 12, padding: "6px 14px" }}>Hapus Resep</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📖 Resep</h2>
        <Btn onClick={() => setShowForm(!showForm)} style={{ fontSize: 12, padding: "6px 12px" }}>+ Tambah</Btn>
      </div>

      {showForm && (
        <Card style={{ background: "#EBF5FB", border: `1px solid #AED6F1` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Resep Baru</div>
          <Input label="Nama masakan" value={form.nama} onChange={v => setForm({ ...form, nama: v })} placeholder="cth: Gulai Ayam" />
          <Input label="Untuk berapa porsi" type="number" value={form.porsi} onChange={v => setForm({ ...form, porsi: v })} />
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Bahan</div>
          {form.bahan.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
              <div style={{ flex: 2 }}>
                <Select value={b.bahanId} onChange={v => updateBahanResep(i, "bahanId", v)}
                  options={[{ value: "", label: "Pilih bahan..." }, ...bahan.map(x => ({ value: x.id, label: x.nama }))]}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input value={b.jumlah} onChange={v => updateBahanResep(i, "jumlah", v)} placeholder="Qty" type="number" />
              </div>
              {form.bahan.length > 1 && (
                <button onClick={() => removeBahanResep(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 13, marginBottom: 12, whiteSpace: "nowrap" }}>Hapus</button>
              )}
            </div>
          ))}
          <Btn variant="ghost" onClick={addBahanResep} style={{ marginBottom: 10, fontSize: 12, width: "100%" }}>+ Tambah Bahan</Btn>
          <Textarea label="Catatan / Cara masak" value={form.catatan} onChange={v => setForm({ ...form, catatan: v })} placeholder="Instruksi memasak..." />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={submit}>Simpan Resep</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Batal</Btn>
          </div>
        </Card>
      )}

      {resep.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Belum ada resep. Tap + Tambah untuk mulai.</div>
      )}

      {resep.map(r => (
        <div key={r.id} onClick={() => setDetail(r)} style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: "14px 16px", marginBottom: 10, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.nama}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {r.bahan.length} bahan · {r.porsi} porsi
            </div>
          </div>
          <span style={{ color: C.muted, fontSize: 16 }}>›</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════
const TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "stok", label: "Stok", icon: "📦" },
  { id: "produksi", label: "Produksi", icon: "🍳" },
  { id: "waste", label: "Waste", icon: "🗑️" },
  { id: "belanja", label: "Belanja", icon: "🛒" },
  { id: "laporan", label: "Laporan", icon: "📊" },
  { id: "resep", label: "Resep", icon: "📖" },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");

  const [bahan, setBahanState] = useState([]);
  const [stok, setStokState] = useState({});
  const [produksi, setProduksiState] = useState([]);
  const [waste, setWasteState] = useState([]);
  const [belanja, setBelanjaState] = useState([]);
  const [resep, setResepState] = useState([]);

  const setBahan = useCallback(async (v) => { setBahanState(v); await save(KEYS.bahan, v); }, []);
  const setStok = useCallback(async (v) => { setStokState(v); await save(KEYS.stok, v); }, []);
  const setProduksi = useCallback(async (v) => { setProduksiState(v); await save(KEYS.produksi, v); }, []);
  const setWaste = useCallback(async (v) => { setWasteState(v); await save(KEYS.waste, v); }, []);
  const setBelanja = useCallback(async (v) => { setBelanjaState(v); await save(KEYS.belanja, v); }, []);
  const setResep = useCallback(async (v) => { setResepState(v); await save(KEYS.resep, v); }, []);

  useEffect(() => {
    async function init() {
      const [savedUser, savedBahan, savedStok, savedProd, savedWaste, savedBelanja, savedResep] = await Promise.all([
        load(KEYS.currentUser), load(KEYS.bahan), load(KEYS.stok),
        load(KEYS.produksi), load(KEYS.waste), load(KEYS.belanja), load(KEYS.resep),
      ]);
      setUser(savedUser);
      setBahanState(savedBahan || SEED_BAHAN);
      setStokState(savedStok || SEED_STOK);
      setProduksiState(savedProd || []);
      setWasteState(savedWaste || []);
      setBelanjaState(savedBelanja || []);
      setResepState(savedResep || SEED_RESEP);
      if (!savedBahan) await save(KEYS.bahan, SEED_BAHAN);
      if (!savedStok) await save(KEYS.stok, SEED_STOK);
      if (!savedResep) await save(KEYS.resep, SEED_RESEP);
      setLoading(false);
    }
    init();
  }, []);

  const handleLogin = async (name) => {
    setUser(name);
    await save(KEYS.currentUser, name);
  };

  const handleLogout = async () => {
    setUser(null);
    await save(KEYS.currentUser, null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.nav, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍛</div>
        <div style={{ color: C.accentLight, fontSize: 16, fontWeight: 700 }}>Memuat Raya Rasa...</div>
      </div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const screenProps = { user, bahan, setBahan, stok, setStok, produksi, setProduksi, waste, setWaste, belanja, setBelanja, resep, setResep };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ background: C.nav, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ color: C.accentLight, fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>🍛 RAYA RASA</div>
          <div style={{ color: C.muted, fontSize: 11 }}>{user} · {fmtDate(today())}</div>
        </div>
        <button onClick={handleLogout} style={{
          background: "transparent", border: `1px solid ${C.muted}`, color: C.muted,
          borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer"
        }}>Ganti User</button>
      </div>

      <div>
        {tab === "home" && <HomeScreen {...screenProps} setTab={setTab} />}
        {tab === "stok" && <StokScreen {...screenProps} />}
        {tab === "produksi" && <ProduksiScreen {...screenProps} />}
        {tab === "waste" && <WasteScreen {...screenProps} />}
        {tab === "belanja" && <BelanjaScreen {...screenProps} />}
        {tab === "laporan" && <LaporanScreen {...screenProps} />}
        {tab === "resep" && <ResepScreen {...screenProps} />}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: C.nav,
        borderTop: `1px solid rgba(255,255,255,0.1)`,
        display: "flex", zIndex: 100,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            padding: "8px 2px 10px",
            borderTop: tab === t.id ? `2px solid ${C.accentLight}` : "2px solid transparent",
          }}>
            <div style={{ fontSize: 18 }}>{t.icon}</div>
            <div style={{ fontSize: 9, color: tab === t.id ? C.accentLight : C.muted, fontWeight: tab === t.id ? 700 : 400, marginTop: 2 }}>
              {t.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
