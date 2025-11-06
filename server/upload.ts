import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { randomBytes } from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos"));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Gerar nome único para o arquivo
    const randomSuffix = randomBytes(8).toString("hex");
    const fileExtension = req.file.originalname.split(".").pop();
    const fileName = `feedback-${Date.now()}-${randomSuffix}.${fileExtension}`;
    const fileKey = `feedbacks/${fileName}`;

    // Upload para S3
    const { url } = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url, key: fileKey });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao fazer upload da imagem" });
  }
});
