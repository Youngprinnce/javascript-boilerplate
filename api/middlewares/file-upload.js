const fs = require("fs");
const sharp = require("sharp");
const multer = require('multer');
const {BadRequest} = require("../../utils/api-errors");

const fileSize = 15000000;
const MIME_TYPE_MAP = {'image/png': 'png', 'image/jpeg': 'jpeg', 'image/jpg': 'jpg'};

exports.fileUpload = ({name, maxCount = 1}) => (req, res, next) => {
  multer({
    limits: {fileSize},
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const userId = req.params?.userId || req.authUser;
        const dir = `public/uploads/images/${userId}`;
        const exist = fs.existsSync(dir);
        if (!exist) return fs.mkdir(dir, error => cb(error, dir));
        return cb(null, dir)
      },
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      }
    }),
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : next(new BadRequest('Wrong file type selection, we only accept JPEG, JPG, and/or PNG files.'));
      cb(error, isValid);
    }
  }).array(`${name}`, maxCount)(req, res, async err => {
    const {files} = req;
    if (err) {
      const {code, field, message} = err;
      const errorMessages = {
        LIMIT_FILE_COUNT: `You can't attach more than ${maxCount} file for ${field}`,
        LIMIT_FILE_SIZE: `File too large, the expected size limit is ${fileSize / 1000000}mb`,
        LIMIT_UNEXPECTED_FILE: `You have entered a wrong field, should be '${name}', not ${field}.`,
      }
      console.log({err});
      err = errorMessages[code] || message;
      return next(new BadRequest(err));
    }

    // compress images with sharp
    try {
      for (const [i, {path, mimetype}] of files.entries()) {
        const config = {png: {compressionLevel: 5, quality: 30}, jpeg: {quality: 30}};
        const format = {'image/png': 'png', 'image/jpeg': 'jpeg', 'image/jpg': 'jpeg'}[mimetype];

        const result = await sharp(await sharp(path)[format](config[format]).toBuffer()).toFile(path);
        files[i].size = result.size;
      }
    } catch (err) {
      console.log({err});
    }

    return next();
  })
};
