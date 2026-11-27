/** These pages work without launching the app or opening its local database. */
export const PUBLIC_PAGES = {
  privacy: `${import.meta.env.BASE_URL}privacy/index.html`,
  support: `${import.meta.env.BASE_URL}support/index.html`,
} as const;
