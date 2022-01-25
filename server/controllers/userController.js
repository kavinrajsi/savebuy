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
const e = require('express');
const { text } = require('body-parser');

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

let loggedStatus = false;
let customerSessionid = '';
let customerName = '';
let customerId = '';
let customerNumber = '';
let message = '';

// login as per the User
exports.loginAuth = (req, res) => {
	customerId = req.body.username;
	customerNumber = req.body.password;
	if (customerId && customerNumber) {
		let sql = `SELECT * FROM customer WHERE customerid = ? AND mobilenumber = ?`;
		pool.query(sql, [customerId, customerNumber], function (err, rows) {
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
				req.session.loggedStatus = true;
				req.session.customerId = rows[0].customerid;
				req.session.customerName = rows[0].headname;
				res.redirect('/account');
				connection.destroy();
			} else {
				if (err !== ' ') {
					message = 'Username and password is not matching';
				}
				res.render('index', {
					message: message,
				});
			}
		});
	} else {
		message = 'Username and password is not matching';
		res.render('index', {
			message: message,
		});
	}
};

// View user group as per the User
exports.userDetail = (req, res) => {
	if (req.session.id) {
		let paynow;
		let closed;
		let adjusted;

		var customerGroupdata = {}; // empty Object
		customerGroupdata = []; // empty Array, which you can push() values into

		let sql = `SELECT *  FROM customer_group WHERE customercode = ? ORDER BY joindate DESC`;
		pool.query(sql, [req.session.customerId], function (err, rows, fields) {
			if (err) throw err;
			if (rows.length > 0) {
				rows.forEach(function (element) {
					if (element.status == 'N') {
						paynow = true;
						closed = false;
						adjusted = false;
					} else if (element.status == 'A') {
						paynow = false;
						closed = false;
						adjusted = true;
					} else if (element.status == 'C') {
						paynow = false;
						closed = true;
						adjusted = false;
					} else {
						paynow = false;
						closed = false;
						adjusted = false;
					}

					let data = {
						customercod: element.customercode,
						groupno: element.groupno,
						customername: element.customername,
						joindate: element.joindate,
						commitdate: element.commitdate,
						paynow: paynow,
						closed: closed,
						adjusted: adjusted,
					};
					customerGroupdata.push(data);
				});
				console.log(customerGroupdata);
				res.render('account', {
					customerGroupdata,
					loggedStatus,
				});
			} else {
				message = 'Sorry, customer group no is not in online system';
				res.render('index', {
					message: message,
				});
			}
			connection.destroy();
		});
	} else {
		message = 'Kindly check with cookie and session';
		res.render('index', {
			message: message,
		});
	}
};

// View user transaction as per the group
exports.userTransaction = (req, res) => {
	let checme = [];
	if (req.session.loggedStatus) {
		let sql1 = `SELECT *  FROM customer_group WHERE customercode = ? ORDER BY joindate DESC`;
		pool.query(sql1, [req.session.customerId], function (err, rows, fields) {
			if (err) throw err;
			console.log(rows.length);
			if (rows.length > 0) {
				rows.forEach(function (element) {
					checme.push(element.groupno);
				});
				console.log(checme);

				let sql2 = `SELECT *  FROM customer_transaction WHERE groupnumber = ? ORDER BY receiptdate DESC `;
				if (checme.includes(req.params.id)) {
					pool.query(sql2, [req.params.id], function (err, rowstrans, fields) {
						if (err) throw err;
						if (rowstrans.length > 0) {
							res.render('view-transaction', {
								rowstrans,
								loggedStatus,
							});
						}
					});
				} else {
					message = 'Kindly check your group number';
					res.render('index', {
						message: message,
					});
				}
			} else {
				message = 'Sorry, customer group no is not in online system';
				res.render('index', {
					message: message,
				});
			}
		});
		connection.destroy();
	} else {
		message = 'Error with Session, Kindly login again';
		res.render('index', {
			message: message,
		});
	}
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
		let newDate = '';
		let newmonth = '';
		let userName = '';
		let amount = '';
		if (!req.session.customerName) {
			userName = 'sundarisilks';
		} else {
			userName = req.session.customerName;
		}
		let customeremail = 'kavinrajsi01@gmail.com';
		// TODO: need to load from customer table
		let customerPhone = customerNumber;

		if (rowstrans.length > 0) {
			newterm = rowstrans[0].term;
			newterm++;
			// moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

			newmonth = moment().format('MM');
			newDate = moment().format('DD - MM - YYYY');
			console.log(newmonth);
			console.log(newDate);
			ordernote = req.params.id;

			if (ordernote.match(/CC/)) {
				amount = '300';
			} else if (ordernote.match(/CD/)) {
				amount = '500';
			} else if (ordernote.match(/CE/)) {
				amount = '1000';
			} else if (ordernote.match(/MD/)) {
				amount = '500';
			} else if (ordernote.match(/ME/)) {
				amount = '1000';
			} else {
				amount = '1000';
			}

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
				newDate: newDate,
				orderamount: amount,
			};

			o.push(data);
			res.render('payment', {
				o,
				loggedStatus,
			});
		}
		connection.destroy();
	});
};

// send the payment data to payment gateway
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
	console.log(' before send 200: ' + res.statusCode);
	res.render('request', {
		adasd,
		url: url,
	});

	connection.destroy();
};

