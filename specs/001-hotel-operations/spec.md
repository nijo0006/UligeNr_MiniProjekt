# Feature Specification: Hotel Operations and Performance Insights

**Feature Branch**: Ingen ny branch oprettet; der er ikke konfigureret nogen branch-hook.

**Feature Directory**: `specs/001-hotel-operations`

**Created**: 2026-10-27

**Last Updated**: 2026-10-28 — gruppens svar på Q1–Q23 er indarbejdet, og A10–A23 er godkendt.

**Status**: Draft — Clarify gennemført. Kun Q18 (dashboardets interaktioner) er udskudt.

**Input**: Brugerens beskrivelse (`/speckit-specify`):

Læs opgavebeskrivelsen og Excel-filen. Beskriv hvad systemet skal kunne, uden teknologivalg.
Brugere: hoteladministrator/beslutningstager, receptionist, Helene Christine (bar) og hotellets
eksisterende bookingsystem. Funktioner: (1) oprette, rette og slette bookinger via en
browserfrontend og via API'et; (2) data opdateres løbende, så nøgletallene viser aktuelle tal og
ikke kun historiske; (3) nøgletal: gæster pr. land, indtjening pr. værelsestype pr. sæson,
indtjening pr. land, hvilke værelser og lande der tjener mest, årets indtjening, belægningsgrad og
kundetilfredshed; (4) cocktailbar: samlet salg for året, omsætning pr. drink, procentfordeling
mellem cocktails og kaffe; (5) data til et interaktivt Tableau-dashboard via API'et. User stories
skrives som "Som [brugerrolle] ønsker jeg [mål], så [begrundelse]", efter INVEST, prioriteret med
MoSCoW og struktureret efter The Three Cs. Alt, der ikke står i materialet, markeres som antagelse
eller åbent spørgsmål. Gruppen vælger selv et ekstra nøgletal.

## Kildegrundlag og afgrænsning

- **K1 — Opgavebeskrivelse**: `E26 Tværfaglig Opgave Hotel Kong Arthur.pdf` (læst).
- **K2 — Tillægsspørgsmål**: `Tillægsspørgsmål_swa.pdf` (læst). Handler om arkitektur og
  fremlæggelse; tilføjer ingen funktionelle krav, men spørgsmål 9 bekræfter kravet om løbende data.
- **K3 — Excel-arbejdsbog**: `Hotel_Kong_Arthur_data-1.xlsx` (læst), ark: Oversigt, Bookinger
  (1.000 bookinger), Bar - Drinks (30 drinks), Værelsestyper, Hotelinfo, Indtjening pr. værelse,
  Indtjening pr. land, Noter.
- **K4 — Constitution**: `.specify/memory/constitution.md` v1.0.0. Dens arkitektur- og
  driftskrav gælder; denne spec træffer ingen nye teknologivalg.
- **K5 — Clarify-svar**: gruppens svar på Q1–Q20 af 2026-10-28 (se afsnittet Clarifications).
- Kildefilerne ligger i repo-roden, ikke i en `docs/`-mappe som nævnt i input.
- Browserfrontend, API-adgang og Tableau-dashboard er eksplicitte krav i opgaven (K1), ikke
  teknologivalg truffet her. Endpoints, dataformat og datamodel hører til Plan.

**Vigtige begrænsninger i datagrundlaget (K3)** og hvordan de håndteres efter Clarify:

- Bookingdata har **ingen datoer** og **ingen værelsesnumre**. Fremover skal alle bookinger have
  ankomst- og afrejsedato (Q2), og alle værelser har et nummer (Q11). De historiske bookinger får
  genererede datoer og værelsesnumre ved indlæsning (A6, A10).
- Der findes **ingen data om kundetilfredshed**. Den skal fremover indsamles med spørgeskemaer pr.
  værelse (Q14). De historiske bookinger får genererede testsvar (Q22, A23).
- Der er **ikke angivet antal personer pr. booking**. Det registreres fremover pr. værelse (Q9).
  For de historiske bookinger anslås det ud fra værelsestypen (Q23, A21).
- Bardata har **ingen datoer**; det er én samlet opgørelse pr. drink. Den fordeles over dagene i de
  samme 3 år som bookingerne (Q21, A22). Fremover registreres salget dagligt (Q8). Opgaven nævner
  vin og øl, men data indeholder kun cocktails (20) og kaffe (10).
- Nogle faktiske nattepriser ligger uden for opgavens prisintervaller (fx Standard Single op til
  1.498 DKK mod opgavens 900–1.200 DKK). Historiske priser beholdes uændret (Q2-afklaring).

## Clarifications

### Session 2026-10-28

- Q1: Bookingfelter? → A: Brugeren angiver fornavn, efternavn, land, værelsestype og ankomst-/
  afrejsedato. Systemet tildeler selv Booking ID og beregner nætter og pris ud fra sæson og
  værelsestype.
- Q2: Datoer? → A: Ja, alle bookinger skal have ankomst og afrejse, også de historiske.
  Opfølgning: De historiske bookinger får ved indlæsning en genereret ankomstdato i 2024–2026, som
  passer til deres sæsonkode og antal nætter. Deres oprindelige priser beholdes.
- Q3: Sæson? → A: Afledes af datoen. Højsæson: juni, juli, august. Mellemsæson: april, maj,
  september, oktober, november. Lavsæson: januar, februar, marts. Opfølgning om december: Gruppens
  første svar lagde december i mellemsæson, men opgaven (K1) nævner "juletid" som højsæson. Gruppen
  har afgjort, at **hele december er højsæson**.
- Q4: Sletning? → A: Bookinger skal kunne slettes/annulleres, og en annulleret booking skal ikke
  indgå i nøgletallene.
- Q5: Validering? → A: Intet indtastes frit, hvor der findes faste valgmuligheder; der vælges fra
  lister med gyldige værdier. Priser kan ikke indtastes; de beregnes automatisk ud fra værelsestype
  og nætter. Dubletter undgås, fordi Booking ID er unikt.
