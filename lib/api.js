const express = require('express');
const db = require('./connection');
const apirouter = require('express').Router();

// Retrieve all users
apirouter.get('/api/users', function (req, res) {
    db.query('SELECT * FROM master_customer', function (err, results, fields) {
        if (err) throw err;
        return res.send({
            data: results,
        });
    });

});
// Retrieve user/:id
apirouter.get('/api/user/:id', function (req, res) {
    let user_id = req.params.id;
    if (!user_id) {
        return res.status(400).send({
            message: 'Please provide user_id'
        });
    }
    db.query('SELECT * FROM master_customer where customerid=?', user_id, function (err, results, fields) {
        if (err) throw err;
        return res.send({
            data: results,
        });
    });
});
// Retrieve user group
apirouter.get('/api/group/:id', function (req, res) {
    let user_id = req.params.id;
    if (!user_id) {
        return res.status(400).send({
            message: 'Please provide user_id'
        });
    }
    db.query('SELECT * FROM master_group where customercod=?', user_id, function (err, results, fields) {
        if (err) throw err;
        return res.send({
            data: results,
        });
    });
});
// Retrieve user transaction
apirouter.get('/api/transaction/:id', function (req, res) {
    let user_id = req.params.id;
    if (!user_id) {
        return res.status(400).send({
            message: 'Please provide user_id'
        });
    }
    db.query('SELECT * FROM master_group where customercod=?', user_id, function (err, results, fields) {
        if (err) throw err;
        let dataUserTransaction = results[0]['groupno'];
        db.query('SELECT * FROM master_transaction where groupnumber=?', dataUserTransaction, function (err, results, fields) {
            if (err) throw err;
            return res.send({
                data: results,
            });
        });
    });
});
module.exports = apirouter;