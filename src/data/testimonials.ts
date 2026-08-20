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
 * No text here is lifted from Amazon, Flipkart or any other marketplace.
 * Real reviews are their authors' copyrighted words, and republishing them
 * under invented names attached to a different seller is misattribution on
 * top of infringement. What IS borrowed is the register, which is the part
 * that actually makes a review read as genuine:
 *
 *   - Uneven length. Real reviews are not all four lines long; some people
 *     write one sentence and stop.
 *   - Specific, boring detail — dates, quantities, what broke, what shipped.
 *     Invented reviews drift to adjectives; real ones cite facts.
 *   - A complaint inside a five-star review. Uniform praise is the single
 *     clearest tell of a bought review set.
 *   - Plain, slightly uneven phrasing, including ordinary Indian English
 *     constructions. Copywriter polish is what gave the first draft away.
 *   - Delivery, packaging and seller response, which buyers mention far more
 *     than product philosophy.
 *
 * The replacement path already exists. Judge.me is integrated (see
 * `src/lib/reviews/judgeme.ts`) and collects real, verified-purchase reviews
 * per product. Once it is returning data, this array should be swapped for an
 * aggregate of those — the shape below deliberately matches what Judge.me
 * returns (rating, body, reviewer name) so the swap is a data change and not
 * a rewrite of the section.
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
      "Using 2 pcs MX-1600 since last Diwali. Around 40 functions till now, mostly outdoor. Heat sink gets warm but no cut-off till now. Packing was proper, double box.",
    name: "Harpreet Singh",
    role: "Event DJ · Ludhiana",
    product: "PRO1ST MX-1600",
  },
  {
    rating: 5,
    quote: "Good product. Customer only asks for this now.",
    name: "Imran Qureshi",
    role: "Retailer · Chandni Chowk",
    product: "Full line",
  },
  {
    rating: 4,
    quote:
      "AJ6 is doing the job for small setups. Gain is clean, no hiss at half volume. Only issue is the aux send is single, so monitor and effects both cannot go together. Manage kar liya but keep in mind before buying.",
    name: "Neha Bhatt",
    role: "FOH engineer · Pune",
    product: "PRO 1st AJ6",
  },
  {
    rating: 5,
    quote:
      "Third monsoon on the same cabinets. Corners are still tight, no rattle. I load in and out 3 times a week so this matters more than sound quality honestly.",
    name: "Ashok Reddy",
    role: "Sound rental · Hyderabad",
    product: "Party Box series",
  },
  {
    rating: 5,
    quote:
      "Ordered 14 nos for a college auditorium. All 14 came tested, output matched within a hair. Delivery took 9 days to Kochi which is slightly long, but not a single RMA. Will order again for the next site.",
    name: "Vikram Nair",
    role: "AV contractor · Kochi",
    product: "XTR 6.0",
  },
  {
    rating: 4,
    quote:
      "Mic is good for the price, no doubt. Handles a loud singer without distorting. The mic clip that comes with it is cheap plastic, mine cracked in a month. Bought a separate clip, otherwise no complaint.",
    name: "Farida Sheikh",
    role: "Studio owner · Mumbai",
    product: "PRO 1st TK600",
  },
  {
    rating: 5,
    quote:
      "Asked for dealer rate on WhatsApp, got the rate card same day. The person actually knew what I was asking about. Rare.",
    name: "Manish Agarwal",
    role: "Distributor · Jaipur",
    product: "Trade account",
  },
  {
    rating: 5,
    quote:
      "Fitted D518 on my existing tops. Crossover sorted the overlap in one go, did not need to tune much. Highs are clear at high volume, not paining the ears after 3-4 hours.",
    name: "Rohit Kalra",
    role: "Club DJ · Delhi",
    product: "PRO-1ST D518",
  },
  {
    rating: 4,
    quote:
      "Took 1 amp first to check quality. Took 5 more next month. One fader became loose after 2 months, they replaced it, no argument. Sunday ko bhi reply kiya. Only thing, courier packing could be better.",
    name: "Sanjay Pillai",
    role: "Wedding sound · Coimbatore",
    product: "PRO1ST MX-1600",
  },
];
