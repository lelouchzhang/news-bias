import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiSummaryCard } from "@/components/article/ai-summary-card";
import { ArticleBody } from "@/components/article/article-body";
import { ArticleHeader } from "@/components/article/article-header";
import { ArticleHero } from "@/components/article/article-hero";
import { BiasAnalysisCard } from "@/components/article/bias-analysis-card";
import { BiasDistribution } from "@/components/article/bias-distribution";
import { SubscribeBar } from "@/components/article/subscribe-bar";
import { CategoryBar } from "@/components/home/category-bar";
import { Footer } from "@/components/home/footer";
import { Header } from "@/components/home/header";
import { TopBar } from "@/components/home/top-bar";
import { getArticleBySlug } from "@/lib/supabase/queries/articles";

// 详情页同样请求时渲染，避免构建期预渲染查询数据库。
export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | biasly News" };
  }

  return {
    title: `${article.title} | biasly News`,
    description: article.analysis.summary,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { analysis, paragraphs } = article;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Header />
      <CategoryBar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <ArticleHeader
                title={article.title}
                sourceName={article.sourceName}
                publishedAt={article.publishedAt}
                readMinutes={article.readMinutes}
              />
              <div className="mt-6">
                <ArticleHero title={article.title} imageUrl={article.imageUrl} />
              </div>
              <div className="mt-6">
                <BiasDistribution
                  left={analysis.left}
                  center={analysis.center}
                  right={analysis.right}
                />
              </div>
              <div className="mt-6">
                <ArticleBody paragraphs={paragraphs} />
              </div>
            </div>

            <aside className="min-w-0 space-y-6">
              <BiasAnalysisCard
                analysis={{
                  biasLabel: analysis.biasLabel,
                  left: analysis.left,
                  center: analysis.center,
                  right: analysis.right,
                  confidence: analysis.confidence,
                  framingNotes: analysis.framingNotes,
                  sentimentLabel: analysis.sentimentLabel,
                  sentimentScore: analysis.sentimentScore,
                }}
              />
              <AiSummaryCard
                summary={{
                  summary: analysis.summary,
                  loadedTerms: analysis.loadedTerms,
                  disclaimer: analysis.disclaimer,
                  generatedAt: analysis.generatedAt,
                }}
              />
            </aside>
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
