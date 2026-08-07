import "server-only";

/** 分析模型名称（千问 AI 平台 OpenAI 兼容协议）。 */
export const DEFAULT_ANALYSIS_MODEL = "qwen3.7-plus";

/** 千问 AI 平台（sk-ws- 密钥）OpenAI 兼容端点。 */
export const DEFAULT_ANALYSIS_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

/** OpenAI 兼容 provider 名称，也用作 providerOptions 命名空间。 */
export const PROVIDER_NAME = "qwen";

/** 传给模型的 raw_text 最大字符数。 */
export const ANALYSIS_MAX_CHARS = 8000;

/** 无效/失败输出最多重试次数（重试一次）。 */
export const ANALYSIS_RETRY_LIMIT = 1;

/** 单次模型调用超时（毫秒）。 */
export const ANALYSIS_TIMEOUT_MS = 120_000;

/** 结构化输出最大 token 数。 */
export const ANALYSIS_MAX_OUTPUT_TOKENS = 4096;

/** 每批次分析文章数（ANALYSIS_BATCH_SIZE 缺省值）。 */
export const DEFAULT_BATCH_SIZE = 5;
