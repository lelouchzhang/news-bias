export interface HomeArticle {
  id: string;
  slug: string;
  category: string;
  region: string;
  title: string;
  left: number;
  center: number;
  right: number;
  sourceCount: number;
  imageUrl: string;
}

export const homeArticles: HomeArticle[] = [
  {
    id: "card-01",
    slug: "trump-iran-peace-proposal",
    category: "Politics",
    region: "United States",
    title:
      "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    left: 20,
    center: 31,
    right: 49,
    sourceCount: 12,
    imageUrl: "/images/home/card-01.svg",
  },
  {
    id: "card-02",
    slug: "grapes-superfood-evidence",
    category: "Health",
    region: "United States",
    title:
      "Researchers Make Case for Grapes as a 'Superfood' After Review of Health Evidence",
    left: 18,
    center: 42,
    right: 40,
    sourceCount: 7,
    imageUrl: "/images/home/card-02.svg",
  },
  {
    id: "card-03",
    slug: "cern-physics-beyond-standard-model",
    category: "Science",
    region: "Switzerland",
    title: "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    left: 16,
    center: 62,
    right: 22,
    sourceCount: 8,
    imageUrl: "/images/home/card-03.svg",
  },
  {
    id: "card-04",
    slug: "brooklyn-rivera-nicaragua-death",
    category: "World",
    region: "Nicaragua",
    title:
      "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention",
    left: 54,
    center: 28,
    right: 18,
    sourceCount: 63,
    imageUrl: "/images/home/card-04.svg",
  },
  {
    id: "card-05",
    slug: "un-security-council-israel-lebanon",
    category: "World",
    region: "Middle East",
    title:
      "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon",
    left: 28,
    center: 35,
    right: 43,
    sourceCount: 15,
    imageUrl: "/images/home/card-05.svg",
  },
  {
    id: "card-06",
    slug: "oil-prices-opec-output",
    category: "Business",
    region: "Global",
    title:
      "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    left: 25,
    center: 50,
    right: 28,
    sourceCount: 11,
    imageUrl: "/images/home/card-06.svg",
  },
  {
    id: "card-07",
    slug: "spacex-starship-test-flight",
    category: "Technology",
    region: "United States",
    title: "SpaceX Launches Starship Test Flight in Milestone for Mars Program",
    left: 12,
    center: 45,
    right: 49,
    sourceCount: 9,
    imageUrl: "/images/home/card-07.svg",
  },
  {
    id: "card-08",
    slug: "apple-ai-features",
    category: "Business",
    region: "United States",
    title: "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac",
    left: 15,
    center: 40,
    right: 45,
    sourceCount: 10,
    imageUrl: "/images/home/card-08.svg",
  },
  {
    id: "card-09",
    slug: "hottest-year-climate",
    category: "Climate",
    region: "Global",
    title:
      "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    left: 33,
    center: 34,
    right: 33,
    sourceCount: 14,
    imageUrl: "/images/home/card-09.svg",
  },
  {
    id: "card-10",
    slug: "fed-rates-inflation-outlook",
    category: "Economy",
    region: "United States",
    title:
      "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    left: 30,
    center: 45,
    right: 26,
    sourceCount: 13,
    imageUrl: "/images/home/card-10.svg",
  },
  {
    id: "card-11",
    slug: "real-madrid-champions-league",
    category: "Soccer",
    region: "Europe",
    title: "Real Madrid Win Champions League After Comeback Victory in Final",
    left: 10,
    center: 20,
    right: 70,
    sourceCount: 26,
    imageUrl: "/images/home/card-11.svg",
  },
  {
    id: "card-12",
    slug: "canada-wildfires-evacuations",
    category: "Environment",
    region: "Canada",
    title: "Wildfires Force Thousands to Evacuate Across Western Canada",
    left: 27,
    center: 33,
    right: 40,
    sourceCount: 17,
    imageUrl: "/images/home/card-12.svg",
  },
];
