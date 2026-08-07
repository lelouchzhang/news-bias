-- ============================================================================
-- biasly 演示种子数据（幂等，可在 SQL Editor 重复执行）
-- 内容来自原 mock 数据，仅用于验证「UI 只展示已存储数据」。
-- 真实数据由抓取 + AI 分析流水线写入（§16/§19），seed 不替代抓取流程。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- sources
-- ----------------------------------------------------------------------------
insert into public.sources (id, name, listing_url, parser_strategy, active, logo_url)
values
  ('10000000-0000-4000-8000-000000000001', 'Reuters',      'https://www.reuters.com/',     null, true, null),
  ('10000000-0000-4000-8000-000000000002', 'BBC News',     'https://www.bbc.com/news',     null, true, null),
  ('10000000-0000-4000-8000-000000000003', 'NPR',          'https://www.npr.org/',         null, true, null),
  ('10000000-0000-4000-8000-000000000004', 'Fox News',     'https://www.foxnews.com/',     null, true, null),
  ('10000000-0000-4000-8000-000000000005', 'The Guardian', 'https://www.theguardian.com/', null, true, null)
on conflict (listing_url) do update set
  name = excluded.name,
  parser_strategy = excluded.parser_strategy,
  active = excluded.active,
  logo_url = excluded.logo_url;

-- ----------------------------------------------------------------------------
-- articles（analyzed_at 全部设置，确保首页可见）
-- raw_text 以空行（\n\n）分隔段落，供详情页拆段展示。
-- ----------------------------------------------------------------------------
insert into public.articles (
  id, source_id, original_url, canonical_url, slug, title,
  image_url, published_at, raw_text, analyzed_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'https://www.reuters.com/world/middle-east/trump-iran-peace-proposal-2026-05-31/',
    'https://www.reuters.com/world/middle-east/trump-iran-peace-proposal-2026-05-31/',
    'trump-iran-peace-proposal',
    'Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report',
    '/images/article/hero.svg',
    '2026-05-31T09:30:00Z',
    E'The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment and the removal of enriched uranium stockpiles, according to officials familiar with the matter.\n\nThe proposal, delivered through Omani intermediaries, also demands unrestricted inspector access to all nuclear sites, including military facilities, and adds new verification measures that go beyond the 2015 accord.\n\nIran has not responded officially, but its leadership has said repeatedly that any agreement must respect the country''s right to peaceful nuclear energy and include meaningful sanctions relief.\n\nU.S. officials warn that Washington is prepared to take other action if diplomacy fails, while European allies continue to urge sustained negotiations and caution against escalation.',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'https://www.bbc.com/news/health/grapes-superfood-evidence',
    'https://www.bbc.com/news/health/grapes-superfood-evidence',
    'grapes-superfood-evidence',
    'Researchers Make Case for Grapes as a ''Superfood'' After Review of Health Evidence',
    '/images/home/card-02.svg',
    '2026-05-30T14:00:00Z',
    E'Researchers reviewing dozens of nutrition studies say grapes deserve serious consideration as a "superfood," citing evidence linking regular consumption to improved heart health and lower markers of inflammation.\n\nThe review, published in a peer-reviewed journal, consolidates findings from human trials and laboratory research rather than relying on any single study.\n\nNutritionists caution that no single food can offset an otherwise poor diet, but note that grapes are affordable, widely available and easy to add to a daily routine.\n\nThe authors call for larger, longer-term trials to confirm whether the observed benefits translate into meaningful reductions in chronic disease.',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'https://www.npr.org/sections/science/2026/05/30/cern-physics-beyond-standard-model',
    'https://www.npr.org/sections/science/2026/05/30/cern-physics-beyond-standard-model',
    'cern-physics-beyond-standard-model',
    'CERN Finds High-Significance Hint of Physics Beyond Standard Model',
    '/images/home/card-03.svg',
    '2026-05-30T11:15:00Z',
    E'Physicists at CERN say a new analysis shows a high-significance anomaly that could point to physics beyond the Standard Model, though they caution that more data is needed to rule out statistical fluctuation.\n\nThe signal appears in a decay channel that has produced conflicting results in previous runs, making the team cautious about declaring a discovery.\n\nIndependent groups are now reanalyzing the data, and the collaboration plans additional runs later this year to increase sensitivity.\n\nIf confirmed, the finding would be the first clear crack in the Standard Model since the discovery of the Higgs boson.',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'https://www.foxnews.com/world/brooklyn-rivera-nicaragua-death',
    'https://www.foxnews.com/world/brooklyn-rivera-nicaragua-death',
    'brooklyn-rivera-nicaragua-death',
    'Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention',
    '/images/home/card-04.svg',
    '2026-05-29T18:40:00Z',
    E'Brooklyn Rivera, a prominent indigenous rights leader in Nicaragua, has died while in detention, according to family members and human rights groups, nearly three years after his arrest.\n\nHis lawyers said they were not given access to his medical records and raised concerns about the conditions of his confinement in the months before his death.\n\nInternational organizations called for an independent investigation, while the Nicaraguan government has not yet issued a detailed statement on the circumstances.\n\nRivera was widely known for his advocacy on land rights and self-governance for indigenous communities along the Atlantic coast.',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005',
    'https://www.theguardian.com/world/2026/may/30/un-security-council-israel-lebanon',
    'https://www.theguardian.com/world/2026/may/30/un-security-council-israel-lebanon',
    'un-security-council-israel-lebanon',
    'UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon',
    '/images/home/card-05.svg',
    '2026-05-29T08:05:00Z',
    E'The UN Security Council will hold an emergency meeting after Israeli forces advanced deeper into southern Lebanon, escalating a conflict that has already displaced tens of thousands of civilians.\n\nDiplomats said the session was requested by several member states seeking an immediate ceasefire and humanitarian access to affected areas.\n\nIsrael says its operation targets militant infrastructure near the border, while Lebanese officials report heavy civilian casualties and widespread damage.\n\nThe United States called for restraint on all sides, and regional mediators are pressing for a return to the 2024 ceasefire framework.',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    'https://www.reuters.com/business/energy/oil-prices-opec-output-2026-05-29/',
    'https://www.reuters.com/business/energy/oil-prices-opec-output-2026-05-29/',
    'oil-prices-opec-output',
    'Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand',
    '/images/home/card-06.svg',
    '2026-05-28T15:20:00Z',
    E'Oil prices slipped in early trading as OPEC+ delegates signaled they are considering a modest output increase at their next meeting, responding to persistent weakness in global demand.\n\nThe potential adjustment comes after several months of production cuts that have kept markets relatively tight but failed to lift prices above recent ranges.\n\nAnalysts say any increase would likely be small and phased, with the group wary of triggering a sharper sell-off.\n\nTraders are also watching U.S. inventory data and demand signals from China as they gauge the balance for the second half of the year.',
    now()
  )
