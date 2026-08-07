import { CategoryBar } from "@/components/home/category-bar";
import { Footer } from "@/components/home/footer";
import { Header } from "@/components/home/header";
import { NewsCard } from "@/components/home/news-card";
import { TopBar } from "@/components/home/top-bar";
import { getHomeArticles } from "@/lib/supabase/queries/articles";

// 首页数据来自 Supabase，且尚未建表/无数据时也要保证构建可通过：
// 请求时渲染，不在构建期预渲染查询数据库（Next 16 非 Cache Components 模型）。
export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await getHomeArticles();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Header />
      <CategoryBar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <h1 className="text-h2 font-bold text-text-primary">Top News</h1>
          {articles.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-body-md text-text-secondary">
              No analyzed articles yet. Check back soon.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
