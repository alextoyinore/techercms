
'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
};

export function PaginationControls({ 
    currentPage, 
    totalPages, 
    onPageChange,
    pageSize,
    onPageSizeChange,
    totalItems,
}: PaginationControlsProps) {

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange(Number(value));
    onPageChange(1); // Reset to first page
  }
  
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-end space-x-6 p-4 text-sm">
      <div className="flex items-center space-x-2">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map(size => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="font-medium">
        {from}-{to} of {totalItems}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
           <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  );
}
