const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* 🔥 MULTER */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* 🔥 CLOUDINARY */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/* 🔥 MONGO */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch(err => console.log(err));

const Foto = mongoose.model("Foto", {
  evento: String,
  url: String,
});

/* 🔐 VALIDAR ADMIN */
app.post("/validar-admin", (req, res) => {
  const senha = req.headers["x-admin-password"];

  if (senha === process.env.ADMIN_PASSWORD) {
    return res.sendStatus(200);
  }

  return res.sendStatus(401);
});

/* 🚀 UPLOAD */
app.post("/upload", upload.array("fotos"), async (req, res) => {
  try {
    const senha = req.headers["x-admin-password"];

    if (senha !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    const { evento } = req.body;

    if (!evento) {
      return res.status(400).json({ error: "Evento obrigatório" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Sem fotos" });
    }

    // 🔥 PADRONIZA NOME DO EVENTO
    const eventoSeguro = evento
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "-");

    const urls = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: eventoSeguro },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      urls.push(result.secure_url);

      await Foto.create({
        evento: eventoSeguro,
        url: result.secure_url,
      });
    }

    res.json({ success: true, fotos: urls });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no upload" });
  }
});

/* 📸 BUSCAR EVENTO (CORRIGIDO) */
app.get("/evento/:codigo", async (req, res) => {
  try {
    const codigo = req.params.codigo
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "-");

    const fotos = await Foto.find({ evento: codigo });

    res.json({
      fotos: fotos.map(f => f.url),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar fotos" });
  }
});

/* 🚀 START */
app.listen(10000, () => {
  console.log("Servidor rodando na porta 10000");
});