import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ReceiptPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const receipt = state?.receipt;

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No receipt information available.</p>
        <button
          onClick={() => navigate('/')}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    // Mock download functionality – in real app, generate PDF or similar
    toast.success('Receipt downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Payment Receipt</h2>
        <div className="space-y-2 mb-6">
          <p><strong>Receipt ID:</strong> {receipt.receiptId}</p>
          <p><strong>Doctor:</strong> {receipt.doctorName}</p>
          <p><strong>Specialty:</strong> {receipt.specialty}</p>
          <p><strong>Amount Paid:</strong> ${receipt.amount}</p>
          <p><strong>Date:</strong> {receipt.date}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded hover:shadow-lg"
          >
            Download Receipt
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
