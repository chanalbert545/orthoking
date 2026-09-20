import multer from "multer";
import sharp from "sharp";

const maxProductImageBytes = 500 * 1000;

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images and videos
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

export const uploadSingle = upload.single("file");
export const uploadMultiple = upload.array("files", 10);

export async function compressProductImage(req, res, next) {
  try {
    if (!req.file || !req.file.mimetype.startsWith("image/") || req.file.size <= maxProductImageBytes) {
      return next();
    }

    const dimensions = [2400, 2000, 1600, 1400, 1200, 1000, 800];
    const qualities = [82, 76, 70, 64, 58, 52, 46, 40, 34];
    let compressedBuffer;

    for (const dimension of dimensions) {
      for (const quality of qualities) {
        compressedBuffer = await sharp(req.file.buffer)
          .rotate()
          .resize({
            width: dimension,
            height: dimension,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality, effort: 4 })
          .toBuffer();

        if (compressedBuffer.length < maxProductImageBytes) break;
      }
      if (compressedBuffer.length < maxProductImageBytes) break;
    }

    if (!compressedBuffer || compressedBuffer.length >= maxProductImageBytes) {
      return res.status(400).json({ error: "Image could not be compressed below 0.5 MB" });
    }

    const originalName = req.file.originalname.replace(/\.[^.]+$/, "");
    req.file.buffer = compressedBuffer;
    req.file.mimetype = "image/webp";
    req.file.originalname = `${originalName}.webp`;
    req.file.size = compressedBuffer.length;
    next();
  } catch (error) {
    next(error);
  }
}
