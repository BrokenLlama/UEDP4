export interface Filters {
  yearMin: number;
  yearMax: number;
  types: string[];
  openAccess: boolean;
  minCitations: number;
  sortBy: string;
  topics: string[]; // OpenAlex field IDs
}

export interface ResearchTopic {
  id: string;
  name: string;
  displayName: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export const PUBLICATION_TYPES: FilterOption[] = [
  { value: 'article', label: 'Article' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'book', label: 'Book' },
  { value: 'book-chapter', label: 'Book Chapter' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'dissertation', label: 'Dissertation' }
];

export const CITATION_OPTIONS: FilterOption[] = [
  { value: '0', label: 'Any' },
  { value: '10', label: '> 10' },
  { value: '50', label: '> 50' },
  { value: '100', label: '> 100' },
  { value: '500', label: '> 500' },
  { value: '1000', label: '> 1,000' }
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'relevance_score:desc', label: 'Most Relevant' },
  { value: 'cited_by_count:desc', label: 'Most Cited' },
  { value: 'publication_date:desc', label: 'Newest' },
  { value: 'publication_date:asc', label: 'Oldest' },
  { value: 'cited_by_count:asc', label: 'Least Cited' }
];

export const RESEARCH_TOPICS: ResearchTopic[] = [
  { id: 'computer-science', name: 'Computer Science', displayName: 'Computer Science' },
  { id: 'medicine', name: 'Medicine', displayName: 'Medicine' },
  { id: 'biology', name: 'Biology', displayName: 'Biology' },
  { id: 'physics', name: 'Physics', displayName: 'Physics' },
  { id: 'chemistry', name: 'Chemistry', displayName: 'Chemistry' },
  { id: 'engineering', name: 'Engineering', displayName: 'Engineering' },
  { id: 'mathematics', name: 'Mathematics', displayName: 'Mathematics' },
  { id: 'psychology', name: 'Psychology', displayName: 'Psychology' },
  { id: 'economics', name: 'Economics', displayName: 'Economics' },
  { id: 'environmental-science', name: 'Environmental Science', displayName: 'Environmental Science' },
  { id: 'materials-science', name: 'Materials Science', displayName: 'Materials Science' },
  { id: 'neuroscience', name: 'Neuroscience', displayName: 'Neuroscience' },
  { id: 'artificial-intelligence', name: 'Artificial Intelligence', displayName: 'Artificial Intelligence' },
  { id: 'machine-learning', name: 'Machine Learning', displayName: 'Machine Learning' },
  { id: 'climate-change', name: 'Climate Change', displayName: 'Climate Change' },
  { id: 'cancer-research', name: 'Cancer Research', displayName: 'Cancer Research' },
  { id: 'genetics', name: 'Genetics', displayName: 'Genetics' },
  { id: 'energy', name: 'Energy', displayName: 'Energy' },
  { id: 'social-sciences', name: 'Social Sciences', displayName: 'Social Sciences' },
  { id: 'education', name: 'Education', displayName: 'Education' }
];

export const DEFAULT_FILTERS: Filters = {
  yearMin: 2020,
  yearMax: 2024,
  types: ['article', 'preprint'],
  openAccess: false,
  minCitations: 0,
  sortBy: 'relevance_score:desc',
  topics: []
};
