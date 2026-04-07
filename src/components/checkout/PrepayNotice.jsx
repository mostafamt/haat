import { useState } from 'react';
import content from '../../data/content.json';
import { config } from '../../config/env';
import { uploadImage } from '../../services/uploadService';
import { updateOrderProof } from '../../services/ordersService';

const { checkout } = content;
const { prepayNotice } = checkout;

const METHODS = [
  {
    key: 'vodafone',
    label: prepayNotice.vodafoneCashLabel,
    getDetail: () => config.vodafoneCashNum,
    activeBg: 'bg-red-50',
    activeBorder: 'border-red-400',
    labelColor: 'text-red-700',
  },
  {
    key: 'instapay',
    label: prepayNotice.instaPayLabel,
    getDetail: () => config.instaPayIPA,
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-400',
    labelColor: 'text-blue-700',
  },
];

// Shown after order is saved. Manages method selection, proof upload, and
// payment confirmation. Calls onConfirm(selectedPayMethod) when user is ready.
export default function PrepayNotice({ grandTotal, orderId, onConfirm }) {
  const [selectedPayMethod, setSelectedPayMethod]   = useState('');
  const [paymentConfirmed, setPaymentConfirmed]     = useState(false);
  const [proofFile, setProofFile]                   = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl]       = useState('');
  const [proofUploading, setProofUploading]         = useState(false);
  const [proofUploadError, setProofUploadError]     = useState('');
  const [proofUrl, setProofUrl]                     = useState('');

  const resetProof = () => {
    setProofFile(null);
    setProofPreviewUrl('');
    setProofUrl('');
    setProofUploadError('');
  };

  const handleMethodSelect = (key) => {
    setSelectedPayMethod(key);
    resetProof();
    setPaymentConfirmed(false);
  };

  const handleUploadProof = async () => {
    if (!proofFile) return;
    setProofUploading(true);
    setProofUploadError('');
    try {
      const url = await uploadImage(proofFile, 'haat/proofs');
      setProofUrl(url);
      await updateOrderProof(orderId, url);
    } catch {
      setProofUploadError(prepayNotice.proofUploadError);
    } finally {
      setProofUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto" dir="rtl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-black text-red-600 mb-2">{prepayNotice.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{prepayNotice.body}</p>
        </div>

        {/* Payment method selector */}
        <p className="text-sm font-bold text-gray-700 mb-3">{prepayNotice.chooseMethodLabel}</p>
        <div className="flex flex-col gap-3 mb-5">
          {METHODS.map(({ key, label, getDetail, activeBg, activeBorder, labelColor }) => {
            const isSelected = selectedPayMethod === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleMethodSelect(key)}
                className={`w-full text-right border-2 rounded-2xl p-4 transition-all ${isSelected ? `${activeBg} ${activeBorder}` : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-gray-800 bg-gray-800' : 'border-gray-400'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-sm ${isSelected ? labelColor : 'text-gray-600'}`}>{label}</p>
                    {isSelected && (
                      <p className="text-gray-700 text-sm mt-1">
                        {prepayNotice.transferTo}{' '}
                        <span className="font-black text-gray-900">{grandTotal} {prepayNotice.currency}</span>{' '}
                        {prepayNotice.toLabel}{' '}
                        <span className="font-black text-gray-900 tracking-wider">{getDetail()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Proof of payment upload (optional) */}
        {selectedPayMethod && (
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-700 mb-2">{prepayNotice.proofUploadLabel}</p>
            {proofUrl ? (
              <div className="bg-green-50 border border-green-300 rounded-2xl p-3 flex items-center gap-3">
                <img src={proofPreviewUrl} alt="proof" className="w-14 h-14 object-cover rounded-xl border border-green-200 shrink-0" />
                <span className="text-green-700 font-bold text-sm">{prepayNotice.proofUploadSuccess}</span>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-2xl p-4 cursor-pointer bg-gray-50 border-gray-300 hover:border-gray-400 transition-colors">
                  {proofPreviewUrl
                    ? <img src={proofPreviewUrl} alt="preview" className="w-full max-h-40 object-contain rounded-xl" />
                    : <span className="text-gray-500 text-sm text-center">{prepayNotice.proofUploadHint}</span>
                  }
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files[0];
                      if (!f) return;
                      setProofFile(f);
                      setProofPreviewUrl(URL.createObjectURL(f));
                      setProofUploadError('');
                    }}
                  />
                </label>
                {proofFile && (
                  <button
                    type="button"
                    onClick={handleUploadProof}
                    disabled={proofUploading}
                    className="w-full mt-2 bg-gray-800 text-white font-bold py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {proofUploading ? prepayNotice.proofUploadingButton : prepayNotice.proofUploadButton}
                  </button>
                )}
                {proofUploadError && <p className="text-red-500 text-xs mt-1 text-center">{proofUploadError}</p>}
              </div>
            )}
          </div>
        )}

        {/* Payment done confirmation */}
        <button
          type="button"
          disabled={!selectedPayMethod}
          onClick={() => setPaymentConfirmed(true)}
          className={`w-full font-black text-base py-3 rounded-2xl mb-4 transition-all ${
            paymentConfirmed
              ? 'bg-green-500 text-white cursor-default'
              : selectedPayMethod
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {paymentConfirmed ? prepayNotice.paymentDoneConfirmed : prepayNotice.paymentDoneButton}
        </button>

        <p className="text-center text-gray-500 text-xs mb-5">{prepayNotice.afterTransferNote}</p>

        {/* Open WhatsApp */}
        <button
          type="button"
          disabled={!paymentConfirmed}
          onClick={() => onConfirm(selectedPayMethod)}
          className={`w-full font-black text-lg py-4 rounded-2xl transition-colors ${
            paymentConfirmed
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {prepayNotice.confirmButton}
        </button>
      </div>
    </div>
  );
}