- Q5-opfølgning: Prisregel? → A: Nattepris pr. værelsestype = opgavens minimumspris i lavsæson,
  midtpunktet i mellemsæson og maksimumsprisen i højsæson. Pris i alt = summen af prisen for hver
  nat, så et ophold hen over et sæsonskift får begge priser.
- Q6: Adgang? → A: Nej, ingen forskellige rettigheder.
- Q7: "Live"? → A: Dynamisk data. Bookingsiden opdateres efter hver ny booking.
- Q8: Bardata? → A: Barsalg registreres én gang om dagen af lukkeholdet, så salget senere kan
  måles pr. dag.
- Q9: Gæster? → A: Begge dele: både bookinger og personer tælles. Én booking kan indeholde flere
  gæster og flere værelser. Bookingen står i én af gæsternes navn.
- Q10: Indtjening? → A: "Pris i alt" er inkl. alt. Barens omsætning skal med i årets indtjening.
- Q11: Værelser? → A: Værelserne skal være kategoriseret, så systemet ved, hvilke værelsesnumre der
  har hvilke værelsestyper.
- Q11-opfølgning: Antal pr. type? → A: De 214 værelser fordeles efter hver værelsestypes andel af
  de 1.000 bookinger (A10).
- Q12: År? → A: Data dækker 3 år.
- Q13: Belægningsgrad? → A: Formlen solgte værelsesnætter / (214 × 365), opgjort for ét år.
- Q14: Kundetilfredshed? → A: Indsamles med spørgeskemaer, koblet til værelserne, så tilfredshed
  kan ses pr. værelse.
- Q15: Ekstra nøgletal? → A: Overblik over værelsestyperne og antallet af værelser af hver type.
- Q16: Bar? → A: "Solgt totalt" vises både som beløb og antal. Procentfordelingen opgøres efter
  omsætning. Vin og øl får deres egen kategori.
- Q17: Hvem ser bartallene? → A: Helene ser dem sammen med administratoren.
- Q18: Interaktion i dashboardet? → A: Gruppen prøver forskellige muligheder og beslutter senere.
- Q19: Afrunding og tomme resultater? → A: Når der ikke er data, vises null. Én decimal.
- Q20: Bar versus værelser? → A: Barens omsætning kan stamme fra gæster udefra, som ikke har en
  booking. Tallene anses ikke for at være en testfejl, og de må lægges sammen.
- Q21: Historisk bardata uden datoer? → A: Fordeles over de 3 år ligesom de historiske bookinger,
  så bar og værelser dækker samme periode (A22).
- Q22: Spørgeskemaer? → A: Skala 1–5. Gæsten udfylder ved udtjekning, og receptionisten
  registrerer svaret. Der genereres testsvar til de historiske bookinger, så der er data at vise
  (A23).
- Q23: Personantal for historiske bookinger? → A: Anslås ud fra værelsestypen (A21).
- Antagelserne A10–A23 er godkendt af gruppen.

## User Scenarios & Testing *(mandatory)*

Hver story er struktureret efter **The Three Cs**:

