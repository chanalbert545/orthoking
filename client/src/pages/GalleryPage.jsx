import "../styles/public-pages.css";

const products = [
  ["Cool Fabric Milano", "coolfabricmilano.png"],
  ["Firm Edge Support", "firmedgesupport.png"],
  ["Foam Encasement", "foamencasement.png"],
  ["Foam Topper", "foamtopper.png"],
  ["Latex Foam Topper", "latexfoamtopper.png"],
  ["Smart Milano", "smartmillano.png"],
  ["Super Luxe", "superluxe.png"],
  ["Super Luxe Brown", "superluxebrown.png"],
  ["Super Rio", "superrio.png"],
  ["Super Tesla", "supertesla.png"],
  ["Tight Top Firm", "tighttopfirm2.png"],
];

export function GalleryPage() {
  return <div className="content-page">
    <section className="page-hero">
      <p className="eyebrow">Our products</p>
      <h1>Comfort designed around you.</h1>
      <p>Explore the mattresses, toppers and support solutions in the Dr. Ortho King collection.</p>
    </section>
    <section className="product-catalog" aria-label="Product catalogue">
      {products.map(([name, image]) => (
        <article className="catalog-card" key={image}>
          <div className="catalog-image"><img src={`/assets/${image}`} alt={name} /></div>
          <div className="catalog-card-content">
            <p className="eyebrow">Dr. Ortho King</p>
            <h2>{name}</h2>
            <a className="text-link" href="/shop">View product <span aria-hidden="true">→</span></a>
          </div>
        </article>
      ))}
    </section>
  </div>;
}
