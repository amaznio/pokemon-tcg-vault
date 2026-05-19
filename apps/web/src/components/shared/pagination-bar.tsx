import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getPageItems = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push('ellipsis');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < totalPages - 1) items.push('ellipsis');

  items.push(totalPages);
  return items;
};

export function PaginationBar({
  page,
  totalCount,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = clamp(page, 1, totalPages);
  const pageItems = getPageItems(currentPage, totalPages);

  const goToPage = (nextPage: number) => onPageChange(clamp(nextPage, 1, totalPages));

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          />
        </PaginationItem>

        {pageItems.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={item === currentPage}
                onClick={() => goToPage(item)}
                aria-label={`Go to page ${item}`}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
