import logo from '../assets/vilpe-sense-logo.png'

// VILPE Sense logo plus the product name. tone="dark" turns the logo white for dark backgrounds.
export default function Wordmark({ size = 'md', tone = 'light' }) {
  return (
    <span className={`wordmark wordmark-${size} wordmark-${tone}`}>
      <img src={logo} alt="VILPE Sense" />
      <span className="wordmark-product">DryProof</span>
    </span>
  )
}
