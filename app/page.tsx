import { CategoryBar } from "@/components/home/category-bar";
import { Footer } from "@/components/home/footer";
import { Header } from "@/components/home/header";
import { NewsCard } from "@/components/home/news-card";
import { TopBar } from "@/components/home/top-bar";
import { homeArticles } from "@/lib/home/mock-articles";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Header />
      <CategoryBar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <h1 className="text-h2 font-bold text-text-primary">Top News</h1>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homeArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
