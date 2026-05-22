import React, { useEffect, useState } from 'react';

export default function ConsentBenefitsRenewal() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/consent-benefits-renewal').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div>
      <h1>Consent & Benefits Renewal</h1>
      <p>Prevent benefit interruption by tracking renewal deadlines and consent expiration.</p>
      <div className="stats-grid">
        {data && Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </div>
      <div className="card">
        {(data?.cases || []).map((item) => <div key={item.beneficiary} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}><strong>{item.beneficiary}</strong><div>{item.benefit} - {item.days_left} days left - {item.consent} - {item.action}</div></div>)}
      </div>
    </div>
  );
}
