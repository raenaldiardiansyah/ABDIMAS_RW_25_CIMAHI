import type { PageMeta } from "@abdimas/contracts";

export function getOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export function buildPageMeta(params: {
  page: number;
  limit: number;
  total: number;
}): PageMeta {
  const totalPages = params.total === 0 ? 0 : Math.ceil(params.total / params.limit);

  return {
    page: params.page,
    limit: params.limit,
    total: params.total,
    totalPages,
    isNext: params.page < totalPages,
  };
}