- **Card**: selve storyen, kort nok til en post-it.
- **Conversation**: detaljer, beslutninger fra Clarify, antagelser (A#) og åbne spørgsmål (Q#).
- **Confirmation**: acceptkriterier, der kan tjekkes, og som bruges i Converge til at afgøre, om
  storyen er færdig.

**Prioritet (MoSCoW)** er et forslag (A1): Must = kræves af opgaven og kan leveres med det
foreliggende data; Should = kræves eller ønskes, men afhænger af data, der ikke findes endnu;
Could = nice to have; Won't = ikke i denne version.

**INVEST**: Hver story leverer én selvstændig værdi og kan testes alene mod et kendt datasæt.
Nøgletalsstories er uafhængige af hinanden og af bookingstories, fordi de kan testes mod de
udleverede data. Referenceværdier i acceptkriterierne er hentet fra arbejdsbogen (K3) og gælder
**kun, når systemet udelukkende indeholder seed-data fra Excel-filen** (de 1.000 bookinger og de 30
drinks, uden oprettede, rettede, annullerede bookinger eller registreret barsalg). Så snart data
ændres, gælder tallene ikke længere; så er facit en uafhængig beregning på de aktuelle data.
Tal, der afhænger af de genererede datoer (fx indtjening pr. år), har ingen fast referenceværdi;
facit er en uafhængig beregning på de indlæste data.

**Prisregel (Q5-opfølgning)** — nattepris i DKK pr. værelsestype og sæson:

| Værelsestype | Lavsæson (min) | Mellemsæson (midt) | Højsæson (maks) |
| --- | --- | --- | --- |
| Standard Single | 900 | 1.050 | 1.200 |
| Grand Lit | 1.100 | 1.250 | 1.400 |
| Standard Double | 1.200 | 1.400 | 1.600 |
| Superior Double | 1.400 | 1.700 | 2.000 |
| Junior Suite | 1.800 | 2.150 | 2.500 |
| Spa Executive | 2.000 | 2.400 | 2.800 |
| Suite | 2.500 | 3.000 | 3.500 |
| LOFT Suite | 3.000 | 3.500 | 4.000 |

**Sæson pr. måned (Q3)**: Lavsæson: januar–marts. Mellemsæson: april, maj, september–november.
Højsæson: juni–august og december. Hver nat får sæson efter den dato, natten starter.

---

### User Story 1 - Opret booking via browserfrontend (Prioritet: Must)

**Card**: Som receptionist ønsker jeg at kunne oprette en booking i browseren, så systemet altid
viser den aktuelle belægning.

**Hvorfor denne prioritet**: Opgaven kræver eksplicit, at bookinger kan oprettes via en
browserfrontend (K1). Uden oprettelse kan data ikke opdateres løbende.

**Uafhængig test**: Opret en booking i frontend og hent den igen, uden at dashboardet er nødvendigt.

**Conversation**:

- Receptionisten angiver: fornavn og efternavn (fritekst), land (vælges fra liste), ankomst- og
  afrejsedato (datovælger) samt ét eller flere værelser, hvor der for hvert værelse vælges
  værelsestype og antal gæster (1–4) fra lister (Q1, Q5, Q9).
- Systemet tildeler selv Booking ID og et ledigt værelsesnummer af den valgte type, og det
  beregner nætter (afrejse − ankomst), sæson og pris efter prisreglen (Q1, Q3, Q5). Priser kan ikke
  indtastes.
- Bookingen står i én gæsts navn, og landet er denne gæsts land (A15).
- Hvis der ikke er et ledigt værelse af den valgte type i hele perioden, afvises bookingen (A16).
- Afrejse skal ligge efter ankomst (A16).

**Confirmation (acceptkriterier)**:

1. **Givet** gyldige bookingoplysninger, **når** receptionisten opretter bookingen i
   browserfrontenden, **så** gemmes bookingen med et nyt Booking ID og kan hentes igen med de samme
   oplysninger.
2. **Givet** at en booking netop er oprettet, **når** bookingsiden vises, **så** indgår den nye
   booking uden manuel genindlæsning (Q7).
3. **Givet** en Suite fra 10. til 12. juli, **når** bookingen oprettes, **så** er nætter 2 og pris
   i alt 7.000 DKK (2 × 3.500).
4. **Givet** en Standard Single fra 30. maj til 2. juni, **når** bookingen oprettes, **så** er
   pris i alt 3.300 DKK (2 × 1.050 i mellemsæson + 1 × 1.200 i højsæson).
5. **Givet** at alle værelser af en type er optaget i perioden, **når** receptionisten forsøger at
   booke typen, **så** gemmes bookingen ikke, og receptionisten får besked om hvorfor.
6. **Givet** formularen, **når** receptionisten udfylder den, **så** kan land, værelsestype og antal
   gæster kun vælges blandt gyldige værdier, og der findes intet prisfelt.

---

### User Story 2 - Ret booking via browserfrontend (Prioritet: Must)

**Card**: Som receptionist ønsker jeg at kunne rette en eksisterende booking i browseren, så
bookingoplysningerne altid er korrekte.

**Hvorfor denne prioritet**: Kræves eksplicit af opgaven (K1).

**Uafhængig test**: Ret en kendt booking i frontend og hent den igen.

**Conversation**:

- De samme felter som ved oprettelse kan rettes. Booking ID kan ikke ændres (Q1, Q5).
- Ændres datoer eller værelser, genberegnes pris, nætter og sæson efter prisreglen, også for en
  historisk booking (A11).
- Ved to samtidige rettelser af samme booking gælder den seneste gemte (A19).

**Confirmation (acceptkriterier)**:

1. **Givet** en eksisterende booking, **når** receptionisten retter et felt og gemmer, **så** kan
   samme booking hentes med den rettede værdi og uændret Booking ID.
2. **Givet** en booking, hvor afrejsedatoen rykkes én nat, **når** den gemmes, **så** er nætter og
   pris genberegnet efter prisreglen.
3. **Givet** en rettelse, der ikke kan gennemføres (fx intet ledigt værelse), **når** receptionisten
   gemmer, **så** forbliver bookingen uændret, og receptionisten får besked om hvorfor.

---

### User Story 3 - Annullér booking via browserfrontend (Prioritet: Must)

**Card**: Som receptionist ønsker jeg at kunne annullere en booking i browseren, så bookinger, der
ikke længere gælder, ikke tæller med i belægning og nøgletal.

**Hvorfor denne prioritet**: Kræves eksplicit af opgaven (K1).

**Uafhængig test**: Annullér en kendt booking i frontend og kontrollér, at den ikke længere vises som
aktiv, og at nøgletallene ændres.

**Conversation**:

- En annulleret booking indgår ikke i nøgletallene (Q4). Den markeres som annulleret i stedet for
  at blive fjernet helt, så tilknyttede spørgeskemaer ikke går tabt (A18).
- Værelset bliver ledigt igen i perioden.

**Confirmation (acceptkriterier)**:

1. **Givet** en eksisterende booking, **når** receptionisten annullerer den, **så** vises den ikke
   længere blandt aktive bookinger og indgår ikke i nøgletallene.
2. **Givet** en annulleret booking, **når** et andet ophold bookes på samme værelse i samme periode,
   **så** er værelset ledigt.
3. **Givet** en booking, der allerede er annulleret, **når** annullering forsøges igen, **så** får
   brugeren besked om, at bookingen ikke er aktiv.

---

### User Story 4 - Bookingsystemet opretter, retter og annullerer bookinger via API'et (Prioritet: Must)

**Card**: Som hotellets eksisterende bookingsystem ønsker jeg at kunne oprette, rette og annullere
bookinger via API'et, så bookinger fra hotellets drift kommer ind i systemet uden manuel indtastning.

**Hvorfor denne prioritet**: Opgaven siger, at hotellets nuværende bookingsystem skal kunne skrive
til API'et (K1). Det er også den primære kilde til løbende data.

**Uafhængig test**: Send en oprettelse, en rettelse og en annullering gennem API'et og kontrollér
resultatet ved at hente bookingen igen, uden brug af browserfrontenden.

**Conversation**:

- De samme bookingregler gælder som i frontend (Story 1–3), inkl. automatisk pris og ingen
  prisfelt (A5, Q5).
- Bookingsystemet har samme rettigheder som receptionisten (Q6).
- Storyen kan deles op i tre (opret, ret, annullér), hvis gruppen finder den for stor til ét estimat.

**Confirmation (acceptkriterier)**:

1. **Givet** gyldige bookingoplysninger, **når** bookingsystemet opretter en booking via API'et,
   **så** gemmes den med en beregnet pris og kan hentes igen med de samme oplysninger.
2. **Givet** en eksisterende booking, **når** bookingsystemet retter den via API'et, **så** kan
   samme booking hentes med de rettede værdier.
3. **Givet** en eksisterende booking, **når** bookingsystemet annullerer den via API'et, **så** vises
   den ikke længere blandt aktive bookinger.
4. **Givet** ugyldige oplysninger eller en medsendt pris, **når** bookingsystemet sender dem, **så**
   afvises kaldet med en forklarende fejl, og ingen data ændres.
5. **Givet** en booking oprettet via API'et, **når** receptionisten har bookingsiden åben, **så**
   vises bookingen der også (Q7).

---

### User Story 5 - Nøgletal viser aktuelle data (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg, at nøgletallene opdateres løbende, når bookinger
ændres, så jeg træffer beslutninger på aktuelle tal og ikke kun historiske.

**Hvorfor denne prioritet**: Opgaven kræver et system, der "løbende kan opdatere data, og som kan
vise data live, og altså ikke kun historisk" (K1, K2 spm. 9).

**Uafhængig test**: Notér et nøgletal, opret eller annullér en booking, der påvirker det, og
kontrollér, at nøgletallet ændrer sig tilsvarende.

**Conversation**:

- Data er dynamiske: nøgletal afspejler altid de aktuelle data, og bookingsiden opdateres efter
  hver ny booking (Q7).
- Barsalg opdateres én gang dagligt af lukkeholdet (Q8, Story 19).
- De 1.000 historiske bookinger og bardata indlæses som udgangspunkt (A6).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, hvor den samlede indtjening fra
   værelser er 11.234.034 DKK, **når** der oprettes en booking med pris i alt X DKK, **så** viser
   den samlede indtjening fra værelser 11.234.034 + X DKK.
2. **Givet** en booking, der annulleres, **når** nøgletallene hentes, **så** indgår bookingen ikke
   længere i dem.
3. **Givet** en rettelse af land eller værelsestype på en booking, **når** nøgletallene hentes,
   **så** flyttes bookingens bidrag til den nye gruppe.

---

### User Story 6 - Gæster pr. land (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se, hvor gæsterne kommer fra, så jeg kan målrette
markedsføring mod de vigtigste lande.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvor kommer gæsterne fra (lande)" (K1).

**Uafhængig test**: Indlæs det udleverede datasæt og sammenlign antal bookinger pr. land med
arbejdsbogens ark "Indtjening pr. land".

**Conversation**:

- Der vises både antal bookinger og antal personer pr. land (Q9).
- Personantal registreres pr. værelse fremover. For de historiske bookinger er det anslået ud fra
  værelsestypen (Q23, A21), så persontallene for seed-data er et estimat.
- Landet er landet for den gæst, bookingen står i (A15).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** gæster pr. land vises,
   **så** vises alle 20 lande med antal bookinger, og summen er 1.000.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** gæster pr. land vises,
   **så** har South Korea flest bookinger (63), og tallene for hvert land matcher arbejdsbogen.
3. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** antal personer pr. land
   vises, **så** er summen 2.226 personer (A21), og hvert land matcher en uafhængig beregning.
4. **Givet** en ny booking med to værelser med 2 og 3 gæster, **når** gæster pr. land vises, **så**
   stiger bookingtallet for landet med 1 og persontallet med 5.

---

### User Story 7 - Indtjening pr. værelsestype pr. sæson (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se indtjening pr. værelsestype fordelt på sæson,
så jeg kan vurdere prissætningen i lav-, mellem- og højsæson.

**Hvorfor denne prioritet**: Krav i opgaven: indtjening "pr værelsestype (pr sæson)" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Indtjening pr. værelse".

**Conversation**:

- Sæson afledes af datoen (Q3). De historiske bookinger får datoer i deres oprindelige sæson, så
  arbejdsbogens tal fortsat gælder (A6).
- Indtjening er summen af "Pris i alt" (A2, bekræftet i Q10).
- For et ophold hen over et sæsonskift fordeles prisen på sæsonerne efter nætterne (prisreglen).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** indtjening pr.
   værelsestype pr. sæson vises, **så** vises alle 8 værelsestyper × 3 sæsoner, og hver værdi
   matcher arbejdsbogen.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **så** er sæsontotalerne
   lavsæson 3.354.077 DKK, mellemsæson 3.809.387 DKK og højsæson 4.070.570 DKK.

---

### User Story 8 - Indtjening pr. land (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se indtjening pr. land, så jeg kan se, hvilke
markeder der bidrager mest økonomisk.

**Hvorfor denne prioritet**: Krav i opgaven: indtjening "pr land" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Indtjening pr. land".

**Conversation**:

- En booking har ét land: landet for den gæst, bookingen står i (A15).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** indtjening pr. land
   vises, **så** matcher hvert lands indtjening arbejdsbogen, og summen er 11.234.034 DKK.

---

### User Story 9 - Hvilke værelsestyper tjener mest (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se, hvilke værelsestyper der tjener flest penge, så
jeg ved, hvilke værelser der er vigtigst for forretningen.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvilke værelser tjener Kong Arthur flest penge på?" (K1).

**Uafhængig test**: Sammenlign rangordningen med arbejdsbogens ark "Indtjening pr. værelse".

**Conversation**:

- Værelserne har nu numre (Q11), men de historiske bookingers værelsesnumre er genererede (A10).
  Rangordning pr. værelsestype er derfor Must, mens rangordning af enkelte værelser er Could.
- Lige store værdier vises i samme placering, sorteret alfabetisk (A19).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** værelsestyperne
   rangordnes efter indtjening, **så** er rækkefølgen øverst Suite (2.119.671 DKK), Spa Executive
   (1.722.396 DKK) og LOFT Suite (1.695.405 DKK), og hele rangordningen matcher arbejdsbogen.

---

### User Story 10 - Hvilke lande tjener mest (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se, hvilke lande hotellet tjener flest penge på, så
jeg kan prioritere de mest værdifulde markeder.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvilke lande tjener Kong Arthur flest penge på?" (K1).

**Uafhængig test**: Sammenlign rangordningen med arbejdsbogens ark "Indtjening pr. land".

**Conversation**:

- Bemærk, at flest gæster og flest penge ikke nødvendigvis er samme land (fx har Sweden og India
  flere bookinger end United Kingdom, men lavere indtjening).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** landene rangordnes efter
   indtjening, **så** er rækkefølgen øverst South Korea (767.699 DKK), China (722.928 DKK) og United
   Kingdom (698.290 DKK), og hele rangordningen matcher arbejdsbogen.

---

### User Story 11 - Årets indtjening (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se årets samlede indtjening for hotellet, så jeg kan
vurdere hotellets økonomiske resultat.

**Hvorfor denne prioritet**: Krav i opgaven: "Beregn årets indtjening for hotellet" (K1).

**Uafhængig test**: Sammenlign summen for alle år med arbejdsbogens ark "Oversigt".

**Conversation**:

- Data dækker 3 år (Q12), her 2024–2026 (A3). Indtjeningen vises pr. år, og brugeren kan vælge
  året; standard er indeværende år (A3).
- En nats indtjening tilhører det år, natten ligger i.
- Barens omsætning indgår i årets indtjening (Q10, Q20). Værelser og bar vises også hver for sig.
- Historisk bardata er fordelt over dagene i de samme 3 år (Q21, A22), så hvert år har både
  værelses- og barindtjening.

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** indtjeningen fra
   værelser lægges sammen for alle tre år, **så** er den 11.234.034 DKK.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** indtjeningen for et
   enkelt år vises, **så** matcher den en uafhængig beregning på de indlæste datoer.
3. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** den samlede indtjening
   for værelser og bar lægges sammen for alle tre år, **så** er den 24.682.674,3 DKK.
4. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** årets indtjening for et
   enkelt år vises, **så** er den summen af årets værelses- og barindtjening, og den matcher en
   uafhængig beregning.

---

### User Story 12 - Belægningsgrad (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se hotellets belægningsgrad, så jeg kan planlægge
kampagner i perioder med lav belægning.

**Hvorfor denne prioritet**: Opgaven siger, at systemet skal kunne beregne belægningsgrader (K1), og
nævner "Hvordan beregnes belægningsgraden?" som Clarify-spørgsmål.

**Uafhængig test**: Beregn belægningsgraden for et år med formlen og sammenlign.

**Conversation**:

- Formel (Q13): solgte værelsesnætter i året / (214 × 365). Et værelse i en booking med flere
  værelser tæller som sine egne nætter.
- 214 er antallet af værelser i systemet (Q11, A10).
- Annullerede bookinger tæller ikke med (Q4).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** belægningsgraden for et
   år vises, **så** matcher den en uafhængig beregning med formlen, afrundet til én decimal (Q19).
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** belægningsgraderne for de
   tre år lægges sammen og deles med 3, **så** er resultatet 2,3 % (5.379 / (214 × 365 × 3)).
3. **Givet** at en booking oprettes eller annulleres, **når** nøgletallene hentes, **så** ændres
   belægningsgraden tilsvarende.

---

### User Story 13 - Kundetilfredshed pr. værelse (Prioritet: Should)

**Card**: Som hoteladministrator ønsker jeg at se gæsternes tilfredshed pr. værelse, så jeg kan
følge med i, om gæsterne er tilfredse med deres ophold.

**Hvorfor denne prioritet**: Opgaven nævner kundetilfredshed som eksempel på et nøgletal (K1).
Datakilde, skala og registrering er nu afgjort (Q14, Q22), og der er testdata at vise. Gruppen kan
flytte den til Must.

**Uafhængig test**: Registrér kendte spørgeskemasvar og sammenlign gennemsnittet pr. værelse med en
uafhængig beregning.

**Conversation**:

- Et spørgeskemasvar hører til ét værelse i én booking, så tilfredshed kan ses pr. værelse og pr.
  værelsestype (Q14).
- Skala 1–5; målet er gennemsnittet (Q22, A14).
- Gæsten udfylder spørgeskemaet ved udtjekning, og receptionisten registrerer svaret i
  browserfrontenden (Q22). Scoren vælges fra en liste (Q5).
- De historiske bookinger får genererede testsvar, som er markeret som testdata (Q22, A23).

**Confirmation (acceptkriterier)**:

1. **Givet** en booking ved udtjekning, **når** receptionisten registrerer en score fra 1 til 5 for
   et af bookingens værelser, **så** gemmes svaret og indgår i tilfredsheden for værelset.
2. **Givet** spørgeskemasvar for et værelse, **når** tilfredsheden vises, **så** matcher
   gennemsnittet en uafhængig beregning, afrundet til én decimal.
3. **Givet** et værelse uden spørgeskemasvar, **når** tilfredsheden vises, **så** vises null (Q19).
4. **Givet** at systemet kun indeholder seed-data, **når** tilfredsheden vises, **så** er der data
   for værelserne fra de genererede testsvar, og det fremgår, at det er testdata (A23).

---

### User Story 14 - Overblik over værelsestyper og antal værelser (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg et overblik over værelsestyperne og antallet af værelser
af hver type, så jeg kan se, hvordan hotellets kapacitet er fordelt.

**Hvorfor denne prioritet**: Krav i opgaven: "Find også selv et interessant nøgletal at vise" (K1).
Gruppen har valgt dette nøgletal (Q15).

**Uafhængig test**: Tæl værelserne pr. type og sammenlign med fordelingen i A10.

**Conversation**:

- Fordelingen af de 214 værelser følger A10:

| Værelsestype | Antal værelser | Værelsesnumre (A10) |
| --- | --- | --- |
| Standard Single | 25 | 1–25 |
| Grand Lit | 25 | 26–50 |
| Standard Double | 25 | 51–75 |
| Superior Double | 29 | 76–104 |
| Junior Suite | 29 | 105–133 |
| Spa Executive | 30 | 134–163 |
| Suite | 29 | 164–192 |
| LOFT Suite | 22 | 193–214 |

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data, **når** overblikket vises, **så** vises alle 8
   værelsestyper med antallene i tabellen ovenfor, og summen er 214.

---

### User Story 15 - Barens samlede salg for året (Prioritet: Must)

**Card**: Som Helene Christine ønsker jeg at se, hvor meget jeg har solgt i alt i baren for året,
så jeg kan følge barens resultat.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvor meget har Helene Christine solgt totalt for året" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Bar - Drinks".

**Conversation**:

- "Solgt totalt" vises både som beløb og som antal enheder (Q16).
- Helene og administratoren ser de samme bartal (Q17).
- Omsætningen omfatter også gæster udefra uden booking (Q20).
- Historisk bardata er fordelt over dagene i de 3 år (Q21, A22). "For året" vises derfor pr. år,
  og summen for alle tre år er arbejdsbogens tal.

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** barens salg lægges
   sammen for alle tre år, **så** er omsætningen 13.448.640,3 DKK, og antal solgte enheder er
   179.958.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** barens salg for et
   enkelt år vises, **så** matcher beløb og antal en uafhængig beregning på de fordelte data.

---

### User Story 16 - Omsætning pr. drink (Prioritet: Must)

**Card**: Som Helene Christine ønsker jeg at se omsætningen for hver drink, så jeg kan se, hvilke
drinks der sælger bedst.

**Hvorfor denne prioritet**: Krav i opgaven: "Vis omsætning pr drink" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Bar - Drinks".

**Conversation**:

- Omsætning pr. drink = pris × solgte enheder (arbejdsbogens formel). Prisen gemmes sammen med hvert
  dagligt salg, så en senere prisændring ikke ændrer gammel omsætning (A13).
- Vin og øl får deres egen kategori (Q16), men der er ingen startdata for dem.

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** omsætning pr. drink
   vises, **så** vises alle 30 drinks (20 cocktails og 10 kaffetyper) med omsætning, der matcher
   arbejdsbogen.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **så** er Espresso den drink med
   højest omsætning.

---

### User Story 17 - Procentfordeling mellem kategorier i baren (Prioritet: Must)

**Card**: Som Helene Christine ønsker jeg at se procentfordelingen mellem cocktails og kaffe, så jeg
kan se, hvad baren lever af.

**Hvorfor denne prioritet**: Krav i opgaven: "Vis procentfordeling af cocktails og kaffe for
Helene Christine" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens fordelingstabel i "Bar - Drinks".

**Conversation**:

- Fordelingen opgøres efter omsætning (Q16).
- Vin og øl indgår som egne kategorier, når der er salg (Q16, A20).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** fordelingen vises, **så**
   er den 52,8 % cocktails og 47,2 % kaffe, og andelene summerer til 100 %.
2. **Givet** registreret salg af vin eller øl, **når** fordelingen vises, **så** indgår kategorien
   med sin andel af omsætningen.

---

### User Story 18 - Interaktivt Tableau-dashboard med data fra API'et (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg et interaktivt Tableau-dashboard, der henter
nøgletallene fra API'et, så jeg kan undersøge hotellets og barens tal ét sted.

**Hvorfor denne prioritet**: Krav i opgaven: interaktivt Tableau-dashboard "med udgangspunkt i
backendens REST API" (K1).

**Uafhængig test**: Lever et kendt sæt nøgletal gennem API'et og kontrollér, at dashboardet viser
de samme værdier, og at mindst én interaktion virker.

**Conversation**:

- Gruppen afprøver forskellige interaktioner og beslutter senere (Q18). Oplagte kandidater nu, hvor
  der er datoer: filtrering på år, måned, sæson, land og værelsestype.
- Helene og administratoren bruger samme dashboard (Q17).
- Hvor nøgletallene beregnes (i backend eller i Tableau), hører til Plan, men K2 spm. 4 forventer
  en begrundelse.

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** dashboardet indlæses,
   **så** viser det alle nøgletal fra Story 6–12 og 14–17 med værdier, der matcher API'ets data.
2. **Givet** et dashboard med data, **når** brugeren anvender en interaktion, **så** ændres de viste
   tal, så de svarer til valget.
3. **Givet** en bookingændring, der påvirker et nøgletal, **når** dashboardets data opdateres,
   **så** viser det den nye værdi.

---

### User Story 19 - Lukkeholdet registrerer dagens barsalg (Prioritet: Must)

**Card**: Som medarbejder på lukkeholdet ønsker jeg at registrere dagens salg pr. drink, så baren
kan måle salget på de forskellige dage.

**Hvorfor denne prioritet**: Gruppen har besluttet, at barsalg registreres dagligt (Q8). Uden det
kan barens tal ikke opdateres løbende.

**Uafhængig test**: Registrér salg for én dag og kontrollér, at barens nøgletal og salget pr. dag
ændres tilsvarende.

**Conversation**:

- Der registreres antal solgte enheder pr. drink for én dato. Drinks vælges fra en liste (Q5).
- Der er højst én registrering pr. drink pr. dag; en ny registrering for samme drink og dag
  erstatter den gamle (A13).
- Lukkeholdet har samme rettigheder som de øvrige brugere (Q6).

**Confirmation (acceptkriterier)**:

1. **Givet** at lukkeholdet registrerer 10 Mojito for en dato, **når** barens samlede salg vises,
   **så** er omsætningen steget med 10 × Mojitos pris, og antal enheder med 10.
2. **Givet** registreret salg for flere dage, **når** salget pr. dag vises, **så** vises hver dag med
   sin egen omsætning.
3. **Givet** en dag uden registreret salg, **når** salget for dagen vises, **så** vises null (Q19).

---

### User Story 20 - Månedlig belægningsrapport (Prioritet: Should)

**Card**: Som hoteladministrator ønsker jeg at se en rapport over månedlige belægningsgrader, så jeg
kan planlægge kampagner.

**Hvorfor denne prioritet**: Opgavens eget eksempel (K1). Var Won't, fordi data manglede datoer; det
er nu muligt (Q2). Should, fordi Q13 kun kræver belægning for et år.

**Uafhængig test**: Beregn belægningen for én måned og sammenlign.

**Conversation**:

- Formel som Story 12, men for en måned: solgte værelsesnætter i måneden / (214 × dage i måneden).

**Confirmation (acceptkriterier)**:

1. **Givet** de indlæste data, **når** belægningen for en måned vises, **så** matcher den en
   uafhængig beregning, afrundet til én decimal.

---

### Could og Won't (ikke i denne version — forslag)

- **Could — Rangordning af enkelte værelser**: Muligt nu, hvor værelser har numre (Q11), men de
  historiske værelsesnumre er genererede (A10), så resultatet siger mest om nye bookinger.
- **Won't — Login og forskellige rettigheder**: Fravalgt i Q6.

### Edge Cases

- Afrejse før eller samme dag som ankomst: afvises (A16).
- Intet ledigt værelse af den valgte type i perioden: afvises med besked (A16).
- Ophold hen over et sæsonskift eller årsskifte: prisen beregnes pr. nat, og hver nat tælles i sin
  egen sæson og sit eget år.
- Forsøg på at angive pris i frontend eller API: ikke muligt i frontend; afvises i API'et (Q5).
- Rettelse eller annullering af en booking, der ikke findes eller allerede er annulleret: besked til
  brugeren.
- Samtidige rettelser af samme booking: den seneste gemte gælder (A19).
- Historiske priser uden for opgavens prisintervaller: beholdes, indtil bookingen rettes (A11).
- Ingen data (fx et værelse uden spørgeskemasvar, en dag uden registreret barsalg): null (Q19).
- Datoer efter systemets startdag: de genererede historiske data indeholder hverken barsalg eller
  spørgeskemasvar efter startdagen, fordi de ikke kan være sket endnu (A22, A23).
- Lige store værdier i rangordninger: samme placering, alfabetisk orden (A19).

## Requirements *(mandatory)*

### Functional Requirements

| ID | Krav | Story |
| --- | --- | --- |
| FR-001 | Receptionisten MUST kunne oprette bookinger via en browserfrontend. | 1 |
| FR-002 | Receptionisten MUST kunne rette bookinger via en browserfrontend. | 2 |
| FR-003 | Receptionisten MUST kunne annullere bookinger via en browserfrontend. | 3 |
| FR-004 | Hotellets bookingsystem MUST kunne oprette, rette og annullere bookinger via API'et. | 4 |
| FR-005 | Samme bookingregler MUST gælde, uanset om ændringen kommer fra frontend eller API. | 1–4; A5 |
| FR-006 | Ugyldige bookingændringer MUST afvises med en forklarende besked uden at ændre data. | 1–4 |
| FR-007 | Nøgletal MUST afspejle de aktuelle data, og bookingsiden MUST opdateres efter hver ny booking. | 5; Q7 |
| FR-008 | Systemet MUST vise antal bookinger og antal personer pr. land. | 6; Q9 |
| FR-009 | Systemet MUST vise indtjening pr. værelsestype pr. sæson. | 7; Q3 |
| FR-010 | Systemet MUST vise indtjening pr. land. | 8 |
| FR-011 | Systemet MUST rangordne værelsestyper efter indtjening. | 9 |
| FR-012 | Systemet MUST rangordne lande efter indtjening. | 10 |
| FR-013 | Systemet MUST vise årets indtjening pr. år, inkl. barens omsætning. | 11; Q10, Q12 |
| FR-014 | Systemet MUST vise belægningsgrad for et år efter formlen i Q13. | 12; Q13 |
| FR-015 | Systemet SHOULD registrere spørgeskemasvar pr. booket værelse og vise tilfredshed pr. værelse. | 13; Q14 |
| FR-016 | Systemet MUST vise værelsestyperne og antallet af værelser af hver type. | 14; Q15 |
| FR-017 | Systemet MUST vise barens samlede salg som både beløb og antal. | 15; Q16 |
| FR-018 | Systemet MUST vise omsætning pr. drink. | 16 |
| FR-019 | Systemet MUST vise procentfordelingen mellem barens kategorier efter omsætning. | 17; Q16 |
| FR-020 | Systemet MUST stille nøgletallene til rådighed via API'et til et interaktivt Tableau-dashboard. | 18 |
| FR-021 | De 1.000 historiske bookinger og bardata fra K3 MUST kunne indlæses som startdata, med genererede datoer og værelsesnumre for bookingerne. | 5–17; A6, A10 |
| FR-022 | Systemet MUST vise null, hvor data mangler, og afrunde beløb og procenter til én decimal. | 6, 13, 19; Q19 |
| FR-023 | Systemet MUST selv tildele Booking ID og beregne nætter, sæson og pris efter prisreglen; pris MUST NOT kunne indtastes. | 1–4; Q1, Q5 |
| FR-024 | Systemet MUST tildele et ledigt værelse af den valgte type og MUST NOT dobbeltbooke et værelse. | 1–4; A16 |
| FR-025 | En booking MUST kunne indeholde flere værelser, hver med 1–4 gæster. | 1, 6; Q9 |
| FR-026 | Lukkeholdet MUST kunne registrere dagens salg pr. drink, og salget MUST kunne vises pr. dag. | 19; Q8 |
| FR-027 | Felter med faste valgmuligheder MUST vælges fra lister med gyldige værdier. | 1, 19; Q5 |
| FR-028 | Systemet SHOULD vise månedlig belægningsgrad. | 20 |

### Key Entities *(include if feature involves data)*

Konceptuelle begreber fra K1, K3 og K5, ikke en datamodel (den hører til Plan):

- **Booking**: Booking ID, gæstens fornavn, efternavn og land, ankomst, afrejse og status
  (aktiv/annulleret). Indeholder ét eller flere bookede værelser. Nætter og sæson er afledt.
- **Booket værelse**: Ét værelse i en booking med antal gæster (1–4) og pris for opholdet.
- **Værelse**: 214 værelser med nummer, hvert af én værelsestype (A10).
- **Værelsestype**: 8 typer med prisinterval pr. nat fra K1.
- **Pris**: Nattepris pr. værelsestype pr. sæson (prisreglen).
- **Sæson**: Lav, mellem, høj, afledt af måneden (Q3).
- **Land**: Landet for den gæst, bookingen står i.
- **Drink**: Navn, kategori og pris.
- **Drinkkategori**: Cocktail, Kaffe, Vin og Øl (Q16, A20).
- **Barsalg**: Antal solgte enheder af én drink på én dag, med prisen på salgstidspunktet (Q8).
- **Spørgeskemasvar**: Score 1–5 for ét booket værelse, registreret af receptionisten ved
  udtjekning, med markering af om svaret er testdata (Q14, Q22).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Foreslåede kriterier (A8). Der er ikke opfundet svartider, brugerantal eller lignende mål, da
materialet ikke nævner sådanne.

- **SC-001**: Alle Must-stories består deres acceptkriterier i Converge.
- **SC-002**: Når systemet kun indeholder seed-data fra Excel-filen, matcher alle nøgletal fra
  Story 6–10 og 15–17 samt totalen i Story 11 arbejdsbogens værdier (K3), afrundet til én decimal.
- **SC-003**: En booking oprettet, rettet eller annulleret via frontend eller API indgår i nøgletal
  og dashboard, og bookingsiden viser den uden manuel genindlæsning.
- **SC-004**: Receptionisten kan oprette, rette og annullere en booking i frontenden uden hjælp
  udefra på første forsøg ved fremlæggelsen.
- **SC-005**: Dashboardet viser samme værdier som API'et for alle viste nøgletal, og mindst én
  interaktion ændrer visningen korrekt.

## Assumptions

Alt her står ikke direkte i materialet eller i gruppens svar. A10–A23 er godkendt af gruppen
(2026-10-28).

- **A1 — MoSCoW-prioriteter**: Prioriteterne er specens forslag, ikke opgavens.
- **A2 — Indtjening**: Indtjening = summen af "Pris i alt". Bekræftet i Q10.
- **A3 — År**: De 3 år (Q12) er 2024–2026. Årstal vælges i visningen; standard er indeværende år.
- **A5 — Samme regler i begge kanaler**: Frontend og API følger samme bookingregler.
- **A6 — Startdata**: De 1.000 historiske bookinger indlæses med en genereret ankomstdato i
  2024–2026, så hele opholdet ligger i bookingens oprindelige sæson. Pris i alt beholdes uændret.
  Nye ændringer lægges oveni.
- **A8 — Succeskriterier**: SC-001–SC-005 er forslag til, hvordan specen kan vurderes.
- **A9 — Referenceværdier**: Arbejdsbogens beregnede værdier bruges som facit i acceptkriterierne,
  og kun i tilstanden, hvor systemet udelukkende indeholder seed-data fra Excel-filen.
- **A10 — Værelsesfordeling**: De 214 værelser fordeles efter værelsestypens andel af de 1.000
  bookinger (største-rest-metoden) og nummereres fortløbende pr. type (se Story 14). De historiske
  bookinger får tildelt et ledigt værelse af deres type ved indlæsning.
- **A11 — Historiske priser**: En historisk booking beholder sin oprindelige pris, indtil datoer
  eller værelser rettes; så genberegnes prisen efter prisreglen.
- **A12 — Historisk personantal**: Erstattet af A21 (Q23).
- **A13 — Barsalg**: Højst én registrering pr. drink pr. dag; prisen gemmes med salget.
- **A14 — Tilfredshedsskala**: Score 1–5; mål = gennemsnit. Bekræftet i Q22.
- **A15 — Land**: En booking har ét land: landet for den gæst, bookingen står i.
- **A16 — Bookingregler**: Afrejse skal ligge efter ankomst. Uden ledigt værelse af den valgte type
  i hele perioden afvises bookingen.
- **A17 — Landeliste**: Listen indeholder alle lande, ikke kun de 20 fra data, så gæster fra nye
  lande kan bookes.
- **A18 — Annullering**: En annulleret booking markeres som annulleret i stedet for at blive fjernet,
  og den indgår ikke i nøgletal.
- **A19 — Samtidighed og lige værdier**: Den seneste gemte rettelse gælder. Lige store værdier i en
  rangordning får samme placering og vises alfabetisk.
- **A20 — Vin og øl**: Vin og øl er to separate kategorier ("sin egen kategori" tolket som én hver).
- **A21 — Anslået personantal (Q23)**: Hver historisk booking har ét værelse med dette antal
  gæster, anslået ud fra værelsestypens navn og beskrivelse i K1:

  | Værelsestype | Gæster | Begrundelse |
  | --- | --- | --- |
  | Standard Single | 1 | Enkeltværelse |
  | Grand Lit | 2 | Grand lit-seng; "kompakt dobbeltværelse" |
  | Standard Double | 2 | Dobbeltværelse |
  | Superior Double | 2 | Dobbeltværelse |
  | Junior Suite | 2 | Mindre suite |
  | Spa Executive | 2 | Suite med wellnessfokus |
  | Suite | 3 | "Store, luksuriøse værelser" |
  | LOFT Suite | 4 | Suite i to niveauer; hotellets maks. 4 pr. værelse |

  Med de 1.000 historiske bookinger giver det 2.226 personer i alt.
- **A22 — Fordeling af historisk bardata (Q21)**: Hver drinks solgte enheder fordeles tilfældigt
  over dagene fra 1. januar 2024 til dagen før systemets startdag, så hver dag får én registrering
  pr. drink. Summen pr. drink er præcis tallet i arbejdsbogen, og prisen er drinkens pris fra
  arbejdsbogen. Dage efter startdagen får intet genereret salg, da de ligger i fremtiden; dem
  registrerer lukkeholdet selv (Story 19).
- **A23 — Testsvar til spørgeskemaer (Q22)**: Hver historisk booking, hvis afrejse ligger før
  systemets startdag, får ét genereret svar med en tilfældig score fra 1 til 5. Svarene markeres
  som testdata, så de kan skelnes fra rigtige svar og fjernes senere.

## Åbne spørgsmål

Q1–Q17 og Q19–Q23 er besvaret (se Clarifications). Tilbage står:

- **Q18 — Interaktion i dashboardet**: Gruppen afprøver og beslutter senere.
