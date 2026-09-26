import { useState } from 'react';
import { CloseIcon } from './icons';

const SIZE_CHARTS = {
  apparel: {
    title: 'Apparel & Clothing (Tops, Shirts, Jackets, Dresses)',
    headers: ['Size', 'US / UK', 'Chest / Bust', 'Waist', 'Hips', 'Shoulder'],
    inches: [
      { size: 'XS', standard: '34 / 6', chest: '33 - 35"', waist: '26 - 28"', hips: '35 - 37"', shoulder: '16.5"' },
      { size: 'S', standard: '36 / 8', chest: '36 - 38"', waist: '29 - 31"', hips: '38 - 40"', shoulder: '17.0"' },
      { size: 'M', standard: '38 / 10', chest: '39 - 41"', waist: '32 - 34"', hips: '41 - 43"', shoulder: '17.8"' },
      { size: 'L', standard: '40 / 12', chest: '42 - 44"', waist: '35 - 37"', hips: '44 - 46"', shoulder: '18.5"' },
      { size: 'XL', standard: '42 / 14', chest: '45 - 47"', waist: '38 - 40"', hips: '47 - 49"', shoulder: '19.2"' },
      { size: 'XXL', standard: '44 / 16', chest: '48 - 50"', waist: '41 - 43"', hips: '50 - 52"', shoulder: '20.0"' },
    ],
    cm: [
      { size: 'XS', standard: '34 / 6', chest: '84 - 89 cm', waist: '66 - 71 cm', hips: '89 - 94 cm', shoulder: '42 cm' },
      { size: 'S', standard: '36 / 8', chest: '91 - 96 cm', waist: '74 - 79 cm', hips: '96 - 101 cm', shoulder: '43 cm' },
      { size: 'M', standard: '38 / 10', chest: '99 - 104 cm', waist: '81 - 86 cm', hips: '104 - 109 cm', shoulder: '45 cm' },
      { size: 'L', standard: '40 / 12', chest: '107 - 112 cm', waist: '89 - 94 cm', hips: '112 - 117 cm', shoulder: '47 cm' },
      { size: 'XL', standard: '42 / 14', chest: '114 - 119 cm', waist: '96 - 101 cm', hips: '119 - 124 cm', shoulder: '49 cm' },
      { size: 'XXL', standard: '44 / 16', chest: '122 - 127 cm', waist: '104 - 109 cm', hips: '127 - 132 cm', shoulder: '51 cm' },
    ],
  },
  bottoms: {
    title: 'Bottoms & Trousers (Pants, Jeans, Skirts)',
    headers: ['Waist Size', 'EU / UK', 'Waist', 'Hips', 'Inseam Length'],
    inches: [
      { size: '28', standard: '38 / 28', waist: '28 - 29"', hips: '35 - 36"', inseam: '30"' },
      { size: '30', standard: '40 / 30', waist: '30 - 31"', hips: '37 - 38"', inseam: '31"' },
      { size: '32', standard: '42 / 32', waist: '32 - 33"', hips: '39 - 40"', inseam: '32"' },
      { size: '34', standard: '44 / 34', waist: '34 - 35"', hips: '41 - 42"', inseam: '32"' },
      { size: '36', standard: '46 / 36', waist: '36 - 37"', hips: '43 - 44"', inseam: '33"' },
      { size: '38', standard: '48 / 38', waist: '38 - 40"', hips: '45 - 46"', inseam: '33"' },
    ],
    cm: [
      { size: '28', standard: '38 / 28', waist: '71 - 74 cm', hips: '89 - 91 cm', inseam: '76 cm' },
      { size: '30', standard: '40 / 30', waist: '76 - 79 cm', hips: '94 - 96 cm', inseam: '79 cm' },
      { size: '32', standard: '42 / 32', waist: '81 - 84 cm', hips: '99 - 101 cm', inseam: '81 cm' },
      { size: '34', standard: '44 / 34', waist: '86 - 89 cm', hips: '104 - 107 cm', inseam: '81 cm' },
      { size: '36', standard: '46 / 36', waist: '91 - 94 cm', hips: '109 - 112 cm', inseam: '84 cm' },
      { size: '38', standard: '48 / 38', waist: '96 - 101 cm', hips: '114 - 117 cm', inseam: '84 cm' },
    ],
  },
  footwear: {
    title: 'Footwear & Sneakers',
    headers: ['India / UK', 'US', 'EU', 'Foot Length (Inches)', 'Foot Length (CM)'],
    inches: [
      { size: 'UK 6', standard: 'US 7', chest: 'EU 40', waist: '9.8"', hips: '25.0 cm' },
      { size: 'UK 7', standard: 'US 8', chest: 'EU 41', waist: '10.2"', hips: '26.0 cm' },
      { size: 'UK 8', standard: 'US 9', chest: 'EU 42', waist: '10.6"', hips: '27.0 cm' },
      { size: 'UK 9', standard: 'US 10', chest: 'EU 43', waist: '11.0"', hips: '28.0 cm' },
      { size: 'UK 10', standard: 'US 11', chest: 'EU 44', waist: '11.4"', hips: '29.0 cm' },
      { size: 'UK 11', standard: 'US 12', chest: 'EU 45', waist: '11.8"', hips: '30.0 cm' },
    ],
    cm: [
      { size: 'UK 6', standard: 'US 7', chest: 'EU 40', waist: '25.0 cm', hips: '25.0 cm' },
      { size: 'UK 7', standard: 'US 8', chest: 'EU 41', waist: '26.0 cm', hips: '26.0 cm' },
      { size: 'UK 8', standard: 'US 9', chest: 'EU 42', waist: '27.0 cm', hips: '27.0 cm' },
      { size: 'UK 9', standard: 'US 10', chest: 'EU 43', waist: '28.0 cm', hips: '28.0 cm' },
      { size: 'UK 10', standard: 'US 11', chest: 'EU 44', waist: '29.0 cm', hips: '29.0 cm' },
      { size: 'UK 11', standard: 'US 12', chest: 'EU 45', waist: '30.0 cm', hips: '30.0 cm' },
    ],
  },
};

