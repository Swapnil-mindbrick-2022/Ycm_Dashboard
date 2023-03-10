const Sequelize = require("sequelize");
module.exports = (sequelize, Sequelize) => {
  const user = sequelize.define("userdata",{
    id:{
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
   
    fullname: {
      type: Sequelize.STRING,
      required: true
    },
    username: {
      type: Sequelize.STRING,
      required: true
    },
    dob: {
      type: Sequelize.DATE,
      required: true
    },
   
    password:{
      type: Sequelize.STRING,
      required: true

    }
  })
  return user;

};