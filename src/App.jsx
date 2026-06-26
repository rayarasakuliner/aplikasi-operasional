import { useState, useEffect, useCallback } from "react";

// ── PENYIMPANAN ANTI REFRESH (LOCAL STORAGE) ──────────────────────
const KEYS = {
  bahan: "rr_bahan_v2",
  stok: "rr_stok_v2",
  produksi: "rr_produksi_v2",
  waste: "rr_waste_v2",
  belanja: "rr_belanja_v2",
  resep: "rr_resep_v2",
  currentUser: "rr_currentUser_v2",
};

// Fungsi mengambil data dari memori tablet
function loadData(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Fungsi menyimpan data ke memori tablet agar tidak hilang saat refresh
function saveData(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("Gagal menyimpan data", e);
  }
}

// ── DATA AWAL (SEED DATA) ─────────────────────────────────────────
const SEED_BAHAN = [
  { id: "b1", nama: "Ayam (kg)", satuan: "kg", minStok: 5 },
  { id: "b2", nama: "Bawang merah (kg)", satuan: "kg", minStok: 2 },
  { id: "b3", nama: "Bawang putih (kg)", satuan: "kg", minStok: 1 },
  { id: "b4", nama: "Santan (liter)", satuan: "liter", minStok: 3 },
];

const SEED_STOK = { b1: 10, b2: 5, b3: 3, b4: 5 };

const SEED_RESEP = [
  {
    id: "r1", nama: "Rendang Ayam", porsi: 10,
    bahan: [
      { bahanId: "b1", jumlah: 2 },
      { bahanId: "b2", jumlah: 0.3 },
      { bahanId: "b3", jumlah: 0.1 },
    ],
    catatan: "Masak api kecil harian."
  }
];

// Akun Bawaan Sistem
const ACCOUNTS = [
  { username: "manager", password: "123", name: "Kevin (Manager)", role: "manager" },
  { username: "staff", password: "123", name: "Staff Operasional", role: "staff" }
];

// ── DESAIN WARNA ──────────────────────────────────────────────────
const C = {
  bg: "#F7F3ED", card: "#FFFFFF", nav: "#2C1810", navText: "#F7F3ED",
  primary: "#8B4513", accent: "#C4821A", accentLight: "#F5C842",
  green: "#2D6A4F", greenLight: "#E8F5E9", red: "#C0392B", redLight: "#FDEDEB",
  border: "#E2D5C3", muted: "#9E8B76", text: "#2C1810",
};

