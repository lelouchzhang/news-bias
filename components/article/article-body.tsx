export function ArticleBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-5">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-body-lg text-text-primary">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
