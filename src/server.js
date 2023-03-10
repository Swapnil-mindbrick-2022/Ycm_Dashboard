const express = require("express");
const app = express();
const db = require("./models");
const path = require('path');
const session = require('express-session')
const initRoutes = require("./routes/user.js");
global.__basedir = __dirname + "/..";
const  bodyParser = require('body-parser');
app.use(bodyParser.json());
const passport = require('passport')
const {initializingPassport} = require('./config/passportConfig')
// const compression = require('compression')
app.use(bodyParser.json({limit:'2500mb'}))
app.use(bodyParser.urlencoded({ limit:'2500mb',extended: true }));


// app.use(bodyParser.json({limit: "2500mb"}));
// app.use(bodyParser.urlencoded({limit: "2500mb", extended: true, parameterLimit:25000000}));
app.set('views', path.join(__dirname, 'views'));



const MemoryStore = require('memorystore')(session)


const userauth=require('./middlewares/Auth/userauth')

const cors = require('cors');

app.set('view engine', 'ejs');	
// app.use(express.urlencoded({ extended: true }));
//for session --------------------
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
}));

app.use(cors({
  origin:'%'
}))

// app.use( compression({
//   level:6,
//   threshold:10*1000,
//   filter:(req,res)=>{
//     if(req.headers['x-no-compression']){
//       return false 
//     }
//     return compression.filter(req,res)
//   }
// }))

// app.use(require('express-formidable')());


initializingPassport(passport);
app.use( passport.initialize());
app.use(passport.session());

app.get("/data",userauth, function (req, res) {
  res.render(path.join(__dirname, "./views/index.ejs"));
});
// app.get("/register", function (req, res) {
//   res.render(path.join(__dirname, "./views/register.ejs"));
// });




initRoutes(app);
db.sequelize.sync();
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });
const PORT = process.env.PORT || 3001;
const baseurl = "https://iding.herokuapp.com/"
app.listen(PORT, function () {
  console.log('Server is started on http://127.0.0.1:'+baseurl+PORT);
});

