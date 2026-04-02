const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📁 SERVIR IMAGENS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 📦 CONFIGURAÇÃO DO MULTER (UPLOAD)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const evento = req.body.evento;
    const dir = path.join(__dirname, "uploads", evento);

    // cria pasta automaticamente
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* 🚀 ROTA DE UPLOAD (ESSA ESTAVA FALTANDO) */
app.post("/upload", upload.array("fotos"), (req, res) => {
  res.json({ message: "Upload realizado com sucesso" });
});

/* 📸 LISTAR FOTOS DO EVENTO */
app.get("/evento/:codigo", (req, res) => {
  const codigo = req.params.codigo.toLowerCase();
  const dir = path.join(__dirname, "uploads", codigo);

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: "Evento não encontrado" });
  }

  const arquivos = fs.readdirSync(dir);

 const fotos = arquivos.map(
  (file) => `${req.protocol}://${req.get("host")}/uploads/${codigo}/${file}`
);

  res.json(fotos);
});


const archiver = require("archiver");

/* 📦 DOWNLOAD ZIP */
app.get("/download/:codigo", (req, res) => {
  const codigo = req.params.codigo.toLowerCase();
  const dir = path.join(__dirname, "uploads", codigo);

  if (!fs.existsSync(dir)) {
    return res.status(404).send("Evento não encontrado");
  }

  res.attachment(`${codigo}.zip`);

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(res);

  archive.directory(dir, false);

  archive.finalize();
});

/* 🚀 START */
app.get("/", (req, res) => {
  res.send("API rodando");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Servidor rodando");
});