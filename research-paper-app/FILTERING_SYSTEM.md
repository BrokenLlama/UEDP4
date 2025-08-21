# Research Paper Filtering System

A comprehensive filtering system for OpenAlex research papers built with Next.js and TypeScript.

## Features

### 6 Essential Filters

1. **Year Range** (2020-2024)
   - Dual range sliders for min/max year selection
   - Real-time updates with visual feedback
   - Range: 1900-2024

2. **Publication Type**
   - Checkbox selection for multiple types
   - Options: Article, Preprint, Book, Book Chapter, Dataset, Dissertation
   - Multi-select functionality

3. **Open Access**
   - Toggle switch for open access papers only
   - Boolean filter with clear visual indication

4. **Citation Count**
   - Dropdown with predefined thresholds
   - Options: Any, >10, >50, >100, >500, >1,000
   - Configurable minimum citation requirements

5. **Sort By**
   - Dropdown for result ordering
   - Options: Most Relevant, Most Cited, Newest, Oldest, Least Cited
   - Real-time sorting updates

6. **Research Topics**
   - Searchable dropdown with 20 major research fields
   - Multi-select with tag display
   - Pre-populated with popular fields:
     - Computer Science, Medicine, Biology, Physics, Chemistry
     - Engineering, Mathematics, Psychology, Economics
     - Environmental Science, Materials Science, Neuroscience
     - Artificial Intelligence, Machine Learning, Climate Change
     - Cancer Research, Genetics, Energy, Social Sciences, Education

## Technical Implementation

### Components

- `SearchFilters.tsx` - Main filter panel component
- `SearchResults.tsx` - Results display with filter integration
- `EnhancedSearchInterface.tsx` - Enhanced search with filtering

### API Integration

- Updated `/api/search-papers.ts` to support filter parameters
- Enhanced `OpenAlexClient` with filter conversion methods
- Backward compatibility with existing search functionality

### State Management

```typescript
interface Filters {
  yearMin: number;
  yearMax: number;
  types: string[];
  openAccess: boolean;
  minCitations: number;
  sortBy: string;
  topics: string[]; // OpenAlex field IDs
}
```

### OpenAlex API Mapping

| Filter | OpenAlex Parameter | Example |
|--------|-------------------|---------|
| Year Range | `publication_year` | `2020-2024` |
| Publication Type | `type` | `article\|preprint` |
| Open Access | `is_oa` | `true` |
| Citation Count | `cited_by_count` | `>100` |
| Sort | `sort` | `cited_by_count:desc` |
| Topics | `concepts.id` | `concepts.id:computer-science` |

## User Experience Features

### Mobile Responsive
- Collapsible filter panel on mobile
- Touch-friendly controls
- Responsive grid layout

### Persistence
- Filters saved to localStorage
- Automatic restoration on page reload
- Session persistence across searches

### Visual Feedback
- Active filter count badge
- Result count updates
- Loading states and error handling
- Clear visual indicators for selected filters

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus management

## Usage Examples

### Basic Search with Filters
```typescript
const filters: Filters = {
  yearMin: 2020,
  yearMax: 2024,
  types: ['article', 'preprint'],
  openAccess: true,
  minCitations: 100,
  sortBy: 'cited_by_count:desc',
  topics: ['computer-science', 'artificial-intelligence']
};
```

### API Call
```typescript
const response = await fetch('/api/search-papers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'machine learning',
    limit: 25,
    filters: filters
  })
});
```

## Demo

Visit `/demo` to see the filtering system in action with example data.

## Customization

### Adding New Filters
1. Update the `Filters` interface
2. Add filter options to constants
3. Update the `convertFiltersToOpenAlex` method
4. Add UI components to `SearchFilters.tsx`

### Styling
- Custom CSS for range sliders
- Tailwind CSS classes for responsive design
- Dark mode support
- Custom scrollbars for dropdowns

## Performance Considerations

- Debounced filter updates to prevent excessive API calls
- Client-side caching with localStorage
- Efficient re-rendering with React hooks
- Optimized API parameter building

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## Future Enhancements

- Advanced search operators
- Filter presets and saved searches
- Export filtered results
- Collaborative filtering
- AI-powered filter suggestions
