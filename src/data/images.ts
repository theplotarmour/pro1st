/**
 * Approved image sources, exactly as referenced by the design source.
 * Replace with Shopify product media once the catalogue is connected —
 * nothing outside this file needs to change.
 */
const DEMO = "https://pro1st-demo.netlify.app/";
const SHOP = "https://pro1st.in/cdn/shop/files/";

export const IMG = {
  aj6: `${DEMO}assets/mixer-aj6-eGXoaviy.jpg`,
  um6: `${DEMO}assets/mixer-um6-BZqltkxf.jpg`,
  mx1600: `${DEMO}assets/amp-mx1600-BDXE_Wuw.jpg`,
  tn780: `${DEMO}assets/driver-780tn-BKQvbUdE.jpg`,
  t12: `${DEMO}assets/trolley-speaker-CaJqB0MY.jpg`,
  xtr6: `${DEMO}assets/feedback-xtr6-CbMKx-Ie.jpg`,
  tk600: `${DEMO}products/TK-600-JPEG.jpg`,
  tk280: `${DEMO}products/TK-280-JPEG.jpg`,
  beta58: `${DEMO}products/Beta-58S-JPEG.jpg`,
  d518: `${DEMO}products/D518-Tweeter.jpg`,
  d750: `${DEMO}products/D750-Network.jpg`,
  d450: `${DEMO}products/D450-Network.jpg`,
  wire: `${DEMO}products/Slim-Wire-2-Core-in-100-yards.jpg`,
  ratchet: `${DEMO}products/Ratchet-Belt-15m.jpg`,
  partybox: `${SHOP}cellImage_1802645157_1.jpg?v=1779529404&width=900`,
  workshop: `${SHOP}image3.png?v=1776941364&width=900`,
} as const;