on conflict (original_url) do update set
  source_id = excluded.source_id,
  canonical_url = excluded.canonical_url,
  slug = excluded.slug,
  title = excluded.title,
  image_url = excluded.image_url,
  published_at = excluded.published_at,
  raw_text = excluded.raw_text,
  analyzed_at = excluded.analyzed_at;

-- ----------------------------------------------------------------------------
-- article_analyses（bias_score 为生成列，不在此写入）
-- ----------------------------------------------------------------------------
insert into public.article_analyses (
  id, article_id, summary, sentiment_score, sentiment_label, bias_label,
  left_percentage, center_percentage, right_percentage,
  confidence, framing_notes, loaded_terms, disclaimer, model
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'The Trump administration has sent Iran a revised nuclear proposal with tougher conditions, including a full halt to enrichment. Iran has not responded, while the U.S. warns of other action and European allies push for continued diplomacy.',
    0.1, 'neutral', 'right',
    20, 31, 49,
    0.82,
    'The article leads with the U.S. position and frames the proposal around pressure and verification, with Iranian objections reported more briefly. Hawkish framing appears in the emphasis on tougher terms and the threat of other action.',
    array['tougher terms', 'complete halt', 'unrestricted access', 'prepared to take other action'],
    'AI summaries can make mistakes.',
    'deepseek-chat'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'A review of nutrition studies argues grapes may qualify as a superfood based on evidence for heart health and lower inflammation, while cautioning that longer trials are needed.',
    0.35, 'positive', 'center',
    18, 42, 40,
    0.74,
    'The tone is balanced and science-led; the health claim is reported with both supporting evidence and expert caution, keeping the framing neutral.',
    array['superfood', 'improved heart health', 'lower markers of inflammation'],
    'AI summaries can make mistakes.',
    'deepseek-chat'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    'CERN reports a high-significance anomaly that could hint at physics beyond the Standard Model, but the collaboration cautions that more data is needed before declaring a discovery.',
    0.05, 'neutral', 'center',
    16, 62, 22,
    0.85,
    'The piece is technical and cautious, emphasizing uncertainty and independent verification rather than hype, which keeps it close to the center.',
    array['high-significance anomaly', 'crack in the Standard Model', 'statistical fluctuation'],
    'AI summaries can make mistakes.',
    'deepseek-chat'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000004',
    'Indigenous leader Brooklyn Rivera died in detention in Nicaragua after nearly three years in custody, his family and human rights groups say, prompting calls for an independent investigation.',
    -0.45, 'negative', 'left',
    54, 28, 18,
    0.77,
    'The reporting emphasizes detention conditions and rights concerns, and the absence of official detail from the government tilts the framing toward criticism of the authorities.',
    array['died while in detention', 'concerns about conditions', 'independent investigation'],
    'AI summaries can make mistakes.',
    'deepseek-chat'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000005',
    'The UN Security Council will hold an emergency meeting after Israeli forces pushed deeper into Lebanon, as diplomats seek a ceasefire and humanitarian access amid heavy civilian casualties.',
    -0.3, 'negative', 'right',
    26, 33, 41,
    0.79,
    'The article gives weight to Israeli security justifications alongside Lebanese casualty reports, with the military operation described in terms that lean toward official security framing.',
    array['advanced deeper', 'militant infrastructure', 'heavy civilian casualties', 'emergency meeting'],
    'AI summaries can make mistakes.',
    'deepseek-chat'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000006',
    'Oil prices dipped as OPEC+ considers a modest output increase in response to weak global demand, with analysts expecting any change to be small and phased.',
    0.0, 'neutral', 'center',
    25, 50, 25,
    0.81,
    'Market reporting stays close to the center, attributing price moves to supply signals and demand data without taking a side on policy.',
    array['output increase', 'weak global demand', 'modest adjustment'],
    'AI summaries can make mistakes.',
    'deepseek-chat'
  )
on conflict (article_id) do update set
  summary = excluded.summary,
  sentiment_score = excluded.sentiment_score,
  sentiment_label = excluded.sentiment_label,
  bias_label = excluded.bias_label,
  left_percentage = excluded.left_percentage,
  center_percentage = excluded.center_percentage,
  right_percentage = excluded.right_percentage,
  confidence = excluded.confidence,
  framing_notes = excluded.framing_notes,
  loaded_terms = excluded.loaded_terms,
  disclaimer = excluded.disclaimer,
  model = excluded.model,
  updated_at = now();
