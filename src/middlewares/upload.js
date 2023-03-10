const multer = require("multer");


// const maxSize = 50 * 1024 * 1024;

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("xlsx " ) ||
    file.mimetype.includes("spreadsheetml")||
    file.mimetype.includes('csv' )
  ) {
    let path =
      __basedir + "/resources/static/assets/uploads/"
    cb(null, path);
  } else {
    cb("Please upload only excel file.", false);
  }
};
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/static/assets/uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, `${Date.now()}-mindbrick-${file.originalname}`);
  },
});
let uploadFile = multer({ storage: storage, fileFilter: excelFilter, limits: { fileSize: 10000000 * 100 } });



module.exports = uploadFile;