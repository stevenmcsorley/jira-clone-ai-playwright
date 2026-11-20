import { getPageNumbers } from "../../utils/pagination";
import type { PaginationProps } from "./Pagination.types";

const button = "rounded border px-3 py-1 text-sm max-md:min-h-11 max-md:min-w-11";
const inactive = "border-gray-300 bg-white text-gray-700 hover:bg-gray-100";
const direction = `${button} ${inactive} disabled:cursor-not-allowed disabled:opacity-40`;

export const Pagination = ({ page, pageCount, onPageChange, label, className }: PaginationProps) => {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={label ?? "Pagination"}
      data-testid="pagination"
      className={["flex flex-wrap items-center justify-center gap-1", className].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        aria-label="Previous page"
        data-testid="pagination-prev"
        className={direction}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="px-2 text-sm text-gray-600 sm:hidden">Page {page} of {pageCount}</span>
      <div className="hidden items-center gap-1 sm:flex">
        {getPageNumbers(page, pageCount).map((number, index) =>
          number === "ellipsis" ? (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-sm text-gray-400">…</span>
          ) : (
            <button
              key={number}
              type="button"
              aria-current={number === page ? "page" : undefined}
              data-testid={`pagination-page-${number}`}
              className={`${button} ${number === page ? "border-blue-600 bg-blue-600 text-white" : inactive}`}
              onClick={() => onPageChange(number)}
            >
              {number}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        aria-label="Next page"
        data-testid="pagination-next"
        className={direction}
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
};
