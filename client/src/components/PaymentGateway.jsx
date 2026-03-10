import React, { useState } from 'react';
import { X, Loader2, Shield, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { paymentAPI } from '../Pages/services/api';

const PaymentGateway = ({
  amount,
  onSuccess,
  onClose,
  orderDetails = {},
  paymentMethods = ['razorpay', 'cod'],
  businessName = 'MedCare',
  businessLogo = 'https://your-logo-url.com/logo.png'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load payment gateway');

      // Create order via backend
      const { data: orderData } = await paymentAPI.createOrder({
        amount,
        currency: 'INR',
        serviceType: orderDetails.serviceType || 'consultation',
        description: orderDetails.description || 'Payment for service',
        appointmentId: orderDetails.appointmentId,
        metadata: orderDetails.metadata || {},
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: businessName,
        description: orderDetails.description || 'Payment for service',
        image: businessLogo,
        order_id: orderData.data.orderId,
        handler: async (paymentResponse) => {
          // Confirm/verify payment
          const { data: verifyData } = await paymentAPI.confirmPayment({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          });

          if (verifyData.success) {
            onSuccess({
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              method: 'razorpay',
              data: verifyData.data,
            });
          } else {
            throw new Error('Payment verification failed');
          }
        },
        prefill: {
          name: orderDetails.customerName || '',
          email: orderDetails.customerEmail || '',
          contact: orderDetails.customerPhone || '',
        },
        notes: orderDetails.notes || {},
        theme: { color: '#10b981' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || error.message || 'Failed to initiate payment.');
      setIsProcessing(false);
    }
  };

  const handleCOD = () => {
    setTimeout(() => {
      onSuccess({ paymentId: 'COD', method: 'cod' });
    }, 1500);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    if (selectedMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else if (selectedMethod === 'cod') {
      handleCOD();
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'razorpay': return <CreditCard className="w-5 h-5" />;
      case 'cod': return <Wallet className="w-5 h-5" />;
      case 'upi': return <Smartphone className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'razorpay': return 'UPI / Cards / Net Banking';
      case 'cod': return 'Cash on Delivery';
      case 'upi': return 'UPI Payment';
      default: return method;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Complete Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={isProcessing}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-800">₹{amount.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Total Amount</div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700">Select Payment Method</h4>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label
                key={method}
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                  selectedMethod === method
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={selectedMethod === method}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-2 rounded-full ${selectedMethod === method ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {getPaymentMethodIcon(method)}
                </div>
                <span className="flex-1 text-gray-700">{getPaymentMethodLabel(method)}</span>
                {selectedMethod === method && <div className="w-4 h-4 rounded-full bg-green-500" />}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg hover:shadow-lg transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {selectedMethod === 'cod' ? 'Placing Order...' : 'Processing...'}
            </span>
          ) : (
            selectedMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${amount.toFixed(2)}`
          )}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          <Shield className="w-4 h-4 inline mr-1" />
          Secure payment • 128-bit SSL encrypted
        </div>

        {selectedMethod === 'cod' && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            <p className="font-medium">📦 Cash on Delivery</p>
            <p className="text-xs mt-1">Pay with cash when your order is delivered.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
