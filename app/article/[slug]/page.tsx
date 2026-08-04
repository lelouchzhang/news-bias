import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article/article-body";
import { ArticleHeader } from "@/components/article/article-header";
import { ArticleHero } from "@/components/article/article-hero";
import { AiSummaryCard } from "@/components/article/ai-summary-card";
import { BiasAnalysisCard } from "@/components/article/bias-analysis-card";
import { BiasDistribution } from "@/components/article/bias-distribution";
import { RelatedStories } from "@/components/article/related-stories";
import { SourceBreakdownCard } from "@/components/article/source-breakdown-card";
import { SubscribeBar } from "@/components/article/subscribe-bar";
import { CategoryBar } from "@/components/home/category-bar";
import { Footer } from "@/components/home/footer";
import { Header } from "@/components/home/header";
import { TopBar } from "@/components/home/top-bar";
import {
  articleSlugs,
  getArticleBySlug,
} from "@/lib/article/mock-article-details";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articleSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | biasly News" };
  }

  return {
    title: `${article.meta.title} | biasly News`,
    description: article.aiSummary.points[0],
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { meta, biasAnalysis, aiSummary, sourceBreakdown, relatedStories } =
    article;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Header />
      <CategoryBar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <ArticleHeader article={meta} />
              <div className="mt-6">
                <ArticleHero article={meta} />
              </div>
              <div className="mt-6">
                <BiasDistribution
                  distribution={biasAnalysis.distribution}
                  sourceCount={sourceBreakdown.totalSources}
                />
              </div>
              <div className="mt-6">
                <ArticleBody paragraphs={meta.paragraphs} />
              </div>
            </div>

            <aside className="min-w-0 space-y-6">
              <BiasAnalysisCard analysis={biasAnalysis} />
              <AiSummaryCard summary={aiSummary} />
              <SourceBreakdownCard breakdown={sourceBreakdown} />
            </aside>
          </div>

          <div className="mt-12">
            <RelatedStories stories={relatedStories} />
          </div>
          <div className="mt-10">
            <SubscribeBar />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