export default function SizeGuideModal({ category = '', onClose }) {
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'
  const isFootwear = /shoe|sneaker|boot|footwear|heel/i.test(category);
  const isBottom = /pant|trouser|jean|bottom|skirt|short/i.test(category);

  const initialTab = isFootwear ? 'footwear' : isBottom ? 'bottoms' : 'apparel';
  const [activeTab, setActiveTab] = useState(initialTab);

  const currentChart = SIZE_CHARTS[activeTab] || SIZE_CHARTS.apparel;
  const rows = unit === 'in' ? currentChart.inches : currentChart.cm;

  return (
    <div className="size-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="size-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="size-modal-header">
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-gold)' }}>
              Stylio Fit Studio
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Size & Fit Guide</h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close size guide"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="size-modal-body">
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid var(--color-line)',
              paddingBottom: 12,
              marginBottom: 16,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            <button
              type="button"
              className={`btn ${activeTab === 'apparel' ? 'btn-dark' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('apparel')}
            >
              Apparel & Tops
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'bottoms' ? 'btn-dark' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('bottoms')}
            >
              Trousers & Bottoms
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'footwear' ? 'btn-dark' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('footwear')}
            >
              Footwear & Shoes
            </button>
          </div>

          {/* Unit Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{currentChart.title}</span>
            <div className="size-unit-toggle">
              <button
                type="button"
                className={`size-unit-btn ${unit === 'in' ? 'active' : ''}`}
                onClick={() => setUnit('in')}
              >
                Inches (in)
              </button>
              <button
                type="button"
                className={`size-unit-btn ${unit === 'cm' ? 'active' : ''}`}
                onClick={() => setUnit('cm')}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="size-table-wrap">
            <table className="size-table">
              <thead>
                <tr>
                  {currentChart.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{row.size}</td>
                    <td>{row.standard}</td>
                    <td>{row.chest || row.waist}</td>
                    <td>{row.waist || row.hips}</td>
                    {row.hips && <td>{row.hips}</td>}
                    {row.shoulder && <td>{row.shoulder}</td>}
                    {row.inseam && <td>{row.inseam}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Measuring Tips Box */}
          <div className="size-tips-box">
            <strong style={{ color: 'var(--color-ink)', display: 'block', marginBottom: 4 }}>
              How to measure accurately:
            </strong>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem' }}>
              <li>
                <strong>Chest / Bust:</strong> Measure around the fullest part of your chest, keeping tape horizontal.
              </li>
              <li>
                <strong>Waist:</strong> Measure around your natural waistline, keeping tape comfortably loose.
              </li>
              <li>
                <strong>Hips:</strong> Stand with feet together and measure around the fullest part of your hips.
              </li>
              <li>
                <strong>In-between sizes?</strong> We recommend sizing up for a relaxed luxury drape, or sizing down for a tailored slim fit.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
