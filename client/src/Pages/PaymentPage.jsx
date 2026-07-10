import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CreditCard, Smartphone, Building2, Wallet,
  Shield, Loader2, CheckCircle, ArrowLeft
} from 'lucide-react';
import { paymentAPI } from './services/api';

/* ── load Razorpay SDK ── */
const loadRazorpay = () =>
  new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });

const METHODS = [
  { id: 'upi',        label: 'UPI',                  sub: 'GPay, PhonePe, Paytm, BHIM', icon: Smartphone,  color: 'violet' },
  { id: 'card',       label: 'Credit / Debit Card',  sub: 'Visa, Mastercard, RuPay',    icon: CreditCard,   color: 'blue'   },
  { id: 'netbanking', label: 'Net Banking',           sub: 'All major banks',            icon: Building2,    color: 'green'  },
  { id: 'wallet',     label: 'Wallets',               sub: 'Paytm, Mobikwik & more',     icon: Wallet,       color: 'orange' },
  { id: 'cod',        label: 'Cash on Delivery',      sub: 'Pay when delivered',         icon: Wallet,       color: 'yellow' },
];

const COLOR = {
  violet: { border: 'border-violet-500', bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600', btn: 'from-violet-600 to-purple-600' },
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',     btn: 'from-blue-600 to-cyan-600'     },
  green:  { border: 'border-green-500',  bg: 'bg-green-50',   icon: 'bg-green-100 text-green-600',   btn: 'from-green-600 to-emerald-600' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-50',  icon: 'bg-orange-100 text-orange-600', btn: 'from-orange-500 to-red-500'    },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50',  icon: 'bg-yellow-100 text-yellow-700', btn: 'from-yellow-500 to-orange-500' },
};

const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank', 'PNB', 'BOB'];
const UPI_APPS = [
  { name: 'GPay',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png' },
  { name: 'PhonePe', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png' },
  { name: 'Paytm',   logo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png' },
  { name: 'BHIM',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/BHIM_SVG_Logo.svg/512px-BHIM_SVG_Logo.svg.png' },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const appointmentInfo = state?.appointmentInfo;
  const doctor = appointmentInfo?.doctor;
  const amount = doctor?.price ? parseFloat(doctor.price) : 0;

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  /* UPI */
  const [upiId, setUpiId] = useState('');
  /* Card */
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  /* Netbanking */
  const [selectedBank, setSelectedBank] = useState('');
  /* Wallet */
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  const c = COLOR[METHODS.find((m) => m.id === selectedMethod)?.color || 'green'];

  const openRazorpay = async (method) => {
    const loaded = await loadRazorpay();
    if (!loaded) throw new Error('Failed to load Razorpay');

    let orderData;
    try {
      const res = await paymentAPI.createOrder({
        amount,
        currency: 'INR',
        serviceType: 'consultation',
        description: `Consultation with ${doctor?.name}`,
        metadata: { doctorName: doctor?.name, specialty: doctor?.specialty },
      });
      orderData = res.data.data;
    } catch {
      /* fallback: skip backend order if not available (demo) */
      orderData = { orderId: null, amount: amount * 100, currency: 'INR', paymentId: 'demo_' + Date.now() };
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'HealthCare Plus',
        description: `Consultation with ${doctor?.name}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
        order_id: orderData.orderId,
        method,
        prefill: {
          name:    '',
          email:   '',
          contact: '',
          ...(method === 'upi' && upiId ? { vpa: upiId } : {}),
        },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => { setIsProcessing(false); reject(new Error('dismissed')); } },
        handler: (resp) => resolve({
          paymentId:  orderData.paymentId,
          razorpayId: resp.razorpay_payment_id,
          orderId:    resp.razorpay_order_id,
          method,
        }),
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => { setIsProcessing(false); reject(new Error(r.error?.description || 'Payment failed')); });
      rzp.open();
    });
  };

  const handleCOD = () => ({
    paymentId: 'cod_' + Date.now(),
    orderId: 'cod_order_' + Date.now(),
    method: 'cod',
  });

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      let result;
      if (selectedMethod === 'cod') {
        result = handleCOD();
      } else {
        result = await openRazorpay(selectedMethod);
      }

      setSuccess(true);
      const receipt = {
        receiptId: 'RCPT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        doctorName:  doctor?.name,
        specialty:   doctor?.specialty,
        amount:      doctor?.price,
        date:        new Date().toLocaleString(),
        method:      selectedMethod,
        paymentId:   result.paymentId || result.razorpayId,
      };
      toast.success('Payment successful!');
      setTimeout(() => navigate('/services/receipt', { state: { receipt } }), 1500);
    } catch (err) {
      if (err.message !== 'dismissed') {
        toast.error(err.message || 'Payment failed. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  /* ── No doctor data ── */
  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow">
          <p className="text-gray-600 mb-4">No appointment data found.</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-10 bg-white rounded-3xl shadow-2xl max-w-sm">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">Redirecting to receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`p-6 bg-gradient-to-r ${c.btn} text-white`}>
            <h2 className="text-2xl font-bold">Pay for {doctor.name}</h2>
            <p className="opacity-90 mt-1">{doctor.specialty}</p>
            <div className="text-4xl font-bold mt-3">₹{amount.toFixed(2)}</div>
          </div>

          <div className="p-6">
            {/* Method selector */}
            <h3 className="font-semibold text-gray-700 mb-3">Select Payment Method</h3>
            <div className="space-y-2 mb-6">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const mc = COLOR[m.color];
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedMethod === m.id ? `${mc.border} ${mc.bg}` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="method" value={m.id} checked={selectedMethod === m.id}
                      onChange={(e) => setSelectedMethod(e.target.value)} className="sr-only" />
                    <div className={`p-2 rounded-lg ${selectedMethod === m.id ? mc.icon : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">{m.label}</div>
                      <div className="text-xs text-gray-500">{m.sub}</div>
                    </div>
                    {selectedMethod === m.id && (
                      <div className={`w-4 h-4 rounded-full border-4 border-white shadow ${mc.border.replace('border', 'bg')}`} />
                    )}
                  </label>
                );
              })}
            </div>

            {/* UPI */}
            {selectedMethod === 'upi' && (
              <div className="mb-5 p-4 bg-violet-50 rounded-xl border border-violet-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID (optional)</label>
                <input type="text" placeholder="yourname@upi" value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <div className="mt-3 flex gap-2">
                  {UPI_APPS.map((app) => (
                    <div key={app.name} className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border text-xs">
                      <img src={app.logo} alt={app.name} className="w-4 h-4 object-contain" />
                      <span className="text-gray-600">{app.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card */}
            {selectedMethod === 'card' && (
              <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                <input type="text" placeholder="Card Number" value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="MM/YY" value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="col-span-2 px-4 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="CVV" value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="px-4 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <input type="text" placeholder="Cardholder Name" value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            {/* Net Banking */}
            {selectedMethod === 'netbanking' && (
              <div className="mb-5 p-4 bg-green-50 rounded-xl border border-green-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map((bank) => (
                    <button key={bank} onClick={() => setSelectedBank(bank)}
                      className={`py-2 rounded-lg border-2 text-sm font-medium ${
                        selectedBank === bank ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-200 hover:border-green-300'
                      }`}>
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet */}
            {selectedMethod === 'wallet' && (
              <div className="mb-5 p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-2">
                {['Paytm', 'Mobikwik', 'Freecharge'].map((w) => (
                  <label key={w} className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer">
                    <input type="radio" name="wallet" value={w.toLowerCase()}
                      checked={selectedWallet === w.toLowerCase()}
                      onChange={(e) => setSelectedWallet(e.target.value)} />
                    <span className="font-medium text-gray-700">{w}</span>
                  </label>
                ))}
              </div>
            )}

            {/* COD */}
            {selectedMethod === 'cod' && (
              <div className="mb-5 p-4 bg-yellow-50 rounded-xl border border-yellow-300">
                <p className="font-semibold text-yellow-800">📦 Cash on Delivery</p>
                <p className="text-sm text-yellow-700 mt-1">Pay at the clinic / on delivery.</p>
              </div>
            )}

            <button onClick={handlePay} disabled={isProcessing}
              className={`w-full bg-gradient-to-r ${c.btn} text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed`}>
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </span>
              ) : (
                selectedMethod === 'cod' ? 'Confirm Booking (COD)' : `Pay ₹${amount.toFixed(2)}`
              )}
            </button>

            <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-1">
              <Shield className="w-4 h-4" />
              Secure payment • 256-bit SSL encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
