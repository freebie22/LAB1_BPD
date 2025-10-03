const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const charToBits = (ch) =>
  ch.charCodeAt(0).toString(2).padStart(8, "0").split("").map(Number);
const bitsToChar = (bits) => String.fromCharCode(parseInt(bits.join(""), 2));

const hammingEncodeByte = (dataBits) => {
  let encoded = Array(12).fill(0);
  let j = 0;
  for (let i = 1; i <= 12; i++)
    if (![1, 2, 4, 8].includes(i)) encoded[i - 1] = dataBits[j++];
  const check = (pos) => {
    let sum = 0;
    for (let i = 1; i <= 12; i++) if (i & pos) sum ^= encoded[i - 1];
    return sum;
  };
  encoded[0] = check(1);
  encoded[1] = check(2);
  encoded[3] = check(4);
  encoded[7] = check(8);
  return encoded;
};

const hammingDecodeByte = (encoded) => {
  const check = (pos) => {
    let sum = 0;
    for (let i = 1; i <= 12; i++) if (i & pos) sum ^= encoded[i - 1];
    return sum;
  };
  let syndrome = check(1) * 1 + check(2) * 2 + check(4) * 4 + check(8) * 8;
  if (syndrome !== 0 && syndrome <= 12) encoded[syndrome - 1] ^= 1;
  let dataBits = [];
  for (let i = 1; i <= 12; i++)
    if (![1, 2, 4, 8].includes(i)) dataBits.push(encoded[i - 1]);
  return dataBits;
};

router.post("/parseFile", upload.single("hammingFile"), (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ status: false, message: "File missing" });

    const text = req.file.buffer.toString("utf-8");
    const mode = req.body.mode || "noError";
    const N1 = 2,
      N2 = 5;
    let encodedBlocks = text
      .split("")
      .map((ch) => hammingEncodeByte(charToBits(ch)));

    if (encodedBlocks.length > 0) {
      if (mode === "oneError") encodedBlocks[0][N1 - 1] ^= 1;
      else if (mode === "twoErrors") {
        encodedBlocks[0][N1 - 1] ^= 1;
        encodedBlocks[0][N2 - 1] ^= 1;
      }
    }

    let decoded = "";
    for (let block of encodedBlocks) {
      let bits = hammingDecodeByte(block);
      decoded += bitsToChar(bits);
    }

    res.status(200).json({
      status: true,
      original: text,
      decoded,
      mode,
      note:
        mode === "twoErrors"
          ? "Два біти в одному блоці, текст не може бути відновлений повністю"
          : mode === "oneError"
          ? "Одна помилка, текст відновлений"
          : "Без помилок",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
