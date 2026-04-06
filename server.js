// ================================
// 🚀 IMPORTAÇÕES
// ================================
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

require("dotenv").config();

// ================================
// ⚙️ CONFIGURAÇÃO DO APP
// ================================
const app = express();

app.use(cors());
app.use(express.json());


// ================================
// 🔐 MIDDLEWARE DE PROTEÇÃO ADMIN
// ================================
function checkAdmin(req, res, next) {
  const senha = req.headers["x-admin-password"];

  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Acesso negado" });
  }

  next();
}


// ================================
// 🧠 CONEXÃO COM MONGODB
// ================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch((err) => console.error("🔴 Erro MongoDB:", err));


// ================================
// 🧱 MODEL
// ================================
const EventoSchema = new mongoose.Schema({
  nome: String,
  fotos: [String],
});

const Evento = mongoose.model("Evento", EventoSchema);


// ================================
// ☁️ CLOUDINARY (AGORA COM ENV)
// ================================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


// ================================
// 📦 STORAGE CLOUDINARY
// ================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const evento = req.body.evento;

    return {
      folder: `eventos/${evento}`,
      format: "jpg",
      public_id: Date.now() + "-" + file.originalname,
    };
  },
});

const upload = multer({ storage });


// ================================
// 📤 UPLOAD (PROTEGIDO)
// ================================
app.post("/upload", checkAdmin, upload.array("fotos"), async (req, res) => {
  try {
    const evento = req.body.evento;

    const urls = req.files.map((file) => file.path);

    let eventoExistente = await Evento.findOne({ nome: evento });

    if (eventoExistente) {
      eventoExistente.fotos.push(...urls);
      await eventoExistente.save();
    } else {
      await Evento.create({
        nome: evento,
        fotos: urls,
      });
    }

    res.json({
      message: "Upload realizado com sucesso",
      fotos: urls,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro no upload" });
  }
});


// ================================
// 📸 LISTAR FOTOS
// ================================
app.get("/evento/:codigo", async (req, res) => {
  try {
    const codigo = req.params.codigo;

    const evento = await Evento.findOne({ nome: codigo });

    if (!evento) return res.json([]);

    res.json(evento.fotos);

  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar evento" });
  }
});


// ================================
// 🧪 TESTE
// ================================
app.get("/", (req, res) => {
  res.send("API rodando com MongoDB + Cloudinary 🚀");
});


// ================================
// 🚀 START
// ================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});