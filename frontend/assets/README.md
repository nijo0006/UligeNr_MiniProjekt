# Hotel Kong Arthur visual assets

Requested by the user on 2026-11-03 for this local hotel prototype.

Room photographs and the hotel wordmark originate from Hotel Kong Arthur / Arthur Hotels:
https://arthurhotels.dk/hotel-kong-arthur/vaerelser/

The eight type/image/source-page associations are recorded in ../roomPhotos.js.
Images are unchanged 768×512 variants referenced by the official room overview. They
illustrate room categories, not the generated inventory's individual room numbers.
Ownership of the hotel photographs and wordmark remains with their original owners.

The wordmark SVG is the header `ka-logo` from the same public page.

Typography and colors were inspected in the live site's theme style.css and room block
stylesheet on 2026-11-03. The theme uses Barlow for body text and the headline stack
Miller, Times New Roman, Times, serif. Its Miller @font-face is commented out and the
referenced miller.woff returns 404; the app preserves the actual headline fallback stack
rather than substituting an unrelated font or claiming a Miller file was obtained.

Barlow regular (400) and medium (500) are served locally, with the SIL Open Font License
in fonts/OFL-Barlow.txt. Files are the Google Fonts responses used by the official site:
https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7EPCw.ttf
https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3_-gc4A.ttf
License: https://github.com/google/fonts/blob/main/ofl/barlow/OFL.txt

Reference colors: beige #f4efeb, paper #fcfaf1, dark gray #4b4845, latte #d0c2b2,
brown #a66a0a, rose #a97b6b and green #053621. Runtime assets are local: no external
font/photo requests or third-party tracking scripts are introduced.
