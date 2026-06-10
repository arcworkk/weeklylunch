import { ChevronLeftIcon, ChevronRightIcon } from "./ActionIcons";

type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="ghost-button icon-button"
        aria-label="Page precedente"
        title="Page precedente"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeftIcon />
      </button>
      <span>
        Page <strong>{currentPage}</strong> sur {totalPages}
      </span>
      <button
        type="button"
        className="ghost-button icon-button"
        aria-label="Page suivante"
        title="Page suivante"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
};
