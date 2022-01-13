const express = require('express');
const app = express();
const moment = require('moment');
const connection = require('../../lib/connection');
const crypto = require('crypto');
const id = crypto.randomBytes(8).toString('hex');

const fs = require('fs');
const mysql = require('mysql2');
const { post } = require('../routes/users');
const { equal } = require('assert');

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

// display login page for index
exports.home = (req, res) => {
	res.render('index');
};
exports.faq = (req, res) => {
	res.render('faq');
};

let loggedin = false;
// login as per the User
exports.loginAuth = (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		let sql = `SELECT * FROM customer WHERE customerid = ? AND mobilenumber = ?`;
		pool.query(sql, [username, password], function (err, rows, fields) {
			if (err) {
				// If an error occurred, send a generic server failure
				console.log(`not successful! ${err}`);
				res.render('404', {
					err,
				});
				//destroy the connection thread
				connection.destroy();
			}
			if (rows.length > 0) {
				req.session.loggedin = true;
				req.session.name = username;
				loggedin = true;
				res.redirect('/account');
				connection.destroy();
			} else {
				res.redirect('/login');
			}
		});
	} else {
		res.send('Please enter Username and Password!');
	}
};

// View user group as per the User
exports.userDetail = (req, res) => {
	if (req.session.loggedin) {
		let userchitGroups = {};
		let userchitGroup = {};

		var o = {}; // empty Object
		o = []; // empty Array, which you can push() values into

		let userName = req.session.name;
		console.log(userName);
		let sql1 = `SELECT *  FROM customer_group WHERE customercode = ? ORDER BY joindate DESC`;
		pool.query(sql1, [userName], function (err, rows, fields) {
			if (err) throw err;
			if (rows.length > 0) {
				rows.forEach(function (element) {
					let todaysDate = new Date();
					let date2 = element.joindate;
					let DifferenceIntime = todaysDate.getTime() - date2.getTime();
					let DifferenceIntdays = DifferenceIntime / (1000 * 3600 * 24);
					if (DifferenceIntdays >= 180) {
						userchitGroup = false;
					} else {
						userchitGroup = true;
					}

					let data = {
						customercod: element.customercod,
						groupno: element.groupno,
						customername: element.customername,
						joindate: element.joindate,
						commitdate: element.commitdate,
						tenure: userchitGroup,
					};
					o.push(data);
				});
				// console.log(o);
				res.render('account', {
					o,
					loggedin,
				});
			}
			connection.destroy();
			console.log(err);
			console.log(rows);
			// console.log(fields);
			console.log(sql1);
		});
	} else {
		res.redirect('/login');
	}
};

// View user transaction as per the group
exports.userTransaction = (req, res) => {
	let sql2 = `SELECT *  FROM customer_transaction WHERE groupnumber = ? ORDER BY receiptdate DESC `;
	pool.query(sql2, [req.params.id], function (err, rowstrans, fields) {
		if (err) throw err;
		if (rowstrans.length > 0) {
			res.render('view-transaction', {
				rowstrans,
				loggedin,
			});
		}
		connection.destroy();
	});
};

//pre payment page
exports.userPayment = (req, res) => {
	let sql2 = `SELECT *  FROM customer_transaction WHERE groupnumber = ? ORDER BY receiptdate DESC LIMIT 1`;
	pool.query(sql2, [req.params.id], function (err, rowstrans, fields) {
		if (err) throw err;
		let orderID = 'SS' + id;
		// TODO: need to add order amount
		let ordernote = '';
		let newterm = '';
		let newmonth = '';
		let userName = '';
		let amount = '';
		if (!req.session.name) {
			userName = 'sundarisilks';
		} else {
			userName = req.session.name;
		}
		let customeremail = 'kavinrajsi01@gmail.com';
		// TODO: need to load from customer table
		let customerPhone = '9442663215';

		if (rowstrans.length > 0) {
			newterm = rowstrans[0].term;
			newterm++;

			newmonth = moment(rowstrans[0].receiptdate).format('MM');
			newmonth++;

			amount = '1000';

			ordernote = req.params.id;

			var o = {};
			o = [];

			let data = {
				orderid: orderID,
				ordernote: ordernote,
				customername: userName,
				customeremail: customeremail,
				customerphone: customerPhone,
				ordermonth: newmonth,
				orderterm: newterm,
				orderamount: amount,
			};

			o.push(data);
			res.render('payment', {
				o,
				loggedin,
			});
		}
		connection.destroy();
	});
};

