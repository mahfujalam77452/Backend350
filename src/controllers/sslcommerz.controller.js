const sslcommerzService = require('../services/sslcommerz.service');
const { getUserById } = require('../services/user.service');
const { getClubById, addUserToPendingList } = require('../services/club.service');
const { sendEmail } = require('../services/email.service');
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const config = require('../config/config');
const initiatePayment = catchAsync(async (req, res) => {
  const user = await getUserById(req.body.userId);
  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).send({error: 'User not found' });
  }
  const club = await getClubById(req.body.clubId);
  if (!club) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Club not found' });
  }
  user.userPhone = req.body.userPhone;
  const GatewayPageURL = await sslcommerzService.initPayment(user, club);
  res.send({ url: GatewayPageURL });
});

const paymentSuccess = catchAsync(async (req, res) => {
  try {
    // Get transaction ID from either body or params
    const tranId = req.body.tran_id || req.params.tran_id || req.query.tran_id;
    console.log('Payment success callback received for transaction:', tranId);
    
    if (!tranId) {
      console.error('No transaction ID provided');
      return res.redirect(`${config.clientURL}/payment/failed?error=no_transaction_id`);
    }

    // Find the transaction
    const transaction = await sslcommerzService.findTransaction(tranId);
    if (!transaction) {
      console.error('Transaction not found:', tranId);
      return res.redirect(`${config.clientURL}/payment/failed?error=transaction_not_found`);
    }

    // If payment is already processed, just redirect
    if (transaction.paymentStatus === 'PAID') {
      console.log('Payment already processed, redirecting to success');
      return res.redirect(`${config.clientURL}/payment/success?tran_id=${tranId}&status=success`);
    }

    // Validate the payment
    const val_id = req.query.val_id || req.body.val_id;
    if (!val_id) {
      console.error('No validation ID provided');
      return res.redirect(`${config.clientURL}/payment/failed?error=no_validation_id&tran_id=${tranId}`);
    }

    console.log('Validating payment with val_id:', val_id);
    const response = await sslcommerzService.validatePayment(val_id);
    
    if (!response || response.status !== 'VALID') {
      console.error('Payment validation failed:', response);
      await transaction.deleteOne();
      return res.redirect(`${config.clientURL}/payment/failed?error=validation_failed&tran_id=${tranId}`);
    }

    // Update transaction status
    transaction.paymentStatus = 'PAID';
    transaction.paymentDetails = response;
    await transaction.save();
    
    // Add user to pending list
    console.log('Adding user to pending list:', {
      userId: transaction.userId,
      clubId: transaction.clubId
    });
    await addUserToPendingList(transaction.clubId, transaction.userId);
    
    console.log('Payment processed successfully:', tranId);
    
    // Redirect to frontend with success status
    return res.redirect(
      `${config.clientURL}/payment/success?tran_id=${tranId}&status=success&user_id=${transaction.userId}`
    );
    
  } catch (error) {
    console.error('Error in paymentSuccess handler:', error);
    const tranId = req.body.tran_id || req.params.tran_id || req.query.tran_id || 'unknown';
    return res.redirect(
      `${config.clientURL}/payment/failed?error=server_error&tran_id=${tranId}`
    );
  }

  const club = await getClubById(transaction.clubId);

  const subject = 'Payment Successful';
  const text = `Dear ${transaction.userName},

Your payment for the club ${club.name} has been successfully processed.

Transaction ID: ${transaction.tranId}

Please note that your membership is pending approval for admin review. You will be notified once your membership is approved.

Thank you for your payment.

Best regards,
The AUSTCMS Team`;
  await sendEmail(transaction.userEmail, subject, text);
});

const paymentFail = catchAsync(async (req, res) => {
  try {
    const tranId = req.body.tran_id || req.params.tran_id || req.query.tran_id;
    console.log('Payment failed: ', { tranId, query: req.query, body: req.body });
    
    if (tranId) {
      const transaction = await sslcommerzService.findTransaction(tranId);
      if (transaction) {
        console.log('Deleting failed transaction:', tranId);
        await transaction.deleteOne();
      }
    }
    
    // Redirect with error details from query or body
    const errorCode = req.query.error || req.body.error || 'payment_failed';
    return res.redirect(
      `${config.clientURL}/payment/failed?tran_id=${tranId || 'unknown'}&error=${errorCode}`
    );
    
  } catch (error) {
    console.error('Error in paymentFail handler:', error);
    return res.redirect(
      `${config.clientURL}/payment/failed?error=server_error`
    );
  }
});

const paymentCancel = catchAsync(async (req, res) => {
  try {
    const tranId = req.body.tran_id || req.params.tran_id || req.query.tran_id;
    console.log('Payment cancelled: ', { tranId, query: req.query, body: req.body });
    
    if (tranId) {
      const transaction = await sslcommerzService.findTransaction(tranId);
      if (transaction) {
        console.log('Deleting cancelled transaction:', tranId);
        await transaction.deleteOne();
      }
    }
    
    return res.redirect(
      `${config.clientURL}/payment/cancelled?tran_id=${tranId || 'unknown'}`
    );
    
  } catch (error) {
    console.error('Error in paymentCancel handler:', error);
    return res.redirect(
      `${config.clientURL}/payment/cancelled?error=server_error`
    );
  }
});

const getTranByUserId = catchAsync(async (req, res) => {
  const transactions = await sslcommerzService.getTranByUserId(req.params.userId);
  if (!transactions) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Transaction not found' });
  }
  res.send(transactions);
});

const getTranByClubId = catchAsync(async (req, res) => {
  const transactions = await sslcommerzService.getTranByClubId(req.params.clubId);
  if (!transactions) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Transaction not found' });
  }
  res.send(transactions);
});

module.exports = {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getTranByUserId,
  getTranByClubId,
};
