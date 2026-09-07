const faqs = [
  ["Are your mattresses really made in Turkiye?", "Yes. All Dr. Ortho King mattresses are genuinely manufactured in Turkiye and imported directly for sale in Uganda -- they are not locally assembled copies."],
  ["What warranty do you offer?", "Every orthopedic mattress comes with a standard 5-Year Warranty covering manufacturing defects under normal household use."],
  ["Do you deliver?", "Yes -- delivery around Kampala is free. Upcountry delivery, including to our Mbarara branch area, can be arranged; confirm fees and timing with the branch handling your order."],
  ["Do I get anything free with my mattress?", "Yes. Depending on the current promotion, customers receive either a free memory foam luxury pillow, or a bundle of 2 free pillows with a bedspread, when purchasing any hybrid pocket spring orthopedic mattress."],
  ["What sizes do you stock?", "Our ranges span Double/Small (4ft), Queen (5ft/5x6ft), and King (6ft/6x6ft) sizes, in 8\", 10\", and 13\" profile thicknesses depending on the model."],
  ["Which mattress is best for back pain?", "The Carbon Memory Foam Box Euro Top is our top recommendation for back pain -- firm hybrid pocket-spring support with a cooling memory foam layer. Any of our hybrid pocket spring ranges support the spine; firmness should be matched to the customer's sleep position."],
  ["Which mattress is best for hot sleepers?", "The Cool Fiora and Cool Fabric Milano models, built with cooling/antistatic fabric covers, are best suited to hot sleepers or warmer bedrooms."],
  ["How do I pay?", "Either in full via MTN MoMo Pay (dial *165*3#, select Pay Merchant, enter Merchant Code 725905), or with a small commitment fee (UGX 50,000 Double/Queen, UGX 100,000 King) to secure the order and pay the balance in cash on delivery. The registered name Matelas Distributors will show on screen -- this is correct."],
  ["Do you sell anything besides mattresses?", "Yes -- our Belona Turkish Classic premium collection includes matching bedroom and living room furniture: an electric adjustable bed base, the Venice Sofa (genuine vegan leather), and the Venice TV Stand."],
  ["Can I negotiate the price?", "Prices shown already reflect our current promotional discount (30% or 40% off, depending on the range). Speak to a branch representative for any bulk or hospitality-order pricing."],
];

export function FaqSection() {
  return <section className="faq-section"><div className="faq-heading"><p className="eyebrow">Frequently asked questions</p><h2>Answers before you choose.</h2><p>Find quick answers about our products, delivery, payment options, and promotions.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <article className="faq-item" key={question}><h3>Q: {question}</h3><p><strong>A:</strong> {answer}</p></article>)}</div></section>;
}