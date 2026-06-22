export interface TVChannel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChannelResponse {
  channels: TVChannel[];
  pagination: Pagination;
}

export interface Category {
  name: string;
  count: number;
}
