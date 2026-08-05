// Direct Unsplash image URLs. Swap to real ScrubFair photography here when
// available. All photos are royalty-free under the Unsplash License and contain
// no people.

const U = (id: string, w = 1600, q = 80) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const IMAGES = {
  /** Hero background — minimalist living room, people-free. */
  hero: U("1556909114-f6e7ad7d3136", 2200, 82),
  /** Section accent for Standard Cleaning — cleaning supplies flat-lay. */
  standardSupplies: U("1583947581924-860bda6a26df", 1400, 82),
  /** Section accent for Deep Cleaning — clean kitchen counter / minimal interior.
   *  Previously used photo-1556909114-44e3e9399a2e; that ID was removed
   *  from Unsplash. Replaced with a verified-live alternative showing a
   *  clean, people-free kitchen. */
  deepKitchen: U("1565538810643-b5bdb714032a", 1400, 82),
  /** Founders-note / trust background — clean bathroom interior. */
  reviewBathroom: U("1552321554-5fefe8c9ef14", 1400, 82),
  /** Contact page supporting image — clean, calm interior. */
  contactInterior: U("1527515637462-cff94eecc1ac", 1400, 82),
  /** Footer texture — small sparkly supplies. */
  footerTexture: U("1583847268964-b28dc8f51f92", 1200, 80),
  /** Commercial cleaning — bright, empty office interior. */
  commercialOffice: U("1497366811353-6870744d04b2", 1400, 82),
  /** Move in/out — clean, empty room ready for a new occupant. */
  moveInOut: U("1505693416388-ac5ce068fe85", 1400, 82),
  /** Showhome — polished, staged living room without people. */
  showhome: U("1600566753190-17f0baa2a6c3", 1400, 82),
  /** Post-construction — bright finished interior with clean surfaces. */
  postConstruction: U("1600607687920-4e2a09cf159d", 1400, 82),
  /** Carpet cleaning — clean carpeted interior. */
  carpet: U("1586023492125-27b2c045efd7", 1400, 82),
} as const;