// ── KOMPONEN TOMBOL & INPUT (UI HELPERS) ──────────────────────────
const Badge = ({ color, children }) => (
  <span style={{
    background: color === "red" ? C.redLight : color === "green" ? C.greenLight : "#FEF9EC",
    color: color === "red" ? C.red : color === "green" ? C.green : C.accent,
    border: `1px solid ${color === "red" ? "#F5B7B1" : color === "green" ? "#A9DFBF" : "#F9E79F"}`,
    borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "2px 8px", display: "inline-block",
  }}>{children}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12, ...style }}>{children}</div>
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
      ...styles[variant], borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", border: styles[variant].border || "none", opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, style = {} }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.bg, color: C.text, boxSizing: "border-box", ...style }}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.bg, color: C.text }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</div>}
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.bg, color: C.text, boxSizing: "border-box" }}
    />
  </div>
);

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// ══════════════════════════════════════════════════════════════════
// LAYAR LOGIN (DENGAN USERNAME & PASSWORD)
// ══════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = (e) => {
    e.preventDefault();
    const found = ACCOUNTS.find(a => a.username === username.toLowerCase() && a.password === password);
    if (found) {
      onLogin(found);
    } else {
      setError("Username atau Password salah!");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.nav, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍛</div>
        <div style={{ color: C.accentLight, fontSize: 22, fontWeight: 800 }}>RAYA RASA INTERNAL</div>
        <div style={{ color: C.muted, fontSize: 13 }}>Sistem Manajemen Otomatis Dapur</div>
      </div>
      <form onSubmit={handleSignIn} style={{ background: C.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 340 }}>
        {error && <div style={{ color: C.red, background: C.redLight, padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 12, fontWeight: 600, textCenter: "center" }}>{error}</div>}
        <Input label="Username" value={username} onChange={setUsername} placeholder="cth: manager atau staff" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Masukkan password" />
        <Btn style={{ width: "100%", marginTop: 8 }}>Masuk Sistem</Btn>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 12, textAlign: "center" }}>
          Petunjuk: Gunakan akun <b>manager</b> atau <b>staff</b> (password: 123)
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// LAYAR UTAMA (DASHBOARD SUMMARY)
// ══════════════════════════════════════════════════════════════════
function HomeScreen({ userObj, stok, bahan, produksi, waste, belanja, setTab }) {
  const stokRendah = bahan.filter(b => (stok[b.id] ?? 0) < b.minStok);
  return (
    <div>
      <div style={{ background: C.nav, padding: "20px 16px 24px" }}>
        <div style={{ color: C.accentLight, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Akses: {userObj.role.toUpperCase()}</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 2 }}>{userObj.name} 👋</div>
        <div style={{ color: C.muted, fontSize: 12 }}>{fmtDate(today())}</div>
      </div>
      <div style={{ padding: 12 }}>
        {stokRendah.length > 0 && (
          <div onClick={() => setTab("stok")} style={{ background: C.redLight, border: `1px solid #F5B7B1`, borderRadius: 12, padding: 12, marginBottom: 12, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: C.red, fontWeight: 700, fontSize: 13 }}>{stokRendah.length} Bahan kritis (stok rendah)</span>
            <span style={{ color: C.red, fontSize: 13 }}>Cek →</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div onClick={() => setTab("stok")} style={{ background: "#EBF5FB", padding: 16, borderRadius: 12, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 24 }}>📦</div><div style={{ fontSize: 13, fontWeight: 700 }}>Stok Bahan</div>
          </div>
          <div onClick={() => setTab("produksi")} style={{ background: "#EAFAF1", padding: 16, borderRadius: 12, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 24 }}>🍳</div><div style={{ fontSize: 13, fontWeight: 700 }}>Input Produksi</div>
          </div>
          <div onClick={() => setTab("belanja")} style={{ background: "#FEF9EC", padding: 16, borderRadius: 12, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 24 }}>🛒</div><div style={{ fontSize: 13, fontWeight: 700 }}>Nota Belanja</div>
          </div>
          <div onClick={() => setTab("waste")} style={{ background: "#FDEDEB", padding: 16, borderRadius: 12, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 24 }}>🗑️</div><div style={{ fontSize: 13, fontWeight: 700 }}>Catat Waste</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MANAGEMENT STOK (TAMBAH, UBAH, HAPUS)
// ══════════════════════════════════════════════════════════════════
function StokScreen({ bahan, setBahan, stok, setStok, userObj }) {
  const [showForm, setShowForm] = useState(false);
  const [editBahanId, setEditBahanId] = useState(null);
  const [nama, setNama] = useState("");
  const [satuan, setSatuan] = useState("kg");
  const [minStok, setMinStok] = useState("1");
  const [jumlahStok, setJumlahStok] = useState("0");

  const handleSimpan = () => {
    if (!nama.trim()) return;
    if (editBahanId) {
      // PROSES UBAH DATA (MANAGER SAJA YANG BISA NAMA/MINSTOK, STAFF HANYA JUMLAH)
      const updatedBahan = bahan.map(b => b.id === editBahanId ? { ...b, nama, satuan, minStok: parseFloat(minStok) || 0 } : b);
      setBahan(updatedBahan);
      setStok({ ...stok, [editBahanId]: parseFloat(jumlahStok) || 0 });
    } else {
      // PROSES TAMBAH DATA BARU
      const newId = "b_" + Date.now();
      setBahan([...bahan, { id: newId, nama, satuan, minStok: parseFloat(minStok) || 0 }]);
      setStok({ ...stok, [newId]: parseFloat(jumlahStok) || 0 });
    }
    resetForm();
  };

  const handlePemicuUbah = (b) => {
    setEditBahanId(b.id);
    setNama(b.nama);
    setSatuan(b.satuan);
    setMinStok(b.minStok.toString());
    setJumlahStok((stok[b.id] ?? 0).toString());
    setShowForm(true);
  };

  const handleHapus = (id) => {
    if (confirm("Hapus bahan baku ini dari database?")) {
      setBahan(bahan.filter(b => b.id !== id));
      const tempStok = { ...stok };
      delete tempStok[id];
      setStok(tempStok);
    }
  };

  const resetForm = () => {
    setEditBahanId(null); setNama(""); setSatuan("kg"); setMinStok("1"); setJumlahStok("0"); setShowForm(false);
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>📦 Stok Gudang</h3>
        {!showForm && <Btn onClick={() => setShowForm(true)} size="small">+ Tambah Bahan</Btn>}
      </div>

      {showForm && (
        <Card style={{ background: "#FDFEFE", borderColor: C.accent }}>
          <h4>{editBahanId ? "Ubah Data Bahan" : "Tambah Bahan Baru"}</h4>
          {userObj.role === "manager" || !editBahanId ? (
            <>
              <Input label="Nama Bahan" value={nama} onChange={setNama} placeholder="Ayam Pejantan (kg)" />
              <Input label="Satuan" value={satuan} onChange={setSatuan} placeholder="kg / liter / bungkus" />
              <Input label="Batas Minimal Stok" type="number" value={minStok} onChange={setMinStok} />
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>*Staff hanya diizinkan mengubah Angka Jumlah Stok.</div>
          )}
          <Input label="Jumlah Stok Fisik Saat Ini" type="number" value={jumlahStok} onChange={setJumlahStok} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn onClick={handleSimpan}>Simpan</Btn>
            <Btn variant="ghost" onClick={resetForm}>Batal</Btn>
          </div>
        </Card>
      )}

      {bahan.map(b => {
        const s = stok[b.id] ?? 0;
        const kritis = s < b.minStok;
        return (
          <Card key={b.id} style={{ borderColor: kritis ? C.red : C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{b.nama}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Min Stok: {b.minStok} {b.satuan}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: kritis ? C.red : C.green }}>{s} {b.satuan}</div>
                <Badge color={kritis ? "red" : "green"}>{kritis ? "Kritis" : "Aman"}</Badge>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bg}`, paddingTop: 8 }}>
              <button onClick={() => handlePemicuUbah(b)} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📝 Ubah</button>
              {userObj.role === "manager" && (
                <button onClick={() => handleHapus(b.id)} style={{ background: "none", border: "none", color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🗑️ Hapus</button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// INPUT PRODUKSI (MENGURANGI STOK GUDANG OTOMATIS)
// ══════════════════════════════════════════════════════════════════
function ProduksiScreen({ produksi, setProduksi, resep, stok, setStok, userObj }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [resepId, setResepId] = useState("");
  const [porsi, setPorsi] = useState("");
  const [catatan, setCatatan] = useState("");

  const handleSimpan = () => {
    const r = resep.find(x => x.id === resepId);
    if (!r || !porsi) return;

    const jumlahPorsi = parseFloat(porsi) || 0;

    if (editId) {
      // PROSES EDIT DATA PRODUKSI
      const updated = produksi.map(p => p.id === editId ? { ...p, resepId, nama: r.nama, jumlahPorsi, catatan, user: userObj.name } : p);
      setProduksi(updated);
      alert("Catatan produksi berhasil diperbarui (Pengurangan stok awal tetap dipertahankan).");
    } else {
      // PROSES INPUT BARU & POTONG STOK OTOMATIS
      const tempStok = { ...stok };
      let stokCukup = true;

      // Hitung kebutuhan bahan berdasarkan resep komparasi
      r.bahan.forEach(b => {
        const butuh = (b.jumlah / r.porsi) * jumlahPorsi;
        if ((tempStok[b.bahanId] ?? 0) < butuh) {
          stokCukup = false;
        }
        tempStok[b.bahanId] = Math.max(0, (tempStok[b.bahanId] ?? 0) - butuh);
      });

      if (!stokCukup) {
        if (!confirm("Peringatan: Stok bahan di gudang kurang dari kebutuhan resep ini. Tetap lanjutkan produksi?")) {
          return;
        }
      }

      setStok(tempStok); // Eksekusi potong stok gudang otomatis

      const newEntry = {
        id: "p_" + Date.now(), tanggal: today(), resepId, nama: r.nama,
        jumlahPorsi, catatan, user: userObj.name
      };
      setProduksi([newEntry, ...produksi]);
    }
    resetForm();
  };

  const handleHapus = (id) => {
    if (userObj.role !== "manager") return;
    if (confirm("Hapus riwayat produksi ini? (Catatan: Stok tidak dikembalikan otomatis).")) {
      setProduksi(produksi.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setEditId(null); setResepId(""); setPorsi(""); setCatatan(""); setShowForm(false);
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>🍳 Produksi Dapur</h3>
        {!showForm && <Btn onClick={() => setShowForm(true)}>+ Input Produksi</Btn>}
      </div>

      {showForm && (
        <Card style={{ background: "#EAFAF1" }}>
          <h4>{editId ? "Ubah Log Produksi" : "Input Hasil Masak Hari Ini"}</h4>
          <Select label="Pilih Resep Menu" value={resepId} onChange={setResepId} options={[{ value: "", label: "-- Pilih Menu Masakan --" }, ...resep.map(r => ({ value: r.id, label: r.nama }))]} />
          <Input label="Jumlah Porsi Yang Dimasak" type="number" value={porsi} onChange={setPorsi} placeholder="cth: 50" />
          <Textarea label="Catatan Tambahan" value={catatan} onChange={setCatatan} placeholder="Ayam pejantan aman, rasa pas." />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handleSimpan}>Simpan & Potong Stok</Btn>
            <Btn variant="ghost" onClick={resetForm}>Batal</Btn>
          </div>
        </Card>
      )}

      {produksi.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.nama}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Oleh: {p.user} | {p.tanggal}</div>
              {p.catatan && <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic" }}>"{p.catatan}"</div>}
            </div>
            <div style={{ textAlign: "right", fontWeight: 800, color: C.primary, fontSize: 16 }}>{p.jumlahPorsi} Porsi</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end", borderTop: `1px solid ${C.bg}`, paddingTop: 6 }}>
            <button onClick={() => { setEditId(p.id); setResepId(p.resepId); setPorsi(p.jumlahPorsi.toString()); setCatatan(p.catatan); setShowForm(true); }} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>📝 Ubah</button>
            {userObj.role === "manager" && (
              <button onClick={() => handleHapus(p.id)} style={{ background: "none", border: "none", color: C.red, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>🗑️ Hapus</button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DATABASE RESEP (TAMBAH, UBAH, HAPUS)
// ══════════════════════════════════════════════════════════════════
function ResepScreen({ resep, setResep, bahan, userObj }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nama, setNama] = useState("");
  const [porsi, setPorsi] = useState("10");
  const [catatan, setCatatan] = useState("");
  const [komposisi, setKomposisi] = useState([{ bahanId: "", jumlah: "" }]);

  const handleTambahBahan = () => setKomposisi([...komposisi, { bahanId: "", jumlah: "" }]);
  
  const handleUbahBarisBahan = (index, field, value) => {
    const baru = [...komposisi];
    baru[index][field] = value;
    setKomposisi(baru);
  };

  const handleSimpan = () => {
    if (!nama.trim()) return;
    const listBahan = komposisi.filter(k => k.bahanId && k.jumlah);

    const dataResep = {
      id: editId || "r_" + Date.now(),
      nama, porsi: parseFloat(porsi) || 10, catatan,
      bahan: listBahan.map(l => ({ bahanId: l.bahanId, jumlah: parseFloat(l.jumlah) || 0 }))
    };

    if (editId) {
      setResep(resep.map(r => r.id === editId ? dataResep : r));
    } else {
      setResep([...resep, dataResep]);
    }
    resetForm();
  };

  const handlePemicuUbah = (r) => {
    if (userObj.role !== "manager") {
      alert("Hanya Manager yang dapat mengubah rumus resep induk!");
      return;
    }
    setEditId(r.id); setNama(r.nama); setPorsi(r.porsi.toString()); setCatatan(r.catatan); setKomposisi(r.bahan); setShowForm(true);
  };

  const handleHapus = (id) => {
    if (confirm("Hapus resep masakan ini selamanya?")) {
      setResep(resep.filter(r => r.id !== id));
    }
  };

  const resetForm = () => {
    setEditId(null); setNama(""); setPorsi("10"); setCatatan(""); setKomposisi([{ bahanId: "", jumlah: "" }]); setShowForm(false);
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>📖 Resep Buku Masak</h3>
        {userObj.role === "manager" && !showForm && <Btn onClick={() => setShowForm(true)}>+ Buat Resep</Btn>}
      </div>

      {showForm && (
        <Card style={{ background: "#EBF5FB" }}>
          <h4>{editId ? "Ubah Rumus Resep" : "Racik Resep Induk Baru"}</h4>
          <Input label="Nama Masakan" value={nama} onChange={setNama} placeholder="Ayam Goreng Lengkuas" />
          <Input label="Standar Hasil Produksi (Porsi)" type="number" value={porsi} onChange={setPorsi} />
          
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700 }}>Kebutuhan Komposisi Bahan:</div>
          {komposisi.map((k, idx) => (
            <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select value={k.bahanId} onChange={e => handleUbahBarisBahan(idx, "bahanId", e.target.value)} style={{ flex: 2, padding: 6, borderRadius: 6 }}>
                <option value="">-- Pilih Bahan --</option>
                {bahan.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
              </select>
              <input type="number" value={k.jumlah} onChange={e => handleUbahBarisBahan(idx, "jumlah", e.target.value)} placeholder="Qty" style={{ flex: 1, padding: 6, borderRadius: 6 }} />
            </div>
          ))}
          <button onClick={handleTambahBahan} style={{ background: "none", color: C.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>+ Tambah Baris Bahan</button>

          <Textarea label="Langkah & Petunjuk" value={catatan} onChange={setCatatan} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn onClick={handleSimpan}>Simpan Resep</Btn>
            <Btn variant="ghost" onClick={resetForm}>Batal</Btn>
          </div>
        </Card>
      )}

      {resep.map(r => (
        <Card key={r.id}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{r.nama}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Porsi Standar: {r.porsi} Porsi</div>
          <div style={{ background: C.bg, padding: 8, borderRadius: 6, fontSize: 12 }}>
            {r.bahan.map((b, i) => {
              const item = bahan.find(x => x.id === b.bahanId);
              return <div key={i}>• {item?.nama || "Bahan Terhapus"}: {b.jumlah} {item?.satuan || ""}</div>;
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bg}`, paddingTop: 6 }}>
            {userObj.role === "manager" && (
              <>
                <button onClick={() => handlePemicuUbah(r)} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📝 Ubah</button>
                <button onClick={() => handleHapus(r.id)} style={{ background: "none", border: "none", color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🗑️ Hapus</button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SKRIN PEMBANTU (WASTE & NOTA BELANJA - SEDERHANA)
// ══════════════════════════════════════════════════════════════════
function WasteScreen({ waste, setWaste, bahan, userObj }) {
  const [bahanId, setBahanId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [alasan, setAlasan] = useState("Gosong");

  const handleSimpan = () => {
    const b = bahan.find(x => x.id === bahanId);
    if (!b || !jumlah) return;
    const newW = { id: "w_" + Date.now(), namaBahan: b.nama, jumlah: parseFloat(jumlah), alasan, tanggal: today(), user: userObj.name };
    setWaste([newW, ...waste]);
    setBahanId(""); setJumlah("");
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>🗑️ Catat Waste Operasional</h3>
      <Card style={{ background: C.redLight }}>
        <Select label="Pilih Bahan Rusak/Terbuang" value={bahanId} onChange={v => setBahanId(v)} options={[{ value: "", label: "-- Pilih --" }, ...bahan.map(b => ({ value: b.id, label: b.nama }))]} />
        <Input label="Jumlah" type="number" value={jumlah} onChange={setJumlah} />
        <Select label="Alasan" value={alasan} onChange={v => setAlasan(v)} options={[{ value: "Gosong", label: "Gosong" }, { value: "Tumpah", label: "Tumpah/Jatuh" }, { value: "Busuk", label: "Busuk" }]} />
        <Btn variant="danger" onClick={handleSimpan}>Simpan Log</Btn>
      </Card>
      {waste.map(w => (
        <Card key={w.id}><div><b>{w.namaBahan}</b> - {w.jumlah} ({w.alasan}) <div style={{ fontSize: 10, color: C.muted }}>{w.tanggal} | {w.user}</div></div></Card>
      ))}
    </div>
  );
}

function BelanjaScreen({ belanja, setBelanja, userObj }) {
  const [toko, setToko] = useState("");
  const [total, setTotal] = useState("");

  const handleSimpan = () => {
    if (!toko || !total) return;
    setBelanja([{ id: "bl_" + Date.now(), supplier: toko, total: parseFloat(total) || 0, tanggal: today(), user: userObj.name }, ...belanja]);
    setToko(""); setTotal("");
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>🛒 Nota Belanja Pasar</h3>
      <Card style={{ background: "#FEF9EC" }}>
        <Input label="Nama Toko/Supplier" value={toko} onChange={setToko} placeholder="Toko Sayur Sumber" />
        <Input label="Total Nota Pengeluaran (Rp)" type="number" value={total} onChange={setTotal} placeholder="50000" />
        <Btn onClick={handleSimpan}>Simpan Nota Pengeluaran</Btn>
      </Card>
      {belanja.map(b => (
        <Card key={b.id}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><b>{b.supplier}</b><div style={{ fontSize: 11, color: C.muted }}>{b.tanggal}</div></div>
            <div style={{ fontWeight: 700, color: C.primary }}>Rp {b.total.toLocaleString("id-ID")}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APLIKASI INDUK UTAMA (MAIN APP ROUTER)
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [userObj, setUserObj] = useState(() => loadData(KEYS.currentUser, null));
  const [tab, setTab] = useState("home");

  const [bahan, setBahanState] = useState(() => loadData(KEYS.bahan, SEED_BAHAN));
  const [stok, setStokState] = useState(() => loadData(KEYS.stok, SEED_STOK));
  const [produksi, setProduksiState] = useState(() => loadData(KEYS.produksi, []));
  const [waste, setWasteState] = useState(() => loadData(KEYS.waste, []));
  const [belanja, setBelanjaState] = useState(() => loadData(KEYS.belanja, []));
  const [resep, setResepState] = useState(() => loadData(KEYS.resep, SEED_RESEP));

  // Wrapper sinkronisasi otomatis ke memori internal browser saat data dimutasi
  const setBahan = useCallback((v) => { setBahanState(v); saveData(KEYS.bahan, v); }, []);
  const setStok = useCallback((v) => { setStokState(v); saveData(KEYS.stok, v); }, []);
  const setProduksi = useCallback((v) => { setProduksiState(v); saveData(KEYS.produksi, v); }, []);
  const setWaste = useCallback((v) => { setWasteState(v); saveData(KEYS.waste, v); }, []);
  const setBelanja = useCallback((v) => { setBelanjaState(v); saveData(KEYS.belanja, v); }, []);
  const setResep = useCallback((v) => { setResepState(v); saveData(KEYS.resep, v); }, []);

  const handleLogin = (account) => { setUserObj(account); saveData(KEYS.currentUser, account); };
  const handleLogout = () => { setUserObj(null); localStorage.removeItem(KEYS.currentUser); setTab("home"); };

  if (!userObj) return <LoginScreen onLogin={handleLogin} />;

  const sp = { userObj, bahan, setBahan, stok, setStok, produksi, setProduksi, waste, setWaste, belanja, setBelanja, resep, setResep };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", paddingBottom: 80, color: C.text }}>
      {/* Top Navigation Bar */}
      <div style={{ background: C.nav, color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, color: C.accentLight, fontSize: 15 }}>🍛 RAYA RASA</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Hak Akses: {userObj.role}</div>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${C.muted}`, color: C.muted, padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Keluar</button>
      </div>

      {/* Screen Router */}
      <div>
        {tab === "home" && <HomeScreen {...sp} setTab={setTab} />}
        {tab === "stok" && <StokScreen {...sp} />}
        {tab === "produksi" && <ProduksiScreen {...sp} />}
        {tab === "waste" && <WasteScreen {...sp} />}
        {tab === "belanja" && <BelanjaScreen {...sp} />}
        {tab === "resep" && <ResepScreen {...sp} />}
      </div>

      {/* Bottom Menu Navigation */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.nav, display: "flex", zIndex: 100, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {[
          { id: "home", label: "Utama", icon: "🏠" },
          { id: "stok", label: "Stok", icon: "📦" },
          { id: "produksi", label: "Produksi", icon: "🍳" },
          { id: "resep", label: "Resep", icon: "📖" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0", color: tab === t.id ? C.accentLight : C.muted, cursor: "pointer" }}>
            <div style={{ fontSize: 16 }}>{t.icon}</div>
            <div style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
