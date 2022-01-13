const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Routes
router.get('/', userController.home);
router.get('/faq', userController.faq);
router.get('/login', userController.home);
router.post('/authentication', userController.loginAuth);
router.get('/account', userController.userDetail);
router.get('/account/:id', userController.userTransaction);
router.get('/account/:id/payment', userController.userPayment);
router.post('/paymentRequest', userController.paymentRequest);
router.get('/response', userController.paymentResponse);
router.get('/success', userController.success);
router.post('/customer-data',	userController.insertCustomer);
router.post('/customer-group-data', userController.insertCustomerGroup);
router.post('/customer-transaction-data', userController.insertCustomerTransaction);

/**
 * date is not passing via router : {host}/get-customer-transaction/
 * so it was redirected to {host}/get-customer-transactions
 */
// router.get('/get-customer-transaction',	userController.getCustomerTransaction);
router.get('/get-customer-transactions/',	userController.getCustomerTransaction);

router.get('/logout', userController.userLogout);

router.all('*', (req, res) => {
  res.render('404');
});
module.exports = router;
