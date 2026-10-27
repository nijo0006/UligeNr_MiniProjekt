# Feature Specification: Hotel Operations and Performance Insights

**Feature Branch**: Ingen ny branch oprettet; der er ikke konfigureret nogen branch-hook.

**Feature Directory**: `specs/001-hotel-operations`

**Created**: 2026-10-27

**Last Updated**: 2026-10-27 — opdateret ud fra opgavebeskrivelsen og Excel-arbejdsbogen.

**Status**: Draft — klar til `/speckit-clarify`; forretningsdefinitioner afventer de åbne spørgsmål.

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
- Kildefilerne ligger i repo-roden, ikke i en `docs/`-mappe som nævnt i input.
- Browserfrontend, API-adgang og Tableau-dashboard er eksplicitte krav i opgaven (K1), ikke
  teknologivalg truffet her. Endpoints, dataformat og datamodel hører til Plan.

**Vigtige begrænsninger i datagrundlaget (K3)**:

- Bookingdata har **ingen datoer** (hverken ankomst, afrejse eller bookingdato) og **ingen
  værelsesnumre**. Sæson er angivet direkte som `low`/`mid`/`high`.
- Der findes **ingen data om kundetilfredshed**.
- Der er **ikke angivet antal personer pr. booking**; arbejdsbogen tæller "gæster" som bookinger.
- Bardata har **ingen datoer**; det er én samlet opgørelse pr. drink (pris × solgte enheder).
  Opgaven nævner vin og øl, men data indeholder kun cocktails (20) og kaffe (10).
- Nogle faktiske nattepriser ligger uden for opgavens prisintervaller (fx Standard Single op til
  1.498 DKK mod opgavens 900–1.200 DKK).

## User Scenarios & Testing *(mandatory)*

Hver story er struktureret efter **The Three Cs**:

- **Card**: selve storyen, kort nok til en post-it.
- **Conversation**: detaljer, antagelser (A#) og åbne spørgsmål (Q#), som gruppen skal afklare.
- **Confirmation**: acceptkriterier, der kan tjekkes, og som bruges i Converge til at afgøre, om
  storyen er færdig.

**Prioritet (MoSCoW)** er et forslag (A1): Must = kræves af opgaven og kan leveres med det
foreliggende data; Should = kræves eller ønskes, men afhænger af data eller afklaringer, der ikke
findes endnu; Could = nice to have; Won't = ikke i denne version.

**INVEST**: Hver story leverer én selvstændig værdi og kan testes alene mod et kendt datasæt.
Nøgletalsstories er uafhængige af hinanden og af bookingstories, fordi de kan testes mod de
udleverede data. Referenceværdier i acceptkriterierne er hentet fra arbejdsbogen (K3) og gælder
**kun, når systemet udelukkende indeholder seed-data fra Excel-filen** (de 1.000 bookinger og de 30
drinks, uden oprettede, rettede eller slettede bookinger), under antagelserne A2–A4. Så snart data
ændres, gælder tallene ikke længere; så er facit en uafhængig beregning på de aktuelle data.

---

### User Story 1 - Opret booking via browserfrontend (Prioritet: Must)

**Card**: Som receptionist ønsker jeg at kunne oprette en booking i browseren, så systemet altid
viser den aktuelle belægning.

**Hvorfor denne prioritet**: Opgaven kræver eksplicit, at bookinger kan oprettes via en
browserfrontend (K1). Uden oprettelse kan data ikke opdateres løbende.

**Uafhængig test**: Opret en booking i frontend og hent den igen, uden at dashboardet er nødvendigt.

**Conversation**:

- Materialets bookingfelter er: Booking ID, fornavn, efternavn, land, værelsestype, nætter, sæson
  og pris i alt. Pris pr. nat er afledt (pris i alt / nætter).
- Det er ikke afgjort, hvilke felter der er påkrævede, om prisen indtastes eller beregnes, og om
  nye bookinger skal have datoer (Q1, Q2).
- Det er ikke afgjort, om sæson indtastes manuelt som i data eller afledes af en dato (Q3).
- Validering og fejlhåndtering er åben (Q5).

**Confirmation (acceptkriterier)**:

1. **Givet** gyldige bookingoplysninger, **når** receptionisten opretter bookingen i
   browserfrontenden, **så** gemmes bookingen og kan hentes igen med de samme oplysninger.
2. **Givet** at en booking netop er oprettet, **når** listen over bookinger vises, **så** indgår
   den nye booking.
3. **Givet** ugyldige eller manglende oplysninger, **når** receptionisten forsøger at oprette
   bookingen, **så** gemmes den ikke, og receptionisten får besked om hvorfor (regler: Q5).

---

### User Story 2 - Ret booking via browserfrontend (Prioritet: Must)

**Card**: Som receptionist ønsker jeg at kunne rette en eksisterende booking i browseren, så
bookingoplysningerne altid er korrekte.

**Hvorfor denne prioritet**: Kræves eksplicit af opgaven (K1).

**Uafhængig test**: Ret en kendt booking i frontend og hent den igen.

**Conversation**:

- Hvilke felter må rettes, og må Booking ID ændres (Q1)?
- Hvad sker der, hvis to rettelser af samme booking sker samtidigt (Q5)?

**Confirmation (acceptkriterier)**:

1. **Givet** en eksisterende booking, **når** receptionisten retter et tilladt felt og gemmer,
   **så** kan samme booking hentes med den rettede værdi.
2. **Givet** en rettelse med ugyldige værdier, **når** receptionisten gemmer, **så** forbliver
   bookingen uændret, og receptionisten får besked om hvorfor (Q5).

---

### User Story 3 - Slet booking via browserfrontend (Prioritet: Must)

**Card**: Som receptionist ønsker jeg at kunne slette en booking i browseren, så bookinger, der
ikke længere gælder, ikke tæller med i belægning og nøgletal.

**Hvorfor denne prioritet**: Kræves eksplicit af opgaven (K1).

**Uafhængig test**: Slet en kendt booking i frontend og kontrollér, at den ikke længere vises som aktiv.

**Conversation**:

- Betyder "slet" fysisk sletning eller annullering, og skal historiske nøgletal ændres (Q4)?
- Skal sletning bekræftes af brugeren først? Ikke nævnt i materialet (Q5).

**Confirmation (acceptkriterier)**:

1. **Givet** en eksisterende booking, **når** receptionisten sletter den, **så** vises den ikke
   længere blandt aktive bookinger.
2. **Givet** en booking, der allerede er slettet, **når** sletning forsøges igen, **så** får
   brugeren besked om, at bookingen ikke findes (Q5).

---

### User Story 4 - Bookingsystemet opretter, retter og sletter bookinger via API'et (Prioritet: Must)

**Card**: Som hotellets eksisterende bookingsystem ønsker jeg at kunne oprette, rette og slette
bookinger via API'et, så bookinger fra hotellets drift kommer ind i systemet uden manuel indtastning.

**Hvorfor denne prioritet**: Opgaven siger, at hotellets nuværende bookingsystem skal kunne skrive
til API'et (K1). Det er også den primære kilde til løbende data.

**Uafhængig test**: Send en oprettelse, en rettelse og en sletning gennem API'et og kontrollér
resultatet ved at hente bookingen igen, uden brug af browserfrontenden.

**Conversation**:

- De samme bookingregler bør gælde som i frontend (Story 1–3), så resultatet ikke afhænger af
  kanalen. Antagelse A5.
- Storyen kan deles op i tre (opret, ret, slet), hvis gruppen finder den for stor til ét estimat.
- Skal bookingsystemet identificere sig, og har det andre rettigheder end receptionisten (Q6)?
- Hvad sker der ved dubletter eller gentagne kald (Q5)?

**Confirmation (acceptkriterier)**:

1. **Givet** gyldige bookingoplysninger, **når** bookingsystemet opretter en booking via API'et,
   **så** gemmes den og kan hentes igen med de samme oplysninger.
2. **Givet** en eksisterende booking, **når** bookingsystemet retter den via API'et, **så** kan
   samme booking hentes med de rettede værdier.
3. **Givet** en eksisterende booking, **når** bookingsystemet sletter den via API'et, **så** vises
   den ikke længere blandt aktive bookinger.
4. **Givet** ugyldige oplysninger, **når** bookingsystemet sender dem, **så** afvises kaldet med
   en forklarende fejl, og ingen data ændres.
5. **Givet** en booking oprettet via API'et, **når** receptionisten åbner frontenden, **så** vises
   bookingen der også.

---

### User Story 5 - Nøgletal viser aktuelle data (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg, at nøgletallene opdateres løbende, når bookinger
ændres, så jeg træffer beslutninger på aktuelle tal og ikke kun historiske.

**Hvorfor denne prioritet**: Opgaven kræver et system, der "løbende kan opdatere data, og som kan
vise data live, og altså ikke kun historisk" (K1, K2 spm. 9).

**Uafhængig test**: Notér et nøgletal, opret eller slet en booking, der påvirker det, og
kontrollér, at nøgletallet ændrer sig tilsvarende.

**Conversation**:

- Hvad "live" betyder, er ikke defineret: øjeblikkeligt, inden for et fast interval eller ved
  genindlæsning (Q7). Opgaven nævner selv dette som et Clarify-spørgsmål.
- Skal bardata også kunne opdateres løbende, og i så fald af hvem (Q8)?
- De 1.000 historiske bookinger indlæses som udgangspunkt (A6).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, hvor årets indtjening er 11.234.034 DKK, **når** der
   oprettes en booking med pris i alt X DKK, **så** viser årets indtjening 11.234.034 + X DKK,
   efter at den aftalte opdateringstid er gået (Q7).
2. **Givet** en booking, der slettes, **når** nøgletallene opdateres, **så** indgår bookingen ikke
   længere i dem (afhængigt af Q4).
3. **Givet** en rettelse af land eller værelsestype på en booking, **når** nøgletallene opdateres,
   **så** flyttes bookingens bidrag til den nye gruppe.

---

### User Story 6 - Gæster pr. land (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se, hvor gæsterne kommer fra, så jeg kan målrette
markedsføring mod de vigtigste lande.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvor kommer gæsterne fra (lande)" (K1).

**Uafhængig test**: Indlæs det udleverede datasæt og sammenlign antal pr. land med arbejdsbogens
ark "Indtjening pr. land".

**Conversation**:

- Data har ikke antal personer pr. booking. Arbejdsbogen tæller én booking som én gæst. Skal vi
  tælle bookinger eller personer, og skal personantal i så fald registreres fremover (Q9)?
- Datasættet indeholder 20 lande.

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** gæster pr. land vises, **så** vises alle 20 lande,
   og summen er 1.000 (under A3).
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** gæster pr. land vises, **så** har South Korea flest
   (63), og tallene for hvert land matcher arbejdsbogen.

---

### User Story 7 - Indtjening pr. værelsestype pr. sæson (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se indtjening pr. værelsestype fordelt på sæson,
så jeg kan vurdere prissætningen i lav-, mellem- og højsæson.

**Hvorfor denne prioritet**: Krav i opgaven: indtjening "pr værelsestype (pr sæson)" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Indtjening pr. værelse".

**Conversation**:

- Sæson findes som kode i data (`low`/`mid`/`high`). Opgaven beskriver sæsonerne løst
  (vinter / forår og efterår / sommer og juletid), men ikke præcise måneder (Q3).
- Indtjening er antaget at være summen af "Pris i alt" (A2).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** indtjening pr. værelsestype pr. sæson vises, **så**
   vises alle 8 værelsestyper × 3 sæsoner, og hver værdi matcher arbejdsbogen.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **så** er sæsontotalerne lavsæson 3.354.077 DKK,
   mellemsæson 3.809.387 DKK og højsæson 4.070.570 DKK.

---

### User Story 8 - Indtjening pr. land (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se indtjening pr. land, så jeg kan se, hvilke
markeder der bidrager mest økonomisk.

**Hvorfor denne prioritet**: Krav i opgaven: indtjening "pr land" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Indtjening pr. land".

**Conversation**:

- En booking har ét land i data. Hvis en booking fremover kan have gæster fra flere lande, skal
  det afklares (Q9).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** indtjening pr. land vises, **så** matcher hvert lands
   indtjening arbejdsbogen, og summen er 11.234.034 DKK.

---

### User Story 9 - Hvilke værelser tjener mest (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se, hvilke værelser der tjener flest penge, så jeg
ved, hvilke værelser der er vigtigst for forretningen.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvilke værelser tjener Kong Arthur flest penge på?" (K1).

**Uafhængig test**: Sammenlign rangordningen med arbejdsbogens ark "Indtjening pr. værelse".

**Conversation**:

- Data har ingen værelsesnumre, kun værelsestyper. Det antages derfor, at "værelser" betyder
  værelsestyper (A7). Hvis det skal være enkelte værelser, kræver det nye data (Q11).
- Hvordan vises lige store værdier? Ingen regel er givet i materialet (Q5).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** værelsestyperne rangordnes efter indtjening, **så** er
   rækkefølgen øverst Suite (2.119.671 DKK), Spa Executive (1.722.396 DKK) og LOFT Suite
   (1.695.405 DKK), og hele rangordningen matcher arbejdsbogen.

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

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** landene rangordnes efter indtjening, **så** er
   rækkefølgen øverst South Korea (767.699 DKK), China (722.928 DKK) og United Kingdom
   (698.290 DKK), og hele rangordningen matcher arbejdsbogen.

---

### User Story 11 - Årets indtjening (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se årets samlede indtjening for hotellet, så jeg kan
vurdere hotellets økonomiske resultat.

**Hvorfor denne prioritet**: Krav i opgaven: "Beregn årets indtjening for hotellet" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Oversigt".

**Conversation**:

- Data har ingen datoer. Arbejdsbogen antager, at hele datasættet er ét år (A3). Hvilket år, og
  hvordan nye bookinger henføres til et år, er åbent (Q2, Q12).
- Skal barens omsætning tælle med i "hotellets" indtjening? Arbejdsbogen viser begge dele
  separat og samlet (Q10).
- Barens omsætning (ca. 13,4 mio. DKK) er større end værelsesindtjeningen (ca. 11,2 mio. DKK).
  Før de lægges sammen, skal det afklares, om de dækker samme periode (Q20).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** årets indtjening vises, **så** er indtjeningen fra
   værelser 11.234.034 DKK.
2. **Givet** at Q10 og Q20 afgøres til at inkludere baren, **så** vises også samlet indtjening
   24.682.674,34 DKK (værelser + bar).

---

### User Story 12 - Belægningsgrad (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se hotellets belægningsgrad, så jeg kan planlægge
kampagner i perioder med lav belægning.

**Hvorfor denne prioritet**: Opgaven siger, at systemet skal kunne beregne belægningsgrader (K1), og
nævner "Hvordan beregnes belægningsgraden?" som Clarify-spørgsmål.

**Uafhængig test**: Beregn belægningsgraden for det udleverede datasæt og sammenlign med den
aftalte formel og referenceberegning.

**Conversation**:

- Uden datoer kan belægning pr. dag eller måned ikke beregnes ud fra de udleverede data. Det
  er nævnt i arbejdsbogens noter.
- Arbejdsbogen viser et teoretisk årsestimat: solgte værelsesnætter / (214 × 365) = 5.379 / 78.110
  ≈ 6,9 %. Det er et estimat og ikke en aftalt definition (Q13).
- Opgavens eksempel med månedlige belægningsgrader forudsætter datoer (Q2). Se Won't-listen.
- Kapacitet pr. værelsestype (antal værelser af hver type) er ikke oplyst (Q13).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, og at formlen er aftalt i Q13, **når** belægningsgraden
   vises, **så** matcher den en uafhængig beregning med samme formel.
2. **Givet** at en booking oprettes eller slettes, **når** nøgletallene opdateres, **så** ændres
   belægningsgraden tilsvarende.

---

### User Story 13 - Kundetilfredshed (Prioritet: Should)

**Card**: Som hoteladministrator ønsker jeg at se et mål for kundetilfredshed, så jeg kan følge
med i, om gæsterne er tilfredse med deres ophold.

**Hvorfor denne prioritet**: Opgaven nævner kundetilfredshed som eksempel på et nøgletal (K1), men
der findes **ingen data om kundetilfredshed** i materialet. Storyen kan derfor ikke leveres uden en
beslutning om datakilde. Foreslået som Should; gruppen kan også vælge Won't for denne version.

**Uafhængig test**: Kan først beskrives, når datakilden er afklaret (Q14).

**Conversation**:

- Hvor skal tilfredsheden komme fra: registreres pr. booking, indsamles fra gæster eller hentes
  fra en ekstern kilde (Q14)?
- Hvilken skala og hvilket mål (gennemsnit, andel tilfredse e.l.) skal bruges (Q14)?
- Specen opfinder ikke tilfredshedsdata.

**Confirmation (acceptkriterier)**:

1. **Givet** at datakilde og mål er aftalt i Q14, og at der findes tilfredshedsdata, **når**
   kundetilfredsheden vises, **så** matcher den en uafhængig beregning med det aftalte mål.
2. **Givet** at der ikke findes tilfredshedsdata, **når** nøgletallet vises, **så** fremgår det
   tydeligt, at der ikke er data, frem for at der vises et opfundet tal.

---

### User Story 14 - Ekstra nøgletal efter gruppens valg (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg at se et ekstra nøgletal, som gruppen har valgt, så jeg
får ny indsigt i hotellets drift.

**Hvorfor denne prioritet**: Krav i opgaven: "Find også selv et interessant nøgletal at vise" (K1).

**Uafhængig test**: Sammenlign det valgte nøgletal med en uafhængig beregning på det udleverede datasæt.

**Conversation**: Gruppen vælger i Clarify (Q15). Forslag, der kan beregnes ud fra data:

| Forslag | Definition (fra arbejdsbogen) | Værdi i datasættet | Bemærkning |
| --- | --- | --- | --- |
| Gennemsnitlig pris pr. nat (ADR) | Indtjening / solgte værelsesnætter | ≈ 2.088,50 DKK | Kendt hotelnøgletal; kræver ingen datoer |
| Gennemsnitlig opholdslængde | Gennemsnit af nætter pr. booking | ≈ 5,38 nætter | Kan sammenlignes pr. land eller værelsestype |
| Gennemsnitlig indtjening pr. booking | Indtjening / antal bookinger | ≈ 11.234,03 DKK | Var forslaget i den tidligere version af specen |

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, og at nøgletallet er valgt i Q15, **når** nøgletallet vises,
   **så** matcher værdien arbejdsbogens/den uafhængige beregning.
2. **Givet** at en booking oprettes eller slettes, **når** nøgletallene opdateres, **så** ændres
   det ekstra nøgletal tilsvarende.

---

### User Story 15 - Barens samlede salg for året (Prioritet: Must)

**Card**: Som Helene Christine ønsker jeg at se, hvor meget jeg har solgt i alt i baren for året,
så jeg kan følge barens resultat.

**Hvorfor denne prioritet**: Krav i opgaven: "Hvor meget har Helene Christine solgt totalt for året" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Bar - Drinks".

**Conversation**:

- Bardata har ingen datoer. Hele opgørelsen antages at være ét år (A3, Q12).
- Barens omsætning er større end værelsesindtjeningen, hvilket er usædvanligt for et hotel. Det
  er uafklaret, om bardata dækker samme periode som bookingdata (Q20).
- "Solgt" kan betyde beløb eller antal. Arbejdsbogen viser begge (Q16).
- Er det Helene selv eller administratoren, der ser bartallene (Q17)?

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** årets barsalg vises, **så** er omsætningen
   13.448.640,34 DKK, og antal solgte enheder er 179.958.

---

### User Story 16 - Omsætning pr. drink (Prioritet: Must)

**Card**: Som Helene Christine ønsker jeg at se omsætningen for hver drink, så jeg kan se, hvilke
drinks der sælger bedst.

**Hvorfor denne prioritet**: Krav i opgaven: "Vis omsætning pr drink" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens ark "Bar - Drinks".

**Conversation**:

- Omsætning pr. drink = pris × solgte enheder (arbejdsbogens formel).
- Opgaven nævner vin og øl, men de findes ikke i data (Q16).

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** omsætning pr. drink vises, **så** vises alle 30
   drinks (20 cocktails og 10 kaffetyper) med omsætning, der matcher arbejdsbogen.
2. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **så** er Espresso den drink med højest omsætning.

---

### User Story 17 - Procentfordeling mellem cocktails og kaffe (Prioritet: Must)

**Card**: Som Helene Christine ønsker jeg at se procentfordelingen mellem cocktails og kaffe, så jeg
kan se, hvad baren lever af.

**Hvorfor denne prioritet**: Krav i opgaven: "Vis procentfordeling af cocktails og kaffe for
Helene Christine" (K1).

**Uafhængig test**: Sammenlign med arbejdsbogens fordelingstabel i "Bar - Drinks".

**Conversation**:

- Fordelingen er meget forskellig afhængigt af grundlaget: efter omsætning er den ca. 52,8 %
  cocktails / 47,2 % kaffe, efter solgte enheder ca. 34,5 % / 65,5 %. Hvilket grundlag skal
  bruges, eller skal begge vises (Q16)?

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, og at grundlaget er aftalt i Q16, **når** fordelingen
   vises, **så** matcher procenterne arbejdsbogen (omsætning: 52,8 % / 47,2 %; enheder:
   34,5 % / 65,5 %), og de to andele summerer til 100 %.

---

### User Story 18 - Interaktivt Tableau-dashboard med data fra API'et (Prioritet: Must)

**Card**: Som hoteladministrator ønsker jeg et interaktivt Tableau-dashboard, der henter
nøgletallene fra API'et, så jeg kan undersøge hotellets og barens tal ét sted.

**Hvorfor denne prioritet**: Krav i opgaven: interaktivt Tableau-dashboard "med udgangspunkt i
backendens REST API" (K1).

**Uafhængig test**: Lever et kendt sæt nøgletal gennem API'et og kontrollér, at dashboardet viser
de samme værdier, og at mindst én interaktion virker.

**Conversation**:

- Hvilke interaktioner kræves (fx filtrering på sæson, land eller værelsestype) (Q18)?
- Hvordan og hvor ofte dashboardet henter nye data hænger sammen med Q7.
- Hvor beregnes nøgletallene (i backend eller i Tableau)? Det hører til Plan, men K2 spm. 4
  forventer en begrundelse.

**Confirmation (acceptkriterier)**:

1. **Givet** at systemet kun indeholder seed-data fra Excel-filen, **når** dashboardet indlæses, **så** viser det alle
   nøgletal fra Story 6–12, 14 og 15–17 med værdier, der matcher API'ets data.
2. **Givet** et dashboard med data, **når** brugeren anvender en aftalt interaktion (Q18), **så**
   ændres de viste tal, så de svarer til valget.
3. **Givet** en bookingændring, der påvirker et nøgletal, **når** dashboardet opdateres efter
   den aftalte tid (Q7), **så** viser det den nye værdi.

---

### Won't (ikke i denne version — forslag)

Disse er bevidst taget ud, så afgrænsningen er tydelig. Gruppen kan flytte dem i Clarify.

- **Månedlig belægningsrapport** (opgavens eksempel): "Som hoteladministrator ønsker jeg at se
  en rapport over månedlige belægningsgrader, så jeg kan planlægge kampagner." Kan ikke beregnes,
  så længe bookinger ikke har datoer (Q2). Flyttes til Should, hvis datoer indføres.
- **Rangordning af enkelte værelser** (værelsesnumre): kræver data, der ikke findes (Q11).
- **Registrering af barsalg i systemet**: ikke beskrevet i materialet (Q8).

### Edge Cases

Materialet fastlægger ikke, hvad der skal ske i disse tilfælde. De er åbne spørgsmål, ikke
forretningsregler:

- Manglende eller ugyldige felter, ukendt land eller værelsestype, nætter ≤ 0 (Q5).
- Pris uden for opgavens prisinterval for værelsestypen. Data indeholder allerede sådanne
  bookinger, så en afvisning ville ramme de historiske data (Q5).
- Rettelse eller sletning af en booking, der ikke findes; dubletter; samtidige ændringer (Q5).
- Sletning versus annullering og påvirkning af historiske nøgletal (Q4).
- Tomt datasæt: nøgletal med division (fx procentfordeling, ADR) må ikke vise et opfundet tal (Q19).
- Lige store værdier i rangordninger (Q5).
- Ingen tilfredshedsdata (Story 13).

## Requirements *(mandatory)*

### Functional Requirements

| ID | Krav | Story |
| --- | --- | --- |
| FR-001 | Receptionisten MUST kunne oprette bookinger via en browserfrontend. | 1 |
| FR-002 | Receptionisten MUST kunne rette bookinger via en browserfrontend. | 2 |
| FR-003 | Receptionisten MUST kunne slette bookinger via en browserfrontend. | 3 |
| FR-004 | Hotellets bookingsystem MUST kunne oprette, rette og slette bookinger via API'et. | 4 |
| FR-005 | Samme bookingregler MUST gælde, uanset om ændringen kommer fra frontend eller API. | 1–4; A5 |
| FR-006 | Ugyldige bookingændringer MUST afvises med en forklarende besked uden at ændre data. | 1–4; Q5 |
| FR-007 | Nøgletal MUST afspejle oprettede, rettede og slettede bookinger inden for den aftalte opdateringstid. | 5; Q4, Q7 |
| FR-008 | Systemet MUST vise antal gæster pr. land. | 6; Q9 |
| FR-009 | Systemet MUST vise indtjening pr. værelsestype pr. sæson. | 7; Q3 |
| FR-010 | Systemet MUST vise indtjening pr. land. | 8 |
| FR-011 | Systemet MUST rangordne værelser(typer) efter indtjening. | 9; Q11 |
| FR-012 | Systemet MUST rangordne lande efter indtjening. | 10 |
| FR-013 | Systemet MUST vise årets indtjening for hotellet. | 11; Q10, Q12 |
| FR-014 | Systemet MUST vise belægningsgrad efter den formel, der aftales. | 12; Q13 |
| FR-015 | Systemet SHOULD vise kundetilfredshed, når datakilde og mål er aftalt. | 13; Q14 |
| FR-016 | Systemet MUST vise ét ekstra nøgletal valgt af gruppen. | 14; Q15 |
| FR-017 | Systemet MUST vise barens samlede salg for året. | 15; Q16 |
| FR-018 | Systemet MUST vise omsætning pr. drink. | 16 |
| FR-019 | Systemet MUST vise procentfordelingen mellem cocktails og kaffe. | 17; Q16 |
| FR-020 | Systemet MUST stille nøgletallene til rådighed via API'et til et interaktivt Tableau-dashboard. | 18; Q18 |
| FR-021 | De 1.000 historiske bookinger og bardata fra K3 MUST kunne indlæses som startdata. | 5–17; A6 |
| FR-022 | Systemet MUST NOT vise opfundne værdier, hvor data mangler (fx kundetilfredshed). | 13; Q19 |

### Key Entities *(include if feature involves data)*

Konceptuelle begreber fra K1 og K3, ikke en datamodel (den hører til Plan):

- **Booking**: Booking ID, fornavn, efternavn, land, værelsestype, nætter, sæson, pris i alt.
  Pris pr. nat er afledt. Ingen datoer, ingen værelsesnummer, intet personantal i nuværende data.
- **Værelsestype**: 8 typer (Standard Single, Grand Lit, Standard Double, Superior Double,
  Junior Suite, Spa Executive, Suite, LOFT Suite) med vejledende prisinterval pr. nat fra K1.
- **Sæson**: Lav (`low`), mellem (`mid`), høj (`high`). Kun løst beskrevet med årstider i K1.
- **Land**: Gæstens land. 20 lande i datasættet.
- **Hotel**: 214 værelser, 1–4 personer pr. værelse, maks. ca. 428 gæster (K1).
- **Drink**: Navn, kategori (cocktail/kaffe), pris, solgte enheder. 20 cocktails og 10 kaffetyper.
- **Kundetilfredshed**: Nævnt i K1, men ingen data findes (Q14).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Foreslåede kriterier (A8). Der er ikke opfundet svartider, brugerantal eller lignende mål, da
materialet ikke nævner sådanne.

- **SC-001**: Alle Must-stories består deres acceptkriterier i Converge.
- **SC-002**: Når systemet kun indeholder seed-data fra Excel-filen, matcher alle nøgletal fra Story 6–11 og 15–17 arbejdsbogens
  værdier (K3), afrundet som aftalt i Q19.
- **SC-003**: En booking oprettet, rettet eller slettet via frontend eller API indgår i nøgletal og
  dashboard inden for den opdateringstid, der aftales i Q7.
- **SC-004**: Receptionisten kan oprette, rette og slette en booking i frontenden uden hjælp
  udefra på første forsøg ved fremlæggelsen.
- **SC-005**: Dashboardet viser samme værdier som API'et for alle viste nøgletal, og mindst én
  interaktion ændrer visningen korrekt.

## Assumptions

Alt her står ikke direkte i materialet og skal bekræftes eller afvises i Clarify.

- **A1 — MoSCoW-prioriteter**: Prioriteterne er specens forslag, ikke opgavens.
- **A2 — Indtjening**: Indtjening = summen af "Pris i alt" for bookinger, som i arbejdsbogen (Q10).
- **A3 — Ét år**: Hele datasættet behandles som ét år, som i arbejdsbogen, fordi der ikke er
  datoer (Q12).
- **A4 — Sæson**: Sæson bruges som angivet i data (`low`/`mid`/`high`) (Q3).
- **A5 — Samme regler i begge kanaler**: Frontend og API følger samme bookingregler.
- **A6 — Startdata**: De udleverede data indlæses som udgangspunkt, og nye ændringer lægges oveni.
- **A7 — "Værelser" = værelsestyper**: Fordi data ikke har værelsesnumre (Q11).
- **A8 — Succeskriterier**: SC-001–SC-005 er forslag til, hvordan specen kan vurderes.
- **A9 — Referenceværdier**: Arbejdsbogens beregnede værdier bruges som facit i acceptkriterierne,
  og kun i tilstanden, hvor systemet udelukkende indeholder seed-data fra Excel-filen.

## Åbne spørgsmål til Clarify

Samlet liste. Hver Q er refereret fra de stories, den påvirker.

**Bookinger**

- **Q1 — Bookingfelter**: Hvilke felter er påkrævede ved oprettelse, og hvilke må rettes? Indtastes
  "Pris i alt", eller beregnes den ud fra værelsestype, sæson og nætter? Tildeles Booking ID af
  systemet?
- **Q2 — Datoer**: Skal nye bookinger have ankomst- og afrejsedato? Hvordan håndteres de 1.000
  historiske bookinger uden datoer? (Afgør belægningsgrad, "årets" tal og månedsrapport.)
- **Q3 — Sæson**: Indtastes sæson manuelt som i data, eller afledes den af en dato? Hvilke måneder
  hører til hvilken sæson, og hvor ligger "juletid"?
- **Q4 — Sletning**: Er sletning fysisk sletning eller annullering? Skal en slettet booking fjernes
  fra historiske nøgletal?
- **Q5 — Validering og fejl**: Hvad er ugyldige værdier (nætter, land, værelsestype)? Skal priser uden
  for opgavens prisintervaller afvises, når data allerede indeholder sådanne? Hvordan håndteres
  dubletter, samtidige ændringer, bookinger der ikke findes, og lige store værdier i rangordninger?
- **Q6 — Adgang**: Skal receptionist, bookingsystem og administrator have forskellige rettigheder,
  og kræves login? Materialet nævner det ikke.

**Løbende data**

- **Q7 — "Live"**: Hvad betyder live: øjeblikkeligt, inden for et fast interval eller ved
  genindlæsning? Hvad er den maksimale acceptable forsinkelse til nøgletal og dashboard?
- **Q8 — Bardata**: Skal barsalg også kunne opdateres løbende, og i så fald af hvem og hvordan?
  Materialet beskriver kun ændringer af bookinger.

**Nøgletal**

- **Q9 — Gæster**: Tæller vi bookinger eller personer? Skal personantal registreres pr. booking
  fremover? Kan én booking have gæster fra flere lande?
- **Q10 — Indtjening**: Er indtjening = "Pris i alt"? Inkl. eller ekskl. moms og rabatter? Skal
  barens omsætning med i "årets indtjening for hotellet"?
- **Q11 — Værelser**: Betyder "hvilke værelser" værelsestyper eller enkelte værelser? Det sidste
  kræver værelsesnumre, som ikke findes i data.
- **Q12 — År**: Hvilket år dækker data? Hvordan henføres nye bookinger og bardata til et år?
- **Q13 — Belægningsgrad**: Hvilken formel (fx solgte værelsesnætter / (214 × 365))? For hvilken
  periode? Skal den opgøres pr. værelsestype, og hvor mange værelser findes der af hver type?
- **Q14 — Kundetilfredshed**: Hvor skal data komme fra, og med hvilken skala og hvilket mål? Eller
  skal nøgletallet udskydes (Won't) i denne version?
- **Q15 — Ekstra nøgletal**: Hvilket af forslagene i Story 14 (eller et andet) vælger gruppen?
- **Q16 — Bar**: Betyder "solgt totalt" beløb, antal eller begge? Skal procentfordelingen være efter
  omsætning eller solgte enheder? Hvad med vin og øl, som opgaven nævner, men data ikke indeholder?
- **Q17 — Helene Christine**: Ser Helene selv bartallene, eller er det administratoren? Bruger hun
  samme dashboard?
- **Q20 — Barens omsætning versus værelsesindtjening**: I seed-data er barens omsætning
  (13.448.640,34 DKK) større end værelsesindtjeningen (11.234.034 DKK), så baren ville udgøre ca.
  54 % af den samlede omsætning. Dækker bardata samme periode som bookingdata (fx ét år), eller en
  længere eller ukendt periode? Er tallene realistiske, eller er der tale om testdata, der ikke skal
  sammenlignes direkte? Svaret afgør, om bar og værelser må lægges sammen i "årets indtjening" (Q10)
  og vises side om side i dashboardet.

**Dashboard og visning**

- **Q18 — Interaktion**: Hvilke interaktioner skal dashboardet have (fx filtrering på sæson, land,
  værelsestype)?
- **Q19 — Afrunding og tomme resultater**: Hvor mange decimaler for beløb og procenter? Hvad vises,
  når der ikke er data, eller når der divideres med nul?