exports.paymentRequest = (req, res) => {
	// console.log(req.body);
	var postData = {
			appId: req.body.appId,
			orderId: req.body.orderId,
			orderAmount: req.body.orderAmount,
			orderCurrency: req.body.orderCurrency,
			orderNote: req.body.orderNote,
			customerName: req.body.customerName,
			customerEmail: req.body.customerEmail,
			customerPhone: req.body.customerPhone,
			returnUrl: req.body.returnUrl,
			notifyUrl: req.body.notifyUrl,
		},
		mode = 'TEST',
		// secretKey = "be9ce1303c0e07b8fc0f39dc963c49ac779ceb3e",
		secretKey = 'af864ab7e6febcc08f797f103d3adb79707fd9b7',
		sortedkeys = Object.keys(postData),
		url = '',
		signatureData = '';
	sortedkeys.sort();
	for (var i = 0; i < sortedkeys.length; i++) {
		k = sortedkeys[i];
		signatureData += k + postData[k];
	}
	var signature = crypto
		.createHmac('sha256', secretKey)
		.update(signatureData)
		.digest('base64');
	postData['signature'] = signature;
	if (mode == 'PROD') {
		url = 'https://www.cashfree.com/checkout/post/submit';
	} else {
		url = 'https://test.cashfree.com/billpay/checkout/post/submit';
	}
	let adasd = JSON.stringify(postData);
	console.log(JSON.stringify(postData));
	// console.log(postData);
	console.log(res.statusCode);
	res.render('request', {
		adasd,
		url: url,
	});

	connection.destroy();
};

// response
exports.paymentResponse = (req, res) => {
	console.log('paymentResponse');
	console.log(res.statusCode);
	var postData = {
		orderId: req.body.ordernote,
		orderAmount: req.body.orderAmount,
		referenceId: req.body.referenceId,
		txStatus: req.body.txStatus,
		paymentMode: req.body.paymentMode,
		txMsg: req.body.txMsg,
		txTime: req.body.txTime,
	};
	// secretKey = "be9ce1303c0e07b8fc0f39dc963c49ac779ceb3e",
	var secretKey = 'af864ab7e6febcc08f797f103d3adb79707fd9b7',
		signatureData = '';
	for (var key in postData) {
		signatureData += postData[key];
	}
	var computedsignature = crypto
		.createHmac('sha256', secretKey)
		.update(signatureData)
		.digest('base64');
	postData['signature'] = req.body.signature;
	postData['computedsignature'] = computedsignature;

	console.log('strring : ' + JSON.stringify(postData));
	console.log('signdata : ' + signatureData);
	res.json(postData);

	let sql2 = `INSERT INTO customer_transaction  SET receiptnumber = ?, groupnumber = ?, receiptdate = ?, formonth = ?, paidtype = ?, cashier = ?, term = ?`;
	console.log(sql2);

	pool.query(
		sql2,
		[
			req.body.referenceId,
			req.body.orderId,
			req.body.txTime,
			13,
			req.body.paymentMode,
			00,
			13,
		],
		function (err, rowstrans, fields) {
			console.log('err : ' + err);
			console.log('rowstrans : ' + rowstrans);
			if (err) throw err;
			if (rowstrans.length > 0) {
				console.log('postaData : ' + postData);
				console.log('postaDataString : ' + JSON.stringify(postData));
				res.render('success');
			}
			connection.destroy();
		}
	);
};

// response
exports.success = (req, res) => {
	console.log('success');
	console.log(res.statusCode);
	var postData = {
		orderId: req.body.ordernote,
		orderAmount: req.body.orderAmount,
		referenceId: req.body.referenceId,
		txStatus: req.body.txStatus,
		paymentMode: req.body.paymentMode,
		txMsg: req.body.txMsg,
		txTime: req.body.txTime,
	};
	// secretKey = "be9ce1303c0e07b8fc0f39dc963c49ac779ceb3e",
	var secretKey = 'af864ab7e6febcc08f797f103d3adb79707fd9b7',
		signatureData = '';
	for (var key in postData) {
		signatureData += postData[key];
	}
	var computedsignature = crypto
		.createHmac('sha256', secretKey)
		.update(signatureData)
		.digest('base64');
	postData['signature'] = req.body.signature;
	postData['computedsignature'] = computedsignature;

	console.log('strring : ' + JSON.stringify(postData));
	console.log('signdata : ' + signatureData);
	res.json(postData);
	// res.render('success', {
	// 	});
};

