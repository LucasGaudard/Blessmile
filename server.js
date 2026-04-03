
// ================================
// 🚀 IMPORTAÇÕES
// ================================
const express = require("express");
const cors = require("cors");
const multer = require("multer");


// MongoDB
const mongoose = require("mongoose");

// Cloudinary
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");


// ================================
// ⚙️ CONFIGURAÇÃO DO APP
// ================================
const app = express();

app.use(cors());
app.use(express.json());


// ================================
// 🧠 CONEXÃO COM MONGODB
// ================================
// 🔥 COLOCA SUA STRING AQUI
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch((err) => console.error("🔴 Erro MongoDB:", err));


// ================================
// 🧱 MODEL (EVENTO)
// ================================
const EventoSchema = new mongoose.Schema({
  nome: String,
  fotos: [String],
});

const Evento = mongoose.model("Evento", EventoSchema);


// ================================
// ☁️ CONFIGURAÇÃO CLOUDINARY
// ================================
cloudinary.config({
  cloud_name: "dbbznwduu",
  api_key: "552771593718253",
  api_secret: "11on-WhW1o8iznYQnzQe_Y66gw",
});


// ================================
// 📦 STORAGE (UPLOAD CLOUDINARY)
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
// 📤 ROTA DE UPLOAD (AGORA COM DB)
// ================================
app.post("/upload", upload.array("fotos"), async (req, res) => {
  try {
    const evento = req.body.evento;

    const urls = req.files.map((file) => file.path);

    // 🔥 PROCURA EVENTO
    let eventoExistente = await Evento.findOne({ nome: evento });

    if (eventoExistente) {
      // adiciona novas fotos
      eventoExistente.fotos.push(...urls);
      await eventoExistente.save();
    } else {
      // cria novo evento
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
// 📸 LISTAR FOTOS DO EVENTO (DB)
// ================================
app.get("/evento/:codigo", async (req, res) => {
  try {
    const codigo = req.params.codigo;

    const evento = await Evento.findOne({ nome: codigo });

    if (!evento) {
      return res.json([]);
    }

    res.json(evento.fotos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar evento" });
  }
});


// ================================
// 📦 DOWNLOAD (FUTURO)
// ================================
app.get("/download/:codigo", async (req, res) => {
  res.json({
    message: "Download ainda não implementado",
  });
});


// ================================
// 🧪 ROTA TESTE
// ================================
app.get("/", (req, res) => {
  res.send("API rodando com MongoDB + Cloudinary 🚀");
});


// ================================
// 🚀 START SERVIDOR
// ================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});