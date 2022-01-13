const mysql = require('mysql2');
const fs = require('fs');

// Create connection
const db = mysql.createConnection({
  host: "dbaas-db-8004689-do-user-10483948-0.b.db.ondigitalocean.com",
  user: "doadmin",
  password: "i50aGYLaGtijZLDZ",
  database: 'savebuy',
  port: 25060, dialect: 'mysql',
//  connectionLimit: 6,
  logging: true,
  force: true,
  rejectUnauthorized: true,
  ssl: {  ca: fs.readFileSync('/var/www/html/ca-certificate.crt'), }

});

// Connect
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('mysql connected');
});

module.exports = db;
