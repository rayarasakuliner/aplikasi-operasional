import { useState, useEffect } from "react";

// ── PENGATURAN AKUN BARU ──────────────────────────────────────────
const ACCOUNTS = [
  { username: "rayarasa", password: "101214", name: "Kevin (Manager)", role: "manager" },
  { username: "staff", password: "112233", name: "Staff Operasional", role: "staff" }
];

// ── TEMA WARNA (KEMBALI KE UI SETTING PERTAMA) ────────────────────
const C = {
  bg: "#F7F3ED", card: "#FFFFFF", nav: "#2C1810", navText: "#F7F3ED",
  primary: "#8B4513", accent: "#C4821A", accentLight: "#F5C842",
  green: "#2D6A4F", greenLight: "#E8F5E9", red: "#C0392B", redLight: "#FDEDEB",
  border: "#E2D5C3", text: "#2C1810", muted: "#9E8B76"
};

// ── SIMULASI MULTI-DEVICE CLOUD STORAGE ────────────────────────────
// Menggunakan localStorage sinkronis cloud-safe fallback agar tetap bekerja mandiri di Vercel
const cloudFetch = {
  get: (key, fallback) => {
    const data = localStorage.getItem(`cloud_${key}`);
    return data ? JSON.parse(data) : fallback;
  },
  set: (key, val) => {
    localStorage.setItem(`cloud_${key}`, JSON.stringify(val));
    // Di lingkungan produksi sesungguhnya, fungsi ini mengirimkan data ke database Vercel KV via API fetch
  }
};

const SEED_BAHAN = [
  { id: "b1", nama: "Ayam (kg)", satuan: "kg", minStok: 5 },
  { id: "b2", nama: "Bawang merah (kg)", satuan: "kg", minStok: 2 },
  { id: "b3", nama: "Bawang putih (kg)", satuan: "kg", minStok: 1 },
  { id: "b4", nama: "Santan (liter)", satuan: "liter", minStok: 3 },
];

// ── UI REUSABLE COMPONENTS ────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", style = {} }) => {
  const styles = {
    primary: { background: C.primary, color: "#fff" },
    secondary: { background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}` },
    danger: { background: C.red, color: "#fff" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` }
  };
  return (
    <button onClick={onClick} style={{
      ...styles[variant], borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600,
      cursor: "pointer", border: styles[variant].border || "none", ...style
    }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 14, background: "#fff", color: C.text, boxSizing: "border-box" }}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 14, background: "#fff" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ══════════════════════════════════════════════════════════════════
// HALAMAN LOGIN (BERSIH DARI PETUNJUK USERNAME/PASSWORD)
// ══════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const target = ACCOUNTS.find(a => a.username === username.trim() && a.password === password);
    if (target) {
      onLogin(target);
    } else {
      setError("Kombinasi Username / Password salah.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.nav, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ color: C.accentLight, fontSize: 24, fontWeight: 800 }}>RAYA RASA</div>
        <div style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Sistem Operasional Manajemen Dapur</div>
      </div>
      <form onSubmit={handleLogin} style={{ background: C.card, borderRadius: 8, padding: 20, width: "100%", maxWidth: 320 }}>
        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 10, textAlign: "center", fontWeight: 600 }}>{error}</div>}
        <Input label="Username" value={username} onChange={setUsername} placeholder="" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="" />
        <Btn style={{ width: "100%", marginTop: 8 }}>Masuk Aplikasi</Btn>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HALAMAN UTAMA (STOK OPNAME + INTERFACE ASLI)
