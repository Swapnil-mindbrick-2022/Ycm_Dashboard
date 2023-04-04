const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  logging: false,
   retry: {
    max: dbConfig. retry.max,
    min: dbConfig. retry.min,
    acquire: dbConfig. retry.acquire,
    idle: dbConfig. retry.idle,
    max_allowed_packet: dbConfig. retry.max_allowed_packet,
    backoffBase:dbConfig. retry.backoffBase,
    backoffExponent:dbConfig. retry.backoffExponent
  }
});

sequelize.authenticate()
.then(() => {
    console.log('connected..')  
})
.catch(err => {
    console.log('Error'+ err)
})

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users=require("./user.model.js")(sequelize, Sequelize)
db.fileddata= require('./PD_data')(sequelize,Sequelize) // 
db.resultdata= require('./result.model.js')(sequelize,Sequelize) 
db.uploadhistory=require("./uploadhistory.model.js")(sequelize, Sequelize)
db.Trenddata=require('./trend.model.js')(sequelize, Sequelize)


db.sequelize.sync({ force: false })
.then(() => {
    console.log('yes re-sync done!')
})


// db.resultdata.hasMany(db.fileddata, { foreignKey: ['Mandal Name'] });
// db.fileddata.belongsTo(db.resultdata, { foreignKey: ['Mandal Name'] });


module.exports = db;

