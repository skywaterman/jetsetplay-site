const swatches = [
  { name: "Felt", value: "#173D32", className: "specimen__swatch--felt" },
  {
    name: "Oxblood",
    value: "#5A2030",
    className: "specimen__swatch--oxblood",
  },
  { name: "Bone", value: "#F5F1E8", className: "specimen__swatch--cream" },
  { name: "Lacquer", value: "#1A1A1A", className: "specimen__swatch--ink" },
  { name: "Brass", value: "#B08D57", className: "specimen__swatch--brass" },
  { name: "Pip", value: "#C8235F", className: "specimen__swatch--pip" },
];

export default function FoundationPage() {
  return (
    <main className="specimen">
      <header className="specimen__mast type-utility">
        <span>Foundation 01</span>
        <span>Type and material</span>
      </header>

      <section className="specimen__type" aria-label="Typography tokens">
        <div className="specimen__display">
          <p className="type-utility">Display</p>
          <p className="specimen__glyph" aria-label="Uppercase A and lowercase a">
            Aa
          </p>
          <div className="specimen__details">
            <p className="type-caption">Cormorant Garamond</p>
            <p className="type-utility">400 / 500</p>
          </div>
        </div>

        <div className="specimen__body">
          <p className="type-utility">Body and utility</p>
          <p className="specimen__alphabet">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            abcdefghijklmnopqrstuvwxyz
            <br />
            0123456789
          </p>
          <div className="specimen__details">
            <p className="type-caption">Instrument Sans 400 / 500 / 600</p>
            <a className="specimen__focus type-utility" href="/work">
              Focus
            </a>
          </div>
        </div>
      </section>

      <section aria-label="Color tokens">
        <header className="specimen__palette-head type-utility">
          <span>Palette</span>
          <span>06 tokens</span>
        </header>
        <div className="specimen__palette">
          {swatches.map((swatch) => (
            <div
              className={`specimen__swatch ${swatch.className}`}
              key={swatch.name}
            >
              <span className="type-utility">{swatch.name}</span>
              <span className="type-caption">{swatch.value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