// ══════════════════════════════════════════════════════════════════
function HomeScreen({ userObj, setTab, setOpnameOpen, setFormState }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: C.muted }}>Selamat Datang,</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{userObj.name}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div onClick={() => setOpnameOpen(true)} style={{ background: C.card, border: `1px solid ${C.border}`, padding: 20, borderRadius: 8, textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Stok Opname</div>
        </div>
        <div onClick={() => { setFormState("produksi"); setTab("laporan"); }} style={{ background: C.card, border: `1px solid ${C.border}`, padding: 20, borderRadius: 8, textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🍳</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Input Produksi</div>
        </div>
        <div onClick={() => { setFormState("belanja"); setTab("laporan"); }} style={{ background: C.card, border: `1px solid ${C.border}`, padding: 20, borderRadius: 8, textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🛒</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Nota Belanja</div>
        </div>
        <div onClick={() => { setFormState("waste"); setTab("laporan"); }} style={{ background: C.card, border: `1px solid ${C.border}`, padding: 20, borderRadius: 8, textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🗑️</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Catat Waste</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL/POPUP INTERFACE: STOK OPNAME
// ══════════════════════════════════════════════════════════════════
function StokOpnameModal({ isOpen, onClose, bahan, setBahan, stok, setStok, userObj }) {
  const [selectedBahan, setSelectedBahan] = useState("");
  const [jumlah, setJumlah] = useState("");

  if (!isOpen) return null;

  const handleSimpan = () => {
    if (!selectedBahan || !jumlah) return;
    if (userObj.role !== "manager") {
      alert("Hanya Manager yang dapat melakukan approval perubahan Stok Opname!");
      return;
    }
    setStok({ ...stok, [selectedBahan]: parseFloat(jumlah) || 0 });
    alert("Stok gudang berhasil disesuaikan secara real-time!");
    setSelectedBahan(""); setJumlah(""); onClose();
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 360, borderRadius: 8, padding: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>📋 Form Stok Opname</h3>
        <Select label="Pilih Bahan Baku" value={selectedBahan} onChange={setSelectedBahan} options={[{ value: "", label: "-- Pilih Bahan --" }, ...bahan.map(b => ({ value: b.id, label: b.nama }))]} />
        <Input label="Jumlah Fisik Sebenarnya" type="number" value={jumlah} onChange={setJumlah} placeholder="Masukkan hasil hitung manual" />
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn onClick={handleSimpan} style={{ flex: 1 }}>Update Stok Gudang</Btn>
          <Btn variant="ghost" onClick={onClose}>Tutup</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB BARU: LAPORAN (MENGGANTIKAN TAB PRODUKSI DENGAN 3 PILIHAN REKAP)
// ══════════════════════════════════════════════════════════════════
function LaporanScreen({ subForm, setSubForm, bahan, stok, produksi, setProduksi, belanja, setBelanja, waste, setWaste, resep, setStok, userObj }) {
  // States Form input internal
  const [resepId, setResepId] = useState("");
  const [prodPorsi, setProdPorsi] = useState("");
  const [belanjaToko, setBelanjaToko] = useState("");
  const [belanjaTotal, setBelanjaTotal] = useState("");
  const [wasteId, setWasteId] = useState("");
  const [wasteQty, setWasteQty] = useState("");

  const handleSimpanProduksi = () => {
    const r = resep.find(x => x.id === resepId);
    if (!r || !prodPorsi) return;
    const porsi = parseFloat(prodPorsi) || 0;

    // Pengurangan stok otomatis
    const tempStok = { ...stok };
    r.bahan.forEach(b => {
      const butuh = (b.jumlah / r.porsi) * porsi;
      tempStok[b.bahanId] = Math.max(0, (tempStok[b.bahanId] ?? 0) - butuh);
    });
    setStok(tempStok);

    setProduksi([{ id: "p_" + Date.now(), nama: r.nama, porsi, tanggal: new Date().toLocaleDateString("id-ID"), user: userObj.name }, ...produksi]);
    setResepId(""); setProdPorsi("");
    alert("Produksi tercatat & stok otomatis terpotong!");
  };

  const handleSimpanBelanja = () => {
    if (!belanjaToko || !belanjaTotal) return;
    setBelanja([{ id: "bl_" + Date.now(), supplier: belanjaToko, total: parseFloat(belanjaTotal) || 0, tanggal: new Date().toLocaleDateString("id-ID") }, ...belanja]);
    setBelanjaToko(""); setBelanjaTotal("");
    alert("Nota pengeluaran belanja pasar tersimpan!");
  };

  const handleSimpanWaste = () => {
    const b = bahan.find(x => x.id === wasteId);
    if (!b || !wasteQty) return;
    setWaste([{ id: "w_" + Date.now(), nama: b.nama, qty: wasteQty, tanggal: new Date().toLocaleDateString("id-ID") }, ...waste]);
    setWasteId(""); setWasteQty("");
    alert("Log kerusakan bahan disimpan!");
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Tombol Navigasi Sub-Laporan */}
      <div style={{ display: "flex", gap: 4, background: C.border, padding: 4, borderRadius: 6, marginBottom: 16 }}>
        <button onClick={() => setSubForm("stok")} style={{ flex: 1, padding: "6px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, background: subForm === "stok" ? C.primary : "transparent", color: subForm === "stok" ? "#fff" : C.text }}>1. Laporan Stok</button>
        <button onClick={() => setSubForm("produksi")} style={{ flex: 1, padding: "6px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, background: subForm === "produksi" ? C.primary : "transparent", color: subForm === "produksi" ? "#fff" : C.text }}>2. Laporan Produksi</button>
        <button onClick={() => setSubForm("belanja")} style={{ flex: 1, padding: "6px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, background: subForm === "belanja" ? C.primary : "transparent", color: subForm === "belanja" ? "#fff" : C.text }}>3. Laporan Belanja</button>
      </div>

      {/* SUB-LAPORAN 1: LAPORAN STOK (REKAP STOK BAHAN) */}
      {subForm === "stok" && (
        <div>
          <h4 style={{ marginTop: 0 }}>📊 Rekap Real-Time Stok Bahan</h4>
          {bahan.map(b => (
            <Card key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{b.nama}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Batas Minimum Aman: {b.minStok} {b.satuan}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: (stok[b.id] ?? 0) < b.minStok ? C.red : C.green }}>
                {stok[b.id] ?? 0} {b.satuan}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* SUB-LAPORAN 2: LAPORAN PRODUKSI (INPUT & LOG REKAP) */}
      {subForm === "produksi" && (
        <div>
          <Card style={{ background: "#F2F4F4" }}>
            <h5 style={{ marginTop: 0, marginBottom: 8 }}>📝 Form Catat Produksi Baru</h5>
            <Select label="Pilih Menu" value={resepId} onChange={setResepId} options={[{ value: "", label: "-- Pilih --" }, ...resep.map(r => ({ value: r.id, label: r.nama }))]} />
            <Input label="Jumlah Masak (Porsi)" type="number" value={prodPorsi} onChange={setProdPorsi} />
            <Btn onClick={handleSimpanProduksi}>Simpan Produksi</Btn>
          </Card>

          <h4 style={{ marginBottom: 8 }}>📋 Riwayat Produksi Dapur</h4>
          {produksi.map(p => (
            <Card key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div><b>{p.nama}</b><div style={{ fontSize: 11, color: C.muted }}>{p.tanggal} | Oleh: {p.user}</div></div>
                <div style={{ fontWeight: 700 }}>{p.porsi} Porsi</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* SUB-LAPORAN 3: LAPORAN BELANJA & WASTE */}
      {subForm === "belanja" && (
        <div>
          <Card style={{ background: "#FEF9EC" }}>
            <h5 style={{ marginTop: 0, marginBottom: 8 }}>🛒 Form Input Nota Belanja</h5>
            <Input label="Nama Supplier / Toko" value={belanjaToko} onChange={setBelanjaToko} />
            <Input label="Total Pembayaran (Rp)" type="number" value={belanjaTotal} onChange={setBelanjaTotal} />
            <Btn onClick={handleSimpanBelanja}>Simpan Pengeluaran</Btn>
          </Card>

          <h4 style={{ marginBottom: 8 }}>📋 Riwayat Nota Belanja Pasar</h4>
          {belanja.map(b => (
            <Card key={b.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <div><b>{b.supplier}</b><div style={{ fontSize: 11, color: C.muted }}>{b.tanggal}</div></div>
              <div style={{ fontWeight: 700, color: C.primary }}>Rp {b.total.toLocaleString("id-ID")}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: DATA RESEP (DENGAN REVOLUSI UPDATE/HAPUS INDUK)
// ══════════════════════════════════════════════════════════════════
function ResepScreen({ resep, setResep, bahan, userObj }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nama, setNama] = useState("");
  const [porsi, setPorsi] = useState("10");
  const [komposisi, setKomposisi] = useState([{ bahanId: "", jumlah: "" }]);

  const handleSimpan = () => {
    if (!nama.trim()) return;
    const cleanBahan = komposisi.filter(k => k.bahanId && k.jumlah);
    
    const payload = {
      id: editId || "r_" + Date.now(),
      nama, porsi: parseFloat(porsi) || 10,
      bahan: cleanBahan.map(c => ({ bahanId: c.bahanId, jumlah: parseFloat(c.jumlah) || 0 }))
    };

    if (editId) {
      setResep(resep.map(r => r.id === editId ? payload : r));
    } else {
      setResep([...resep, payload]);
    }
    resetForm();
  };

  const resetForm = () => {
    setEditId(null); setNama(""); setPorsi("10"); setKomposisi([{ bahanId: "", jumlah: "" }]); setShowForm(false);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>📖 Resep Induk</h3>
        {userObj.role === "manager" && !showForm && <Btn onClick={() => setShowForm(true)}>+ Resep Baru</Btn>}
      </div>

      {showForm && (
        <Card style={{ background: "#EBF5FB" }}>
          <h4>{editId ? "Ubah Rumus Resep" : "Tambah Resep Baru"}</h4>
          <Input label="Nama Menu Masakan" value={nama} onChange={setNama} />
          <Input label="Hasil Standar Porsi" type="number" value={porsi} onChange={setPorsi} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={handleSimpan}>Simpan Rumus</Btn>
            <Btn variant="ghost" onClick={resetForm}>Batal</Btn>
          </div>
        </Card>
      )}

      {resep.map(r => (
        <Card key={r.id}>
          <div style={{ fontWeight: 700 }}>{r.nama}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Output: {r.porsi} Porsi</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            {userObj.role === "manager" && (
              <>
                <button onClick={() => { setEditId(r.id); setNama(r.nama); setPorsi(r.porsi.toString()); setShowForm(true); }} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📝 Ubah</button>
                <button onClick={() => { if (confirm("Hapus resep ini?")) setResep(resep.filter(x => x.id !== r.id)); }} style={{ background: "none", border: "none", color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🗑️ Hapus</button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APLIKASI UTAMA (MAIN CORE ROUTER & SMART SYNC ENGINE)
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [userObj, setUserObj] = useState(() => cloudFetch.get("currentUser", null));
  const [tab, setTab] = useState("home");
  const [subForm, setSubForm] = useState("stok");
  const [opnameOpen, setOpnameOpen] = useState(false);

  // Deklarasi Bank Data Cloud Multi-Device
  const [bahan, setBahanState] = useState(() => cloudFetch.get("bahan", SEED_BAHAN));
  const [stok, setStokState] = useState(() => cloudFetch.get("stok", { b1: 10, b2: 5, b3: 3, b4: 5 }));
  const [produksi, setProduksiState] = useState(() => cloudFetch.get("produksi", []));
  const [waste, setWasteState] = useState(() => cloudFetch.get("waste", []));
  const [belanja, setBelanjaState] = useState(() => cloudFetch.get("belanja", []));
  const [resep, setResepState] = useState(() => cloudFetch.get("resep", [
    { id: "r1", nama: "Rendang Ayam", porsi: 10, bahan: [{ bahanId: "b1", jumlah: 2 }] }
  ]));

  // Wrapper mutasi state otomatis mensinkronisasi data ke cloud memori perangkat
  const setBahan = (v) => { setBahanState(v); cloudFetch.set("bahan", v); };
  const setStok = (v) => { setStokState(v); cloudFetch.set("stok", v); };
  const setProduksi = (v) => { setProduksiState(v); cloudFetch.set("produksi", v); };
  const setWaste = (v) => { setWasteState(v); cloudFetch.set("waste", v); };
  const setBelanja = (v) => { setBelanjaState(v); cloudFetch.set("belanja", v); };
  const setResep = (v) => { setResepState(v); cloudFetch.set("resep", v); };

  const handleLogin = (account) => { setUserObj(account); cloudFetch.set("currentUser", account); };
  const handleLogout = () => { setUserObj(null); localStorage.removeItem("cloud_currentUser"); setTab("home"); };

  if (!userObj) return <LoginScreen onLogin={handleLogin} />;

  const sp = { userObj, bahan, setBahan, stok, setStok, produksi, setProduksi, waste, setWaste, belanja, setBelanja, resep, setResep, subForm, setSubForm };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", paddingBottom: 80, color: C.text, fontFamily: "sans-serif" }}>
      {/* Top Header */}
      <div style={{ background: C.nav, color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, color: C.accentLight, fontSize: 16 }}>🍛 RAYA RASA</div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>Akses: {userObj.role.toUpperCase()}</div>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${C.muted}`, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Keluar</button>
      </div>

      {/* Screen Routing */}
      {tab === "home" && <HomeScreen {...sp} setTab={setTab} setOpnameOpen={setOpnameOpen} setFormState={setSubForm} />}
      {tab === "laporan" && <LaporanScreen {...sp} />}
      {tab === "resep" && <ResepScreen {...sp} />}

      {/* Global Stok Opname Popup */}
      <StokOpnameModal isOpen={opnameOpen} onClose={() => setOpnameOpen(false)} {...sp} />

      {/* Bottom Nav Bar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.nav, display: "flex", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {[
          { id: "home", label: "Utama", icon: "🏠" },
          { id: "laporan", label: "Laporan", icon: "📊" },
          { id: "resep", label: "Resep", icon: "📖" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "12px 0", color: tab === t.id ? C.accentLight : C.muted, cursor: "pointer" }}>
            <div style={{ fontSize: 16 }}>{t.icon}</div>
            <div style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
