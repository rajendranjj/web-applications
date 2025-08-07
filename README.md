# Jira Bug Analysis Dashboard

A comprehensive, modern dashboard for analyzing and tracking bug data from Jira. Built with Next.js, TypeScript, and Tailwind CSS for superior performance and user experience.

## Features

- 📊 **Real-time Analytics** - Comprehensive metrics and KPIs for triaged bugs
- 📈 **Interactive Charts** - Priority distribution, status trends, and component analysis
- 🔍 **Advanced Filtering** - Search and filter by status, priority, assignee, and more
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Optimized for speed with Next.js and TypeScript
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Jira account with API access

### Installation

1. **Clone and setup**
   ```bash
   cd /Users/rajendran/Documents/Jira-Bug-Analysis-Dashboard
   npm install
   ```

2. **Configure Jira API**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Jira credentials:
   ```env
   NEXT_PUBLIC_JIRA_BASE_URL=https://your-domain.atlassian.net
   NEXT_PUBLIC_JIRA_USERNAME=your-email@company.com
   NEXT_PUBLIC_JIRA_API_TOKEN=your-api-token
   NEXT_PUBLIC_JIRA_PROJECT_KEY=YOUR_PROJECT
   ```

3. **Run the dashboard**
   ```bash
   npm run dev
   ```

4. **Access the dashboard**
   Open [http://localhost:3001](http://localhost:3001) in your browser

## Dashboard Sections

### 📊 Metrics Overview
- Total bugs count
- Triaged vs resolved statistics  
- Priority breakdown (Critical, High, Medium, Low)
- Average triage and resolution times

### 📈 Analytics & Charts
- **Priority Distribution** - Pie chart showing bug distribution by priority
- **Status Distribution** - Current status breakdown of all bugs
- **Component Analysis** - Bar chart of bugs by component/module
- **30-Day Trend** - Line chart showing triaged vs resolved bugs over time

### 📋 Bugs List
- Sortable table with all bugs
- Search functionality across bug keys and summaries
- Filter by status, priority, assignee
- Direct links to view bugs in Jira

## Configuration

### Jira API Setup

1. **Generate API Token**
   - Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Create a new token
   - Copy the token to your `.env.local` file

2. **Project Configuration**
   - Update `NEXT_PUBLIC_JIRA_PROJECT_KEY` with your project key
   - Modify the JQL query in `src/lib/jiraApi.ts` if needed

### Customization

#### Custom Fields
To track additional Jira custom fields, update the `JiraIssue` type in `src/types/jira.ts`:

```typescript
customFields?: {
  triageDate?: string;
  triageStatus?: string;
  triagePriority?: string;
  // Add your custom fields here
  customField1?: string;
  customField2?: number;
}
```

#### Styling
- Colors and themes: `tailwind.config.js`
- Component styles: `src/app/globals.css`
- Individual component styling: Each component file

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main dashboard page
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── Header.tsx      # Navigation header
│   ├── MetricsOverview.tsx  # KPI metrics cards
│   ├── ChartsSection.tsx    # Charts and analytics
│   └── BugsList.tsx    # Bugs data table
├── lib/               # Utility functions
│   └── jiraApi.ts     # Jira API integration
└── types/             # TypeScript types
    └── jira.ts        # Jira data types
```

### Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Adding New Features

1. **New Chart Type**
   - Add chart component to `ChartsSection.tsx`
   - Update data processing in `jiraApi.ts`

2. **Additional Metrics**
   - Update `BugMetrics` type in `types/jira.ts`
   - Modify `calculateBugMetrics` function
   - Add new metric cards to `MetricsOverview.tsx`

3. **Custom Filters**
   - Extend filter state in `BugsList.tsx`
   - Add new filter UI components
   - Update filtering logic

## Production Deployment

### Environment Variables
Set these in your production environment:
```env
NEXT_PUBLIC_JIRA_BASE_URL=your-production-jira-url
NEXT_PUBLIC_JIRA_USERNAME=service-account-email
NEXT_PUBLIC_JIRA_API_TOKEN=production-api-token
```

### Build & Deploy
```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your Jira instance allows the dashboard domain
   - Check Next.js API rewrites in `next.config.js`

2. **Authentication Failures**
   - Verify API token is valid and not expired
   - Check username format (usually email address)

3. **No Data Showing**
   - Verify project key is correct
   - Check JQL query matches your bug structure
   - Review browser console for API errors

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages and API logs.

## Security Notes

- API tokens should never be committed to version control
- Use service accounts for production deployments
- Regularly rotate API tokens
- Implement proper access controls for the dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Jira API documentation
- Create an issue in the repository