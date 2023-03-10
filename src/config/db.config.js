module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "password123",
    DB: "ycmdata",
    dialect: "mysql",
    port:"3306",
    retry: {
      max: 2000,
      min: 0,
      acquire: 3000000,
      idle: 1000000,
      max_allowed_packet:196777216,
      match: [/Deadlock/i],
      
      backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
      backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
    }
  };

//  for connectimg MYSQL databse of PHP MYadmin of godady domain
// module.exports = {
//   HOST: "68.178.228.104",
//   USER: "swapnil12",
//   PASSWORD: "swapnil12",
//   DB: "idingdata",
//   dialect: "mysql",
//  retry: {
//   max: 2000,
//   min: 0,
//   acquire: 3000000,
//   idle: 1000000,
//   max_allowed_packet:196777216,
//   match: [/Deadlock/i],
  
//   backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
//   backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
// }
// };

//  for connectimg data base to AWS RDS 
// module.exports = {
//   HOST: "idingdb-1.ckvsrkgfxdhv.ap-south-1.rds.amazonaws.com",
//   USER: "swapnil",
//   PASSWORD: "kcjBpPGqkK6xntwct8F0",
//   DB: "idingdata",
//   dialect: "mysql",
//   port:"3306",
//   retry: {
//     max: 2000,
//     min: 0,
//     acquire: 3000000,
//     idle: 1000000,
//     max_allowed_packet:196777216,
//     match: [/Deadlock/i],
    
//     backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
//     backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
//   }
// };



// module.exports = {
//   HOST: "103.163.204.118",
//   USER: "root",
//   PASSWORD: "#$yf54>(&FCD^&",
//   DB: "idingdata",
//   dialect: "mysql",
//   port:"3306",
//   retry: {
//     max: 2000,
//     min: 0,
//     acquire: 3000000,
//     idle: 1000000,
//     max_allowed_packet:196777216,
//     match: [/Deadlock/i],
    
//     backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
//     backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
//   }
// };

