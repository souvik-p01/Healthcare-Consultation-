import React, { useState } from 'react';
import {
  X, Loader2, Shield, CreditCard, Wallet,
  Smartphone, Building2, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { paymentAPI } from '../Pages/services/api';

/* ─── helper: load Razorpay SDK ─── */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

/* ─── payment method definitions ─── */
const METHODS = [
  {
    id: 'upi',
    label: 'UPI',
    sub: 'GPay, PhonePe, Paytm, BHIM & more',
    icon: <Smartphone className="w-5 h-5" />,
    color: 'violet',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sub: 'Visa, Mastercard, RuPay',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'blue',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    sub: 'All major banks',
    icon: <Building2 className="w-5 h-5" />,
    color: 'green',
  },
  {
    id: 'wallet',
    label: 'Wallets',
    sub: 'Paytm, Mobikwik, Freecharge',
    icon: <Wallet className="w-5 h-5" />,
    color: 'orange',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    sub: 'Pay when delivered',
    icon: <Wallet className="w-5 h-5" />,
    color: 'yellow',
  },
];

/* ─── colour map ─── */
const COLOR = {
  violet:  { border: 'border-violet-500',  bg: 'bg-violet-50',  dot: 'bg-violet-500',  icon: 'bg-violet-100 text-violet-600'  },
  blue:    { border: 'border-blue-500',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    icon: 'bg-blue-100 text-blue-600'      },
  green:   { border: 'border-green-500',   bg: 'bg-green-50',   dot: 'bg-green-500',   icon: 'bg-green-100 text-green-600'    },
  orange:  { border: 'border-orange-500',  bg: 'bg-orange-50',  dot: 'bg-orange-500',  icon: 'bg-orange-100 text-orange-600'  },
  yellow:  { border: 'border-yellow-500',  bg: 'bg-yellow-50',  dot: 'bg-yellow-500',  icon: 'bg-yellow-100 text-yellow-600'  },
};

/* ─── UPI logos ─── */
const UPI_APPS = [
  { name: 'GPay',     logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png' },
  { name: 'PhonePe',  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png' },
  { name: 'Paytm',    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png' },
  { name: 'BHIM',     logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/BHIM_SVG_Logo.svg/512px-BHIM_SVG_Logo.svg.png' },
];

/* ─── Popular banks ─── */
const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank', 'PNB', 'BOB'];

const PaymentGateway = ({
  amount,
  onSuccess,
  onClose,
  orderDetails = {},
  businessName = 'HealthCare Plus',
  businessLogo = 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
}) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess]  = useState(false);

  /* UPI fields */
  const [upiId, setUpiId] = useState('');
  /* Card fields */
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  /* Net banking */
  const [selectedBank, setSelectedBank] = useState('');
  /* Wallet */
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  /* ── open Razorpay modal pre-filled for the chosen method ── */
  const openRazorpay = async (prefillMethod) => {
    const loaded = await loadRazorpay();
    if (!loaded) throw new Error('Failed to load Razorpay SDK');

    const { data: orderData } = await paymentAPI.createOrder({
      amount,
      currency: 'INR',
      serviceType: orderDetails.serviceType || 'consultation',
      description: orderDetails.description || 'Payment for service',
      appointmentId: orderDetails.appointmentId,
      metadata: orderDetails.metadata || {},
    });

    return new Promise((resolve, reject) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: businessName,
        description: orderDetails.description || 'Payment for service',
        image: businessLogo,
        order_id: orderData.data.orderId,
        method: prefillMethod,        // pre-select method in Razorpay checkout
        prefill: {
          name:    orderDetails.customerName  || '',
          email:   orderDetails.customerEmail || '',
          contact: orderDetails.customerPhone || '',
          ...(prefillMethod === 'upi' && upiId ? { vpa: upiId } : {}),
        },
        notes: orderDetails.notes || {},
        theme: { color: '#6d28d9' },
        modal: {
          ondismiss: () => { setIsProcessing(false); reject(new Error('dismissed')); },
        },
        handler: async (resp) => {
          try {
            const { data: verifyData } = await paymentAPI.confirmPayment({
              razorpay_order_id:   resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature:  resp.razorpay_signature,
            });
            resolve({ paymentId: resp.razorpay_payment_id, orderId: orderData.data.paymentId, method: selectedMethod, data: verifyData.data });
          } catch (e) { reject(e); }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        setIsProcessing(false);
        reject(new Error(r.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  };

  /* ── COD ── */
  const handleCOD = async () => {
    const { data: orderData } = await paymentAPI.createOrder({
      amount,
      currency: 'INR',
      serviceType: orderDetails.serviceType || 'pharmacy',
      description: orderDetails.description || 'Cash on Delivery',
      paymentMethod: 'cod',
      metadata: orderDetails.metadata || {},
    });
    return { paymentId: orderData.data.paymentId, orderId: orderData.data.orderId, method: 'cod', data: orderData.data };
  };

  /* ── main pay handler ── */
  const handlePay = async () => {
    setIsProcessing(true);
    try {
      let result;
      switch (selectedMethod) {
        case 'upi':        result = await openRazorpay('upi');        break;
        case 'card':       result = await openRazorpay('card');       break;
        case 'netbanking': result = await openRazorpay('netbanking'); break;
        case 'wallet':     result = await openRazorpay('wallet');     break;
        case 'cod':        result = await handleCOD();                break;
        default:           result = await openRazorpay('upi');
      }
      setSuccess(true);
      setTimeout(() => onSuccess(result), 1200);
    } catch (err) {
      if (err.message !== 'dismissed') {
        alert(err.message || 'Payment failed. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  /* ── render ── */
  const c = COLOR[METHODS.find((m) => m.id === selectedMethod)?.color || 'green'];
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm animate-scaleIn">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b p-4 md:p-6 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-gray-800">Complete Payment</h3>
          <button onClick={onClose} disabled={isProcessing} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="text-center mb-6 p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl">
            <div className="text-4xl font-bold text-gray-800">₹{amount.toFixed(2)}</div>
            <div className="text-sm text-gray-600 mt-1">Total Amount</div>
          </div>

          <h4 className="font-semibold mb-3 text-gray-700">Select Payment Method</h4>
          <div className="space-y-3 mb-6">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  selectedMethod === m.id ? `${COLOR[m.color].border} ${COLOR[m.color].bg}` : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={selectedMethod === m.id}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-2 rounded-lg ${selectedMethod === m.id ? COLOR[m.color].icon : 'bg-gray-100 text-gray-600'}`}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{m.label}</div>
                  <div className="text-xs text-gray-500">{m.sub}</div>
                </div>
                {selectedMethod === m.id && <div className={`w-5 h-5 rounded-full ${COLOR[m.color].dot}`} />}
              </label>
            ))}
          </div>

          {/* UPI field */}
          {selectedMethod === 'upi' && (
            <div className="mb-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter your UPI ID (optional)
              </label>
              <input
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-3 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                {UPI_APPS.map((app) => (
                  <div key={app.name} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border text-xs">
                    <img src={app.logo} alt={app.name} className="w-4 h-4 object-contain" />
                    <span className="text-gray-600">{app.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">You can pay using any UPI app like GPay, PhonePe, Paytm, etc.</p>
            </div>
          )}

          {/* Card fields */}
          {selectedMethod === 'card' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-600">Visa, Mastercard, RuPay supported</p>
            </div>
          )}

          {/* Net Banking */}
          {selectedMethod === 'netbanking' && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Your Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {BANKS.map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedBank === bank ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">You'll be redirected to your bank's secure login.</p>
            </div>
          )}

          {/* Wallet */}
          {selectedMethod === 'wallet' && (
            <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Wallet</label>
              <div className="space-y-2">
                {['Paytm', 'Mobikwik', 'Freecharge', 'PhonePe Wallet'].map((w) => (
                  <label key={w} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="wallet"
                      value={w.toLowerCase()}
                      checked={selectedWallet === w.toLowerCase()}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                    />
                    <span className="font-medium text-gray-700">{w}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* COD Note */}
          {selectedMethod === 'cod' && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-300">
              <p className="font-semibold text-yellow-800 mb-1">📦 Cash on Delivery</p>
              <p className="text-sm text-yellow-700">Pay with cash when your order is delivered to your address.</p>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className={`w-full ${c.dot.replace('bg-', 'bg-gradient-to-r from-')} to-emerald-600 text-white py-4 rounded-xl hover:shadow-xl transition-all font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                {selectedMethod === 'cod' ? 'Placing Order...' : 'Processing...'}
              </span>
            ) : (
              selectedMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${amount.toFixed(2)}`
            )}
          </button>

          <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-1">
            <Shield className="w-4 h-4" />
            Secure payment • 256-bit SSL encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
