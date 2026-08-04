import { homeArticles } from "@/lib/home/mock-articles";

export type BiasLabel = "left" | "center" | "right";

export interface BiasDistribution {
  left: number;
  center: number;
  right: number;
}

export interface ArticleMeta {
  slug: string;
  category: string;
  region: string;
  title: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  imageUrl: string;
  imageCaption: string;
  paragraphs: string[];
}

export interface TopSource {
  name: string;
  bias: BiasLabel;
}

export interface SourceTally {
  label: BiasLabel;
  count: number;
  percent: number;
}

export interface SourceBreakdown {
  totalSources: number;
  tallies: SourceTally[];
  topSources: TopSource[];
}

export interface BiasAnalysis {
  overallLabel: BiasLabel;
  distribution: BiasDistribution;
  basedOn: string;
  note: string;
}

export interface AiSummary {
  generatedAt: string;
  readMinutes: number;
  points: string[];
  disclaimer: string;
}

export interface RelatedStory {
  slug: string;
  category: string;
  region: string;
  title: string;
  date: string;
  readMinutes: number;
  imageUrl: string;
}

export interface ArticleDetail {
  meta: ArticleMeta;
  biasAnalysis: BiasAnalysis;
  aiSummary: AiSummary;
  sourceBreakdown: SourceBreakdown;
  relatedStories: RelatedStory[];
}

export const biasLabelDisplay: Record<BiasLabel, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export const biasLabelTextClass: Record<BiasLabel, string> = {
  left: "text-left-bias",
  center: "text-text-secondary",
  right: "text-right-bias",
};

export const biasLabelBarClass: Record<BiasLabel, string> = {
  left: "bg-left-bias",
  center: "bg-center-bias",
  right: "bg-right-bias",
};

const defaultArticle: ArticleDetail = {
  meta: {
    slug: "trump-iran-peace-proposal",
    category: "Politics",
    region: "United States",
    title:
      "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    author: "David Morgan",
    publishedAt: "May 31, 2026",
    readMinutes: 12,
    imageUrl: "/images/article/hero.svg",
    imageCaption:
      "President Donald Trump in the Cabinet Room at the White House, Washington, D.C., May 30, 2026. Photo: Andrew Harrill/Getty Images",
    paragraphs: [
      "The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment and the removal of enriched uranium stockpiles, according to officials familiar with the matter.",
      "The proposal, delivered through Omani intermediaries, also demands unrestricted inspector access to all nuclear sites, including military facilities, and adds new verification measures that go beyond the 2015 accord.",
      "Iran has not responded officially, but its leadership has said repeatedly that any agreement must respect the country's right to peaceful nuclear energy and include meaningful sanctions relief.",
      "U.S. officials warn that Washington is prepared to take other action if diplomacy fails, while European allies continue to urge sustained negotiations and caution against escalation.",
      "Israel supports the tougher stance, with officials praising the administration's determination to prevent Iran from acquiring nuclear weapons.",
      "Negotiators are expected to convene again through the Omani channel in the coming weeks, as both sides weigh the costs of a breakdown against the demands of a revised accord.",
    ],
  },
  biasAnalysis: {
    overallLabel: "right",
    distribution: { left: 20, center: 31, right: 49 },
    basedOn: "Based on 12 balanced sources",
    note: "Our analysis is based on the political leaning of the publication and how the story is framed. Sources are weighted by reliability and recency.",
  },
  aiSummary: {
    generatedAt: "May 31, 2026",
    readMinutes: 3,
    points: [
      "The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment and the removal of enriched uranium stockpiles.",
      "The proposal also demands unrestricted inspector access to all nuclear sites, including military facilities.",
      "Iran has not responded officially but says any deal must respect its right to peaceful nuclear energy and include sanctions relief.",
      "The U.S. warns it is prepared to take other action if diplomacy fails, while European allies urge continued negotiations.",
      "Israel supports the tougher stance, praising the administration's determination to prevent Iran from acquiring nuclear weapons.",
    ],
    disclaimer: "AI summaries can make mistakes.",
  },
  sourceBreakdown: {
    totalSources: 12,
    tallies: [
      { label: "left", count: 2, percent: 20 },
      { label: "center", count: 4, percent: 31 },
      { label: "right", count: 6, percent: 49 },
    ],
    topSources: [
      { name: "Fox News", bias: "right" },
      { name: "The Wall Street Journal", bias: "center" },
      { name: "Reuters", bias: "center" },
      { name: "BBC", bias: "center" },
      { name: "CNN", bias: "left" },
      { name: "The New York Times", bias: "center" },
      { name: "The Washington Post", bias: "center" },
      { name: "Newsmax", bias: "right" },
    ],
  },
  relatedStories: [
    {
      slug: "iran-maximum-pressure-negotiations",
      category: "World",
      region: "Middle East",
      title: "Iran Says It Will Not Negotiate Under 'Maximum Pressure'",
      date: "May 29, 2026",
      readMinutes: 8,
      imageUrl: "/images/article/related-01.svg",
    },
    {
      slug: "bipartisan-diplomacy-iran",
      category: "Politics",
      region: "United States",
      title: "Bipartisan Group Urges Diplomacy With Iran",
      date: "May 28, 2026",
      readMinutes: 7,
      imageUrl: "/images/article/related-02.svg",
    },
    {
      slug: "us-sanctions-iranian-entities",
      category: "World",
      region: "Middle East",
      title: "US Sanctions More Iranian Entities Over Nuclear Program",
      date: "May 26, 2026",
      readMinutes: 9,
      imageUrl: "/images/article/related-03.svg",
    },
    {
      slug: "iran-nuclear-deal-2015-explainer",
      category: "Science",
      region: "Nuclear Policy",
      title: "What's in the 2015 Iran Nuclear Deal?",
      date: "May 25, 2026",
      readMinutes: 10,
      imageUrl: "/images/article/related-04.svg",
    },
    {
      slug: "oman-us-iran-talks",
      category: "World",
      region: "Middle East",
      title: "Oman Hosts Another Round of US-Iran Nuclear Talks",
      date: "May 27, 2026",
      readMinutes: 7,
      imageUrl: "/images/article/related-05.svg",
    },
    {
      slug: "israel-red-line-iran",
      category: "World",
      region: "Middle East",
      title: "Israel Reaffirms Red Line Over Iranian Nuclear Program",
      date: "May 24, 2026",
      readMinutes: 6,
      imageUrl: "/images/article/related-06.svg",
    },
  ],
};

const knownSlugs = new Set([
  defaultArticle.meta.slug,
  ...homeArticles.map((article) => article.slug),
  ...defaultArticle.relatedStories.map((story) => story.slug),
]);

export function getArticleBySlug(slug: string): ArticleDetail | null {
  if (slug === defaultArticle.meta.slug) {
    return defaultArticle;
  }
  // 首页卡片与相关文章共用的演示回退：展示同一篇完整详情数据。
  return knownSlugs.has(slug) ? defaultArticle : null;
}

export const articleSlugs = [...knownSlugs];
