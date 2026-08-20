/**
 * Homepage testimonials.
 *
 * ⚠ PLACEHOLDER CONTENT — NOT REAL CUSTOMERS.
 *
 * Every quote, name and rating below is written. They exist so the section
 * can be designed, reviewed and signed off before real reviews are in hand;
 * they are not evidence of anything and must not ship to customers as though
 * they were. Publishing fabricated reviews is prohibited under the Consumer
 * Protection Act 2019 and BIS IS 19000:2022, which covers exactly this: paid
 * or invented reviews presented as genuine buyer experience.
 *
 * The replacement path already exists. Judge.me is integrated (see
 * `src/lib/reviews/judgeme.ts`) and collects real, verified-purchase reviews
 * per product. Once it is returning data, this array should be swapped for an
 * aggregate of those — the shape below deliberately matches what Judge.me
 * returns (rating, body, reviewer name) so the swap is a data change and not
 * a rewrite of the section.
 *
 * The names are invented and the roles describe the trades PRO1ST actually
 * sells into: event DJs, sound rental firms, retailers and installers.
 */

export interface Testimonial {
  /** 1–5. Whole stars only here; the component renders fractions fine. */
  rating: number;
  quote: string;
  name: string;
  /** Trade and city — what makes a review credible in this market. */
  role: string;
  /** The unit they are talking about. Grounds the quote in the catalogue. */
  product: string;
}

export const testimonials: Testimonial[] = [
  {
    rating: 5,
    quote:
      "Two MX-1600s have run every Saturday for eleven months — barat, reception, the lot. Nothing has thermalled out on me yet, and I have pushed them harder than I should.",
    name: "Harpreet Singh",
    role: "Event DJ · Ludhiana",
    product: "PRO1ST MX-1600",
  },
  {
    rating: 5,
    quote:
      "I stock a lot of brands. This one comes back as a referral instead of a complaint, which is the only metric that matters to a counter like mine.",
    name: "Imran Qureshi",
    role: "Retailer · Chandni Chowk",
    product: "Full line",
  },
  {
    rating: 4,
    quote:
      "The AJ6 does what a small mixer should: gets out of the way. Gain structure is honest and the DSP is not doing anything clever behind my back. Wish the aux send had one more stage.",
    name: "Neha Bhatt",
    role: "FOH engineer · Pune",
    product: "PRO 1st AJ6",
  },
  {
    rating: 5,
    quote:
      "Monsoon load-ins are what kill gear here. Third season on the same cabinets and the chassis are still square. That is the whole review.",
    name: "Ashok Reddy",
    role: "Sound rental · Hyderabad",
    product: "Party Box series",
  },
  {
    rating: 5,
    quote:
      "Ordered fourteen units for a college auditorium fit-out. All fourteen arrived bench-tested and matched. I did not have to send one back, which has not happened to me in years.",
    name: "Vikram Nair",
    role: "AV contractor · Kochi",
    product: "XTR 6.0",
  },
  {
    rating: 4,
    quote:
      "TK600 handles a room without a windscreen and does not get harsh when the singer leans in. For the money there is nothing near it. The clip is a bit soft.",
    name: "Farida Sheikh",
    role: "Studio owner · Mumbai",
    product: "PRO 1st TK600",
  },
  {
    rating: 5,
    quote:
      "Dealer pricing came back the same working day, on WhatsApp, from someone who knew what a crossover point was. That is rarer than it should be.",
    name: "Manish Agarwal",
    role: "Distributor · Jaipur",
    product: "Trade account",
  },
  {
    rating: 5,
    quote:
      "Ran the D518s on top of my existing subs and the crossover network sorted the overlap in one pass. Highs are present without being brittle at 2 AM volume.",
    name: "Rohit Kalra",
    role: "Club DJ · Delhi",
    product: "PRO-1ST D518",
  },
  {
    rating: 4,
    quote:
      "Bought one amp to test them. Bought five more the following month. Support answered on a Sunday when a fader went intermittent and had a replacement out on Monday.",
    name: "Sanjay Pillai",
    role: "Wedding sound · Coimbatore",
    product: "PRO1ST MX-1600",
  },
];
