import { PrinterIcon, CloseIcon } from './icons';
import { fmt } from '../utils/format';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const orderId = String(order._id || order.id || '');
  const orderIdShort = orderId.slice(-8).toUpperCase();
  const invoiceNumber = `INV-${orderIdShort}`;

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const customerName =
    order.userId?.name ||
    order.shippingAddress?.name ||
    order.customerName ||
    'Valued Customer';

  const customerEmail = order.userId?.email || order.shippingAddress?.email || 'N/A';
  const customerPhone = order.shippingAddress?.phone || 'N/A';

  const fullAddress = [
    order.shippingAddress?.street,
    order.shippingAddress?.city,
    order.shippingAddress?.state,
    order.shippingAddress?.zip,
    order.shippingAddress?.country || 'India',
  ]
    .filter(Boolean)
    .join(', ');

  const items = order.items || [];
  const totalAmount = Number(order.total || 0);
  const gstAmount = Math.round((totalAmount * 18) / 118);
  const subtotalBeforeGst = totalAmount - gstAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="size-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="size-modal-dialog"
        style={{ maxWidth: 740, borderRadius: 'var(--radius-md)', background: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Not printed) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-line)',
            background: 'var(--color-paper)',
          }}
          className="no-print"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tax Invoice Preview</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                color: order.paymentStatus === 'paid' ? '#166534' : '#92400e',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-dark"
              onClick={handlePrint}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PrinterIcon size={16} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close invoice"
              style={{ width: 34, height: 34 }}
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div
          className="printable-invoice"
          style={{
            padding: '36px 40px',
            fontFamily: 'var(--font-body)',
            color: '#111827',
            background: '#ffffff',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #111827',
              paddingBottom: 20,
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.12em',
                  fontSize: '1.8rem',
                  margin: 0,
                  color: '#111827',
                }}
              >
                STYL<span>IO</span>
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                LUXURY ATELIER &bull; CONSIDERED CLOTHING
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#9ca3af' }}>
                GSTIN: 07AAACS1429B1Z8 &bull; CIN: U17120DL2024PTC123456
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#111827',
                  color: '#ffffff',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                TAX INVOICE
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{invoiceNumber}</div>
              <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 2 }}>
                Date: {orderDate} ({orderTime})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                Ref Order: #{orderIdShort}
              </div>
            </div>
          </div>

          {/* Addresses and Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              marginBottom: 24,
              paddingBottom: 20,
              borderBottom: '1px solid #e5e7eb',
              fontSize: '0.84rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: 6,
                }}
              >
                Billed & Shipped To
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#111827' }}>
                {customerName}
              </div>
              <div style={{ color: '#4b5563', marginTop: 4, lineHeight: 1.45 }}>
                {fullAddress || 'Address on file'}
              </div>
              <div style={{ color: '#6b7280', marginTop: 4 }}>
                Phone: {customerPhone}
              </div>
              {customerEmail !== 'N/A' && (
                <div style={{ color: '#6b7280' }}>Email: {customerEmail}</div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: 6,
                }}
              >
                Dispatch & Payment Details
              </div>
              <div style={{ color: '#374151', lineHeight: 1.5 }}>
                <div>
                  <strong>Payment Method:</strong>{' '}
                  <span style={{ textTransform: 'capitalize' }}>
                    {order.paymentGateway || 'Online Payment'}
                  </span>
                </div>
                <div>
                  <strong>Payment Status:</strong>{' '}
                  <span style={{ color: order.paymentStatus === 'paid' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                    {order.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div>
                    <strong>Courier:</strong> {order.courierName || 'Standard Express'}
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <strong>AWB / Tracking:</strong> <code>{order.trackingNumber}</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: 24, overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.84rem',
              }}
            >
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>HSN</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Specs</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = Number(item.price || 0) * Number(item.qty || 1);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 500, color: '#111827' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>
                          Brand: {item.brand || 'STYLIO Collection'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280', fontSize: '0.78rem' }}>
                        610910
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4b5563', fontSize: '0.78rem' }}>
                        {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
                          .filter(Boolean)
                          .join(' | ') || 'Standard'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>
                        {fmt(item.price)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                        {item.qty}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {fmt(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 28,
            }}
          >
            <div style={{ width: 280, fontSize: '0.84rem', lineHeight: 1.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Taxable Value:</span>
                <span>{fmt(subtotalBeforeGst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>CGST (9%):</span>
                <span>{fmt(Math.round(gstAmount / 2))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>SGST (9%):</span>
                <span>{fmt(Math.round(gstAmount / 2))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Shipping & Delivery:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>FREE</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid #111827',
                  paddingTop: 8,
                  marginTop: 8,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                <span>Grand Total:</span>
                <span>{fmt(totalAmount)}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>
                (Inclusive of all central & state taxes)
              </div>
            </div>
          </div>

          {/* Footer & Disclaimer */}
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: 20,
              fontSize: '0.76rem',
              color: '#6b7280',
              lineHeight: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                Terms & Customer Protection:
              </div>
              <div>&bull; 30-day effortless return & exchange window.</div>
              <div>&bull; For care or assistance, reach us at concierge@stylio.com.</div>
              <div>&bull; This is a computer-generated tax invoice and requires no physical seal.</div>
            </div>

            <div style={{ textAlign: 'right', minWidth: 160 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '1.1rem',
                  color: '#111827',
                  marginBottom: 4,
                }}
              >
                Stylio Atelier
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
