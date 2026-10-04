import { Link } from 'react-router-dom'
import { useData } from '../../data.jsx'
import { certifyBuilding, passportUrl, WINDOW_DAYS, MIN_SCORE, MAX_MOLD } from '../../certification.js'
import { longDate } from '../../format.js'
import AppShell from '../../components/AppShell.jsx'
import QrCode from '../../components/QrCode.jsx'
import Seal from '../../components/Seal.jsx'
import Icon from '../../components/Icon.jsx'
import InfoTip from '../../components/InfoTip.jsx'
import './certificate.css'

function Body() {
  const { data } = useData()
  const { building } = data
  const { rows, certified, from, issued, validUntil, certId } = certifyBuilding(data)
  const url = passportUrl(building.id, certId)

  return (
    <div className="cert-page">
      <div className="cert-actions no-print">
        <Link className="back" to="/owner"><Icon name="arrowLeft" size={16} />All structures</Link>
        <div className="cert-buttons">
          <a className="btn btn-outline btn-pill" href={url}>Open building passport</a>
          <button className="btn btn-primary btn-pill" onClick={() => window.print()}><Icon name="printer" size={16} />Print or save as PDF</button>
        </div>
      </div>

      <article className="cert">
        <header className="cert-head">
          <div>
            <p className="cert-kicker">DryProof by VILPE Sense</p>
            <h1>Dry Structure Certificate</h1>
            <p className="cert-building">{building.name}, {building.city}</p>
          </div>
          <dl className="cert-meta num">
            <div><dt>Certificate</dt><dd>{certId}</dd></div>
            <div><dt>Issued</dt><dd>{longDate(issued)}</dd></div>
            <div><dt>Valid until</dt><dd>{longDate(validUntil)}</dd></div>
          </dl>
        </header>

        <p className="cert-statement">
          Continuous VILPE Sense monitoring shows that {certified.length} of {rows.length} structures stayed
          dry over the last {WINDOW_DAYS} days, from {longDate(from)} to {longDate(issued)}.
        </p>

        <div className="cert-table-wrap">
          <table className="cert-table">
            <thead>
              <tr>
                <th scope="col">Structure</th>
                <th scope="col" className="r">Lowest score</th>
                <th scope="col" className="r">Highest mold index</th>
                <th scope="col">Status<span className="no-print"><InfoTip term="certified" /></span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, label, c }) => (
                <tr key={s.id}>
                  <th scope="row">{label}<small>{s.type}</small></th>
                  <td className="r num">{c.minScore.toFixed(1)}</td>
                  <td className="r num">{c.maxMold.toFixed(3)}</td>
                  <td>
                    {c.certified
                      ? <span className="pill pill-solid-ok">Certified dry</span>
                      : (
                        <>
                          <span className="pill pill-solid-muted">Not yet</span>
                          <span className="fix">{c.openFaults.length ? `Open fault: ${c.openFaults.join(', ')}. ` : ''}{c.gaps.slice(0, 2).map(g => g.hint).join(' ')}</span>
                        </>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="cert-foot">
          <div className="cert-rules">
            <p className="cert-rules-title">How a structure is certified</p>
            <ul>
              <li>Health score {MIN_SCORE} or higher every day for {WINDOW_DAYS} days</li>
              <li>Mold index below {MAX_MOLD.toFixed(1)} the whole time (VTT mold growth model)</li>
              <li>No open equipment fault: fan running, sensors reporting</li>
            </ul>
            <p className="faint">Based on {building.readings.toLocaleString('en')} sensor readings. Demo certificate, not an insurance document.</p>
          </div>
          <div className="cert-seal"><Seal size={104} /></div>
          <div className="cert-qr">
            <QrCode url={url} size={112} />
            <p className="faint">Scan to verify this certificate and see the building passport</p>
          </div>
        </footer>
      </article>
    </div>
  )
}

export default function Certificate() {
  return <AppShell><Body /></AppShell>
}