// response
exports.response = (req, res) => {
	console.log('page from rasorpay');
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
	let adasd = JSON.stringify(postData);
	console.log('response adasd: ' + adasd);
	console.log('session : ' + res.session);
	console.log('customerName : ' + customerName);
	res.render('process', {
		adasd,
	});
};

// success
exports.responseInsert = (req, res) => {
	console.log('page 1+');
	console.log('postData: ' + req.postData);
	console.log(req.session);
	console.log(req.session.customerId);
	console.log(req.session.customerName);
	let passMEgroupNo = '';
	let adasd = req.session;
	res.render('status', {
		adasd,
	});
	// let sql1 = `SELECT * FROM WHERE  customername = '${req.session.customerName}' ORDER BY created_at DESC`;
	// let query = pool.query(sql1, (err, result, fields) => {
	// 	if (err) {
	// 		// If an error occurred, send a generic server failure
	// 		console.log(`not successful! ${err}`);
	// 		res.render('404', {
	// 			err,
	// 		});
	// 		//destroy the connection thread
	// 	} else {
	// 		console.log(result[0].groupno);
	// 		let passMEgroupNo = result[0].groupno;
	// 		console.log('passMEgroupNo: ' + passMEgroupNo);
	// 		res.json(result);
	// 		//destroy the connection thread
	// 	}
	// 	connection.destroy();
	// });
};

// Get customer transaction data
exports.getCustomerTransaction = (req, res) => {
	let sql = `SELECT * FROM customer_transaction WHERE receiptdate = '${req.body.date}T00:00:00.000Z' AND cashier = '0' ORDER BY id DESC`;
	let query = pool.query(sql, (err, result, fields) => {
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
	const post = {
		customerid: req.body.customerid,
		headname: req.body.headname,
		mobilenumber: req.body.mobilenumber,
		location: req.body.location,
	};
	// let sql = `INSERT IGNORE INTO customer SET ?`;
	let sql = `SELECT * FROM customer WHERE customerid = '${req.body.customerid}' `;
	let query = pool.query(sql, post, (err, result, fields) => {
		if (result.length == 0) {
			let sqls = `INSERT INTO customer SET ?`;
			let querys = pool.query(sqls, post, (errs, results) => {
				if (errs) throw errs;
				let data = {
					recordid: results.insertId,
					recordadd: results.affectedRows,
					recordstatus: results.serverStatus,
				};
				res.end(JSON.stringify(data));
			});
		} else {
			let sqls = ` UPDATE customer SET headname = '${req.body.headname}', mobilenumber = '${req.body.mobilenumber}' WHERE customerid = '${req.body.customerid}' `;
			let querys = pool.query(sqls, post, (errs, results) => {
				if (errs) throw errs;
				let data = {
					recordid: results.insertId,
					recordadd: results.affectedRows,
					recordstatus: results.serverStatus,
				};
				res.end(JSON.stringify(data));
			});
		}
		connection.destroy();
	});
};

// insert customer group
exports.insertCustomerGroup = (req, res) => {
	const post = {
		customercode: req.body.customercode,
		groupno: req.body.groupno,
		customername: req.body.customername,
		joindate: req.body.joindate,
		status: req.body.status,
		commitdate: req.body.commitdate,
	};
	// let sql = `INSERT IGNORE INTO customer_group SET ?`;
	let sql = `SELECT * FROM customer_group WHERE customercode = '${post.customercode}' AND groupno = '${post.groupno}'`;
	let query = pool.query(sql, post, (err, result) => {
		if (result.length == 0) {
			let sqls = `INSERT IGNORE INTO customer_group (customercode, groupno, customername, joindate, status, commitdate) VALUES ('${post.customercode}', '${post.groupno}', '${post.customername}', '${post.joindate}', '${post.status}', IF('${post.commitdate}' = '', NULL, '${post.commitdate}') )`;
			let querys = pool.query(sqls, post, (errs, results) => {
				if (errs) throw errs;
				let data = {
					recordid: results.insertId,
					recordadd: results.affectedRows,
					recordstatus: results.serverStatus,
				};
				res.end(JSON.stringify(data));
			});
		} else {
			let sqls = ` UPDATE customer_group SET customername = '${post.customername}', status = '${post.status}', commitdate = IF('${post.commitdate}' = '', NULL, '${post.commitdate}') WHERE customercode = '${post.customercode}' `;
			let querys = pool.query(sqls, post, (errs, results) => {
				if (errs) throw errs;
				let data = {
					recordid: results.insertId,
					recordadd: results.affectedRows,
					recordstatus: results.serverStatus,
				};
				res.end(JSON.stringify(data));
			});
		}
		connection.destroy();
	});
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
	// let sql = `INSERT IGNORE INTO customer_transaction SET ?`;
	let sql = `SELECT * FROM customer_transaction WHERE receiptnumber = '${req.body.receiptnumber}' AND groupnumber = '${req.body.groupnumber}' AND receiptdate = '${req.body.receiptdate}' AND cashier = '${req.body.cashier}'`;
	let query = pool.query(sql, post, (err, result) => {
		if (err) {
			res.json(err);
		} else {
			if (result.length == 0) {
				let sqls = `INSERT IGNORE INTO customer_transaction SET ?`;
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

// logout
exports.userLogout = (req, res) => {
	req.session.destroy();
	res.redirect('/');
};
