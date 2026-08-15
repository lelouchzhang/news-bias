import "server-only";

/**
 * 校验 x-biasly-admin-secret 请求头（session 15）。
 * 缺失或错误的密钥一律拒绝。
 */
export function isAuthorizedAdminRequest(
  request: Request,
): { ok: true } | { ok: false; status: 401; message: string } {
  const expected = process.env.BIASLY_ADMIN_SECRET;
  if (!expected) {
    return {
      ok: false,
      status: 401,
      message: "BIASLY_ADMIN_SECRET is not configured on the server",
    };
  }

  const provided = request.headers.get("x-biasly-admin-secret");
  if (!provided || provided !== expected) {
    return {
      ok: false,
      status: 401,
      message: "Missing or invalid admin secret",
    };
  }

  return { ok: true };
}
