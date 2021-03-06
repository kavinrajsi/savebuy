const express = require('express');
const app = express();
const db = require('./connection');
const fs = require('fs');
const mysql = require('mysql2');

const pool = mysql.createPool({
	host: 'dbaas-db-8004689-do-user-10483948-0.b.db.ondigitalocean.com',
	user: 'doadmin',
	password: 'i50aGYLaGtijZLDZ',
	database: 'savebuy',
	port: 25060,
	dialect: 'mysql',
	logging: true,
	force: true,
	rejectUnauthorized: true,
	ssl: {
		ca: fs.readFileSync('./ca-certificate.crt'),
	},
});

const router = require('express').Router();

// Create customer master
router.get('/create-customer', (req, res) => {
	let sql =
		'CREATE TABLE IF NOT EXISTS `savebuy`.`customer` ( `id` INT(11) NOT NULL AUTO_INCREMENT , `customerid` VARCHAR(25) NOT NULL , `headname` VARCHAR(255) NOT NULL , `mobilenumber` VARCHAR(12) NOT NULL , `location` VARCHAR(255) NOT NULL, `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (`id`, `mobilenumber`), INDEX(`customerid`, `headname`, `mobilenumber`, `location`)) ENGINE = InnoDB';
	pool.query(sql, (err, result) => {
		if (err) throw err;
		console.log(result);
		res.render('404', {
			result: `<div class="alert alert-info" role="alert"><div class="d-flex align-items-center"><i class="bi bi-check-circle-fill me-2"></i> Customer table was created</div></div><br><code>${sql}</code>`,
		});
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});

// Create group master
router.get('/create-customer-group', (req, res) => {
	let sql =
		'CREATE TABLE IF NOT EXISTS `savebuy`.`customer_group` ( `id` INT(11) NOT NULL AUTO_INCREMENT , `customercode` VARCHAR(255) NOT NULL , `groupno` VARCHAR(255) NOT NULL , `customername` VARCHAR(255) NOT NULL , `joindate` DATE NOT NULL , `status` VARCHAR(4) NOT NULL , `commitdate` DATE NULL , `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (`id`),  UNIQUE (`customercode`, `groupno`, `customername`), INDEX(`id`, `customercode`, `groupno`, `customername`, `joindate`, `created_at`)) ENGINE = InnoDB';
	pool.query(sql, (err, result) => {
		if (err) throw err;
		console.log(result);
		res.render('404', {
			result: `<div class="alert alert-info" role="alert"><div class="d-flex align-items-center"><i class="bi bi-check-circle-fill me-2"></i> Customer group table was created</div></div><br><code>${sql}</code>`,
		});
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});

// Create customer transaction
router.get('/create-customer-transaction', (req, res) => {
	let sql =
		'CREATE TABLE IF NOT EXISTS `savebuy`.`customer_transaction` ( `id` INT NOT NULL AUTO_INCREMENT , `receiptnumber` VARCHAR(255) NOT NULL , `groupnumber` VARCHAR(255) NOT NULL , `receiptdate` DATE NOT NULL , `formonth` VARCHAR(10) NOT NULL , `paidtype` VARCHAR(255) NOT NULL , `cashier` VARCHAR(255) NOT NULL , `paidamount` INT(12) NOT NULL ,  `term` INT(12) NOT NULL , `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (`id`, `formonth`,`term`),  UNIQUE (`groupnumber`, `term`, `formonth`)) ENGINE = InnoDB';
	pool.query(sql, (err, result) => {
		if (err) throw err;
		console.log(result);
		res.render('404', {
			result: `<div class="alert alert-info" role="alert"><div class="d-flex align-items-center"><i class="bi bi-check-circle-fill me-2"></i> Customer transaction table was created</div></div><br><code>${sql}</code>`,
		});
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});

// drop customer master
router.get('/drop-customer', (req, res) => {
	let sql = 'DROP TABLE `customer`';
	pool.query(sql, (err, result) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
		} else {
			console.log(`Query was successful, ${result}`);
			res.render('404', {
				result: 'Customer table was dropped',
			});
		}
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});

// drop customer group
router.get('/drop-customer-group', (req, res) => {
	let sql = 'DROP TABLE `customer_group`';
	pool.query(sql, (err, result) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
		} else {
			console.log(`Query was successful, ${result}`);
			res.render('404', {
				result: 'Customer Group table was dropped',
			});
		}
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});

// drop customer transaction
router.get('/drop-customer-transaction', (req, res) => {
	let sql = 'DROP TABLE `customer_transaction`';
	pool.query(sql, (err, result) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
		} else {
			console.log(`Query was successful, ${result}`);
			res.render('404', {
				result: 'Customer transaction table was dropped',
			});
		}
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});

/*
// import customer
router.get('/import-customer', (req, res) => {
	let sql = `INSERT INTO customer (customerid, headname, mobilenumber, location) VALUES
    `;
	pool.query(sql, (err, result) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
		} else {
			console.log(`Query was successful, ${result}`);
			res.json(result);
		}
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});
*/

/*
// import customer group
router.get('/import-customer-group', (req, res) => {
	let sql = `INSERT INTO customer_group (customercode, groupno, customername, joindate, status, commitdate) VALUES
    `;
	pool.query(sql, (err, result) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
		} else {
			console.log(`Query was successful, ${result}`);
			res.json(result);
		}
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});
*/

/*
// import customer transaction
router.get('/import-customer-transaction', (req, res) => {
	let sql = `INSERT INTO customer_transaction (receiptnumber, receiptdate, groupnumber, paidtype, paidamount, formonth, term, cashier) VALUES
    `;
	pool.query(sql, (err, result) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
		} else {
			console.log(`Query was successful, ${result}`);
			res.json(result);
		}
		//destroy the connection thread
		pool.releaseConnection(db);
	});
});
*/

// Get customer data
router.get('/get-customer', (req, res) => {
	let sql = 'SELECT * FROM customer ORDER BY id DESC';
	let query = pool.query(sql, (err, result, fields) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
			//destroy the connection thread
			pool.releaseConnection(db);
		} else {
			// console.log(result);
			console.log(`Query was successful`);
			res.json(result);
			//destroy the connection thread
			pool.releaseConnection(db);
		}
	});
});

// Get customer group data
router.get('/get-customer-group', (req, res) => {
	let sql = 'SELECT * FROM customer_group ORDER BY created_at DESC LIMIT 100';
	let query = pool.query(sql, (err, result, fields) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
			//destroy the connection thread
			pool.releaseConnection(db);
		} else {
			// console.log(result);
			console.log(`Query was successful`);
			res.json(result);
			//destroy the connection thread
			pool.releaseConnection(db);
		}
	});
});

// Get customer transaction data
router.get('/get-customer-transaction', (req, res) => {
	let sql = `SELECT * FROM customer_transaction WHERE cashier = '0' ORDER BY id DESC LIMIT 50`;
	let query = pool.query(sql, (err, result, fields) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
			//destroy the connection thread
			pool.releaseConnection(db);
		} else {
			// console.log(result);
			// console.log(`Query was successful, ${result}`);
			// res.render('404', {
			// 	result,
			// });
			res.json(result);
			//destroy the connection thread
			pool.releaseConnection(db);
		}
	});
});


// Get customer transaction data
router.get('/tryMe', (req, res) => {
	let sql = `DELETE FROM customer_transaction WHERE receiptnumber = 1291296`;
	let query = pool.query(sql, (err, result, fields) => {
		if (err) {
			// If an error occurred, send a generic server failure
			console.log(`not successful! ${err}`);
			res.render('404', {
				err,
			});
			//destroy the connection thread
			pool.releaseConnection(db);
		} else {
			// console.log(result);
			// console.log(`Query was successful, ${result}`);
			// res.render('404', {
			// 	result,
			// });
			res.json(result);
			//destroy the connection thread
			pool.releaseConnection(db);
		}
	});
});


module.exports = router;
