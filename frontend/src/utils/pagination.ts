export const clampPage = (page: number, totalPages: number): number =>
  Number.isInteger(page) && Number.isInteger(totalPages)
    ? Math.min(Math.max(1, page), Math.max(1, totalPages))
    : 1;

const validPageSize = (size: number): number =>
  Number.isFinite(size) && size >= 1 ? size : 1;

export const getPageCount = (totalItems: number, pageSize: number): number =>
  Math.max(1, Math.ceil(totalItems / validPageSize(pageSize)));

export const paginate = <T,>(items: readonly T[], page: number, pageSize: number) => {
  const total = items.length;
  const size = validPageSize(pageSize);
  const pageCount = getPageCount(total, size);
  const current = clampPage(page, pageCount);
  const offset = Math.floor((current - 1) * size);
  const end = Math.min(total, Math.floor(current * size));

  return {
    items: items.slice(offset, end),
    page: current,
    pageCount,
    start: total ? offset + 1 : 0,
    end,
    total,
  };
};

export const getPageNumbers = (page: number, pageCount: number): (number | "ellipsis")[] => {
  if (!Number.isInteger(pageCount) || pageCount < 1) return [1];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const current = clampPage(page, pageCount);
  const candidates = [1, current - 1, current, current + 1, pageCount];
  const numbers: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const number of candidates) {
    if (number <= previous || number > pageCount) continue;
    const gap = number - previous;
    if (gap > 1) numbers.push(gap === 2 ? previous + 1 : "ellipsis");
    numbers.push(number);
    previous = number;
  }

  return numbers;
};