// Get customer transaction data
exports.getCustomerTransaction = (req, res) => {
	let sql = `SELECT * FROM customer_transaction WHERE receiptdate = '${req.body.date}T00:00:00.000Z' AND cashier = '0' ORDER BY id DESC`;
	console.log(sql);
	let query = pool.query(sql, (err, result, fields) => {
		console.log(result);
		if (err) {
			// If an error occurred, send a generic server failure
			// console.log(`not successful! ${err}`);
			// res.render('404', {
			// 	err,
			// });
			res.json(err);
		} else {
			// console.log(`Query was successful, ${result}`);
			// res.render('404', {
			// 	result,
			// });
			res.json(result);
		}
		connection.destroy();
	});
};

// insert customer data
exports.insertCustomer = (req, res) => {
	// console.log(req.body);
	const post = {
		customerid: req.body.customerid,
		headname: req.body.headname,
		mobilenumber: req.body.mobilenumber,
		location: req.body.location,
	};
	// let sql = `INSERT IGNORE INTO customer SET ?`;
	let sql = `SELECT * FROM customer WHERE customerid = '${req.body.customerid}' AND headname = '${req.body.headname}' AND mobilenumber = '${req.body.mobilenumber}' `;
	let query = pool.query(sql, post, (err, result, fields) => {
		if (err) {
			console.log(err);
			res.json(err);
		} else {
			console.log(result.length);
			if (result.length == 0) {
				let sqls = `INSERT IGNORE INTO customer SET ?`;
				let querys = pool.query(sqls, post, (errs, results) => {
					if (err) throw err;
					let data = {
						recordid: results.insertId,
						recordadd: results.affectedRows,
						recordstatus: results.serverStatus,
					};
					res.end(JSON.stringify(data));
				});
			} else {
				res.end(
					'We already have ' + result.length + ' number of record in the system'
				);
			}
		}
		connection.destroy();
	});
};

// insert customer master
exports.insertCustomerGroup = (req, res) => {
	console.log(typeof req.body.commitdate);
	let checkNull = '';
	if (req.body.commitdate == '') {
		checkNull = null;
	}
	const post = {
		customercode: req.body.customercode,
		groupno: req.body.groupno,
		customername: req.body.customername,
		joindate: req.body.joindate,
		status: req.body.status,
		commitdate: checkNull,
	};

	// let sql = `INSERT IGNORE INTO customer_group SET ?`;
	let sql = `SELECT * FROM customer_group WHERE customercode = '${req.body.customercode}' AND groupno = '${req.body.groupno}' AND customername = '${req.body.customername}' AND joindate = '${req.body.joindate}'`;
	let query = pool.query(sql, post, (err, result, fields) => {
		if (err) {
			console.log(err);
			res.json(err);
		} else {
			console.log(result.length);
			if (result.length == 0) {
				let sqls = `INSERT IGNORE INTO customer_group SET ?`;
				let querys = pool.query(sqls, post, (errs, results) => {
					if (err) throw err;
					let data = {
						recordid: results.insertId,
						recordadd: results.affectedRows,
						recordstatus: results.serverStatus,
					};
					res.end(JSON.stringify(data));
				});
			} else {
				res.end(
					'We already have ' + result.length + ' number of record in the system'
				);
			}
		}
		connection.destroy();
	});
	// let query = pool.query(sql, post, (err, result, fields) => {
	// 	if (err) {
	// 		// If an error occurred, send a generic server failure
	// 		// console.log(`not successful! ${err}`);
	// 		// res.render('404', {
	// 		// 	err,
	// 		// });
	// 		res.json(err);
	// 	} else {
	// 		// console.log(result);
	// 		res.end(JSON.stringify(result));
	// 	}
	// 	connection.destroy();
	// });
};

// insert customer transaction
exports.insertCustomerTransaction = (req, res) => {
	const post = {
		receiptnumber: req.body.receiptnumber,
		groupnumber: req.body.groupnumber,
		receiptdate: req.body.receiptdate,
		formonth: req.body.formonth,
		paidtype: req.body.paidtype,
		cashier: req.body.cashier,
		term: req.body.term,
	};
	console.log(post);

	let sql = `INSERT IGNORE INTO customer_transaction SET ?`;
	let query = pool.query(sql, post, (err, result, fields) => {
		if (err) {
			// If an error occurred, send a generic server failure
			// console.log(`not successful! ${err}`);
			// res.render('404', {
			// 	err,
			// });
			res.json(err);
		} else {
			// console.log(result);
			res.end(JSON.stringify(result));
		}
		connection.destroy();
	});
};

// models.Post.create(post)
// 	.then((result) => {
// 		res.status(201).json({
// 			message: 'Customer inserted success',
// 			post: result,
// 		});
// 	})
// 	.catch((error) => {
// 		res.status(500).json({
// 			message: 'Something wrong',
// 			error: error,
// 		});
// 	});

// logout
exports.userLogout = (req, res) => {
	req.session.destroy();
	res.redirect('/');
};
